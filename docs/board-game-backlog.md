# Rink Quest — Board Game Backlog

The rules spec is [board-game-design.md](./board-game-design.md). Work happens on branch `rink-quest-phase2`. The PM (Claude) hands tickets to two Sonnet agents: **Agent A** builds the engine (pure TypeScript) and **Agent B** builds the UI (React). Chris makes every executive decision.

## Agent Rules (read this section fully, every ticket)

**Architecture (from `docs/architecture.md`, condensed):**
- Everything goes in `react/src/features/board-game/`, split into these subfolders:
  - `types/`: contracts only.
  - `data/`: constants and tables, no logic.
  - `engine/`: pure TypeScript with **no React imports**. It may import `types/` and `data/`.
  - `ai/`: pure; may import `engine/`, `types/`, `data/`.
  - `hooks/`: React state and orchestration.
  - `components/`: React UI plus colocated `*.module.css`.
- Allowed import directions: `components → hooks → ai → engine → data → types`. Importing backward or skipping layers is fine; importing upward is not (e.g. `engine` must never import `hooks` or `components`).
- **No imports from other features** (`@/features/*`). Shared pieces may come from `@/components/*` or `@/lib/*`. No API calls, no network, no `localStorage`.
- Imports always use `@/…` aliases, including same-folder modules, `.module.css`, and tests. Never use `./x` or `../../`; this matches the rest of `features/`.
- Pages render `<PageHeader />` (`@/components/PageHeader`) first, like every other page.
- Styling uses CSS modules with tokens from `react/src/styles/index.css`. No raw hex in components. If you need a new color, add a token to both `:root` and `[data-theme='dark']`.
- Randomness only comes through `engine/rng.ts` using the seed stored in state. **Never call `Math.random`** in engine, ai, or data code.
- State only changes through `gameReducer`. Components get state and callbacks as props (dumb) unless the ticket says otherwise.

**Process:**
- **Executive decisions go to the PM.** If the design doc is silent, contradicts itself, or you'd change scope, a contract, or a file layout, STOP. End your turn with a `QUESTION:` block containing options plus your recommendation. Don't guess.
- **Reuse, don't duplicate:** before writing a helper, `grep` `features/board-game` (and `@/components`) for an existing one.
- Commit when the ticket is done: `git add` only your files, message `BG-<id>: <summary>`.

**Token efficiency (required):**
- Read only the files and doc sections a ticket lists. Don't explore the repo, and don't read `node_modules` or lockfiles.
- Use `grep -n` for targeted lookups instead of reading whole files. Don't re-read a file after editing it.
- Write each file in one pass where you can. Run checks once at the end, then fix only what failed.
- Keep code comments short. Add JSDoc only on exported functions/types, one line each.
- **Report format (≤ 12 lines):**
  - `DONE BG-x` or `QUESTION`
  - files touched (paths only)
  - check results (pass/fail counts)
  - reuse summary (what you reused / what new shared helper you created)
  - deviations (should be "none")
  - Don't paste code or diffs; the PM reads `git diff`.

**Checks (run from `react/`):**
- `npx tsc --noEmit`
- `pnpm test` (after BG-A1)
- `pnpm build` (UI tickets)
- `pnpm exec prettier --write <your files>`

---

## Agent A — Engine

### BG-A1 Contracts, data tables, RNG, Vitest
- [ ] **Read:** design doc §1–§6. `react/package.json`, `react/vite.config.ts`.
- **Vitest setup:**
  - `pnpm add -D vitest` in `react/`.
  - Add script `"test": "vitest run"`.
  - Add a `test: { include: ['src/features/board-game/**/*.test.ts'], environment: 'node' }` block to `vite.config.ts`, using `/// <reference types="vitest" />`.
  - Ticket 2.13 will widen the include later.
- **`types/game.ts`:** create it with exactly these exports. Adding fields is fine if you say so in the report; renames are not.
  - `TeamId = 'user' | 'cpu'`
  - `Role = 'LW' | 'C' | 'RW' | 'LD' | 'RD' | 'G'`
  - `Coord { col: number; row: number }`
  - `Skater { id: string; team: TeamId; role: Role; pos: Coord; stunnedUntilTurn: number | null }`. The id looks like `user-C`.
  - `Puck = { kind: 'carried'; skaterId: string } | { kind: 'loose'; pos: Coord }`
  - `Phase = 'faceoff' | 'roll' | 'move' | 'duel' | 'duelResult' | 'gameOver'`
  - `DuelKind = 'faceoff' | 'deke' | 'check' | 'intercept' | 'shot'`
  - `CardTag = 'skill' | 'block' | 'shot' | 'check'`
  - `CardEffect = { type: 'damage'; amount: number } | { type: 'block'; amount: number } | { type: 'draw'; amount: number }`
  - `CardDef { id: string; name: string; cost: number; text: string; tags: CardTag[]; allowedIn: DuelKind[] | 'any'; exhaust: boolean; effects: CardEffect[] }`
  - `Deck { drawPile: string[]; hand: string[]; discardPile: string[]; exhaustPile: string[] }`. Entries are card ids.
  - `Intent { kind: 'attack' | 'block'; amount: number }`
  - `Duelist { skaterId: string; poise: number; maxPoise: number; block: number }`
  - `DuelState { kind: DuelKind; attacker: Duelist; defender: Duelist; userSide: 'attacker' | 'defender'; round: number; energy: number; cpuIntent: Intent; receiverId: string | null }`
  - `DuelOutcome { kind: DuelKind; winner: 'attacker' | 'defender'; byKo: boolean; attackerId: string; defenderId: string; goal: boolean; summary: string }`
  - `GameState { phase: Phase; activeTeam: TeamId; turn: number; mp: number; dice: [number, number] | null; skaters: Skater[]; puck: Puck; deck: Deck; duel: DuelState | null; lastOutcome: DuelOutcome | null; winner: TeamId | null; rngSeed: number; actionsThisTurn: number }`
  - `Action` union:
    - `START_FACEOFF`
    - `ROLL_DICE`
    - `MOVE {skaterId, to: Coord}`
    - `PASS {toSkaterId}`
    - `SHOOT`
    - `CHECK {skaterId}`
    - `END_TURN`
    - `PLAY_CARD {handIndex}`
    - `END_DUEL_ROUND`
    - `DISMISS_DUEL_RESULT`
    - `NEW_GAME {seed}`
- **`data/balance.ts`:** `BOARD_COLS=15`, `BOARD_ROWS=7`, `SKATER_POISE=20`, `GOALIE_POISE=30`, `ENERGY=3`, `HAND_SIZE=5`, `MAX_ROUNDS=3`, `COST={move:1, pass:2, shoot:3, check:1}`, perk amounts, `CPU_TURN_ACTION_CAP=20`.
- **`data/rink.ts`:** unplayable corners, goalie tiles, `CREASE_FRONT` per team, offensive-zone column bounds, line columns (for the UI).
- **`data/formations.ts`:** start coords per team and role (§2).
- **`data/cards.ts`:** `CARDS: Record<string, CardDef>` and `STARTER_DECK: string[]` (§5).
- **`data/intents.ts`:** scripts per `'skater' | 'defense' | 'goalie'` (§6).
- **`engine/rng.ts`:** mulberry32. `nextFloat(seed) → [value, nextSeed]`, `rollDie(seed) → [1..6, nextSeed]`, `shuffle<T>(arr, seed) → [T[], nextSeed]`. All pure, never mutate input.
- **Tests:** `engine/rng.test.ts` checks determinism (same seed gives the same output), that dice stay in 1..6, and that shuffle keeps every element.
- **Done:** tsc passes, `pnpm test` passes.

### BG-A2 Rink geometry + deck helpers
- [ ] **Read:** design doc §1, §3, §4 (Deck line). Your A1 files are already in context.
- **`engine/rink.ts`:**
  - `inBounds`, `isPlayable` (in bounds, not a corner, not a goalie tile)
  - `orthNeighbors`, `isAdjacent`, `manhattan`, `sameCoord`
  - `skaterAt(state, coord)`, `isOffensiveZone(team, coord)`
  - `laneBetween(a, b): Coord[] | null`: tiles strictly between two coords in the same row or column, otherwise null
  - `legalSteps(state, skaterId): Coord[]`: empty if the skater is the goalie, stunned, it isn't the move phase, it's not their team's turn, or MP < 1
- **`engine/deck.ts`:** pure, takes a seed, returns a new seed.
  - `createDeck(ids, seed)`
  - `drawCards(deck, n, seed)`: reshuffles the discard pile when the draw pile is empty; stops early if both are empty
  - `discardHand(deck)`
  - `removeFromHand(deck, index, exhaust)`
- **Tests:** `rink.test.ts` and `deck.test.ts`. Cover corners and goalie tiles being unplayable, lanes (including blocked and non-straight cases), `legalSteps` blocking occupied tiles and zero MP, and draw with reshuffle.

### BG-A3 Duel engine
- [ ] **Read:** design doc §4, §6.
- **`engine/duel.ts`:** pure.
  - `createDuel(state, kind, attackerId, defenderId, receiverId?) → GameState`: builds the duelists and the intent for round 1, then draws the hand (C in a faceoff draws +1). Sets phase to `duel`.
  - `canPlayCard(state, handIndex)`: checks cost against energy and `allowedIn`.
  - `playCard(state, handIndex)`: applies effects, perks, exhaust or discard, and damage → block → poise. If that's a KO, it resolves.
  - `endDuelRound(state)`: discards the hand, then CPU clears its block and applies its intent, then checks KO, then round++. It resolves on a timeout; otherwise it clears user block, resets energy, draws, and picks the next intent.
  - `resolveDuel(state, winner, byKo)`: applies the §4 outcome table (puck, stun via `stunnedUntilTurn`, goal → `winner` plus phase `gameOver`). Sets `lastOutcome` and phase `duelResult`, clears `duel`.
- Put the stun math in one helper: `stunUntil(state, team)` returns `turn + 2` if that team is active, else `turn + 1`, so the skater misses exactly its team's next turn (max stun is 1 turn, decided by Chris). The skater counts as stunned while `turn <= stunnedUntilTurn`.
- **Tests:** block absorbs damage, perks apply, disallowed cards are rejected, exhaust works, KO ends the duel mid-round, timeout gives the defender the win (faceoff uses the tie rule), and every row of the outcome table works, including freeze vs rebound.

### BG-A4 Game reducer
- [ ] **Read:** design doc §3.
- **`engine/gameReducer.ts`:**
  - `createInitialState(seed)`: formations, loose puck at `(7,3)`, phase `faceoff`, activeTeam `user`, turn 1.
  - `gameReducer(state, action)`: returns the same state object for an illegal action (no throw). It covers every `Action`:
    - `START_FACEOFF` → `createDuel`.
    - `ROLL_DICE` → mp and dice.
    - `MOVE`: pickup and the deke trigger.
    - `PASS`: lane check, intercept or completion.
    - `SHOOT`, `CHECK`.
    - `END_TURN`: turn++, switch team, phase `roll`, clear expired stuns, reset `actionsThisTurn`.
    - Duel actions delegate to `engine/duel.ts`.
    - `DISMISS_DUEL_RESULT`: back to `move`, or to `roll` for the faceoff winner's team, or stays `gameOver`.
    - `NEW_GAME`.
  - Every board action increments `actionsThisTurn`.
- **Tests:** MP can't be overspent, occupied tiles are blocked, pickup works, the deke trigger picks the defender in role order, stunned skaters don't trigger, pass lane intercept vs completion, shot is only allowed in the zone, turn switching and stun expiry, and illegal actions return the same reference. Plus a seeded replay: the same seed and action list give a deep-equal final state.

### BG-A5 CPU AI + game hook
- [ ] **Read:** design doc §7. `react/src/components/LoadingState.tsx` (hook/component style reference only).
- **`ai/cpuBoardAgent.ts`:** `chooseCpuAction(state): Action`, following §7. It must return a legal action, which a test verifies via the reducer changing state, or `END_TURN`.
- **`hooks/useBoardGame.ts`:**
  - Wraps `useReducer(gameReducer, seed, createInitialState)`.
  - When `activeTeam==='cpu'` and phase is `roll` or `move`, dispatch `chooseCpuAction` after a delay (`CPU_STEP_MS=450`, or 0 when `prefers-reduced-motion` is set). Clean up timers.
  - When the CPU's turn hits `CPU_TURN_ACTION_CAP`, force `END_TURN`.
  - Returns `{ state, dispatch, legalSteps: (id) => Coord[], newGame }`.
- **Tests:** `ai/cpuBoardAgent.test.ts` runs 200 seeded headless games. It auto-plays the user side with the same agent logic mirrored (or a simple scripted policy) and plays duels by picking the first playable card, then ending the round.
  - Every game ends in a goal within 400 turns.
  - Log the win rate once via `console.info`.

---

## Agent B — UI
All components are dumb (props in, callbacks out) until BG-B5. For fixtures, use `createInitialState(1)` if BG-A4 has landed; otherwise build a small `components/__fixtures__/sampleState.ts` that follows `types/game.ts`.

### BG-B1 Route, tokens, rink board
- [ ] **Read:** Agent Rules. `react/src/app/App.tsx`, `react/src/components/QuickLinks.tsx`, `react/src/styles/index.css` (only the `:root` and `[data-theme='dark']` blocks), `types/game.ts`, `data/rink.ts`, `data/balance.ts`.
- **Wiring:**
  - Lazy route `board-game` → `components/BoardGamePage.tsx`, same pattern as the other routes.
  - A "Board Game" `Link` + `Button` in QuickLinks, matching the existing buttons.
- **Tokens** (light + dark): `--color-team-user` (blue), `--color-team-cpu` (red), `--color-ice`, `--color-rink-line-red`, `--color-rink-line-blue`, `--color-tile-highlight`.
- **Components:**
  - `RinkBoard.tsx` + `.module.css`: CSS grid of 15×7 square tiles, sized to fit ~400px wide. Props: `{ skaters, puck, highlighted: Coord[], selectedId, onTileClick(coord), onSkaterClick(id), renderSkater(skater) }`.
  - `RinkTile.tsx`: draws markings from `data/rink.ts`, hides unplayable corners, shows the goal nets.
  - `PuckToken.tsx`
- `BoardGamePage.tsx` renders the board from a fixture for now.
- **Done:** tsc, build. The board is visible at `/#/board-game` in both themes and at 400px wide.

### BG-B2 Pixel sprites
- [ ] **Read:** `types/game.ts`. Nothing else.
- **`data/sprites.ts`:** 16×16 pixel maps as `string[]` rows. Palette chars:
  - `.` transparent
  - `J` jersey, which uses team color via `currentColor`
  - `S` skin
  - `H` helmet
  - `K` stick
  - `P` pants
  - `W` skate
  - One idle frame for skaters, one for the goalie (pads/blocker), and one `skate` frame for movement.
- **`components/SkaterSprite.tsx`:** renders the rects inside an SVG (`shape-rendering: crispEdges`, `image-rendering: pixelated`). `color` comes from the team token. It shows a small role label (LW/C/…), plus props `{ skater, hasPuck, selected, stunned, moving }`.
  - Stunned: dimmed with a "💫" or an equivalent CSS marker.
  - Selected: outlined.
  - Merge rects by row runs to keep the DOM small.
- Plug it into `BoardGamePage` via `renderSkater`.

### BG-B3 Dice, HUD, board interaction props
- [ ] **Read:** Agent Rules. Your B1/B2 files are already in context.
- **`DiceRoller.tsx`:** two pixel-style dice showing `dice`, and a Roll button that's enabled only in the user's `roll` phase. The roll animation respects `prefers-reduced-motion`.
- **`TurnHud.tsx`:** whose turn it is, MP left (pips), and buttons for Pass / Shoot / End Turn.
  - Each button gets an `enabled` flag via props.
  - Pass mode: clicking Pass puts the page in "choose receiver" mode, and the page handles the click.
- **`BoardGamePage.tsx`:** local UI state only (`selectedId`, `mode: 'move' | 'pass'`). It works against a `{ state, dispatch, legalSteps }` prop shape or a temporary local reducer. Clicking an own skater selects it. Clicking a highlighted tile dispatches `MOVE`. In pass mode, clicking a teammate dispatches `PASS`. Clicking an adjacent enemy carrier with a selected skater dispatches `CHECK`.

### BG-B4 Duel screen
- [ ] **Read:** Agent Rules, design doc §4–§5, `data/cards.ts`.
- **Components:**
  - `DuelScreen.tsx` + css: an overlay/modal (`role="dialog"`, focus trapped on open). Props: `{ duel, deck, skaters, onPlayCard(i), onEndRound, canPlay(i) }`.
  - Two duelist panels, each with a sprite (reuse `SkaterSprite`), a poise bar, and a block badge.
  - The CPU's `IntentBadge.tsx` (⚔ attack n / 🛡 block n).
  - Energy orbs, round `x/3`, and the hand made of `CardView.tsx` (cost, name, text, disabled state).
  - Draw and discard pile counts.
- **`DuelResultBanner.tsx`:** shows `lastOutcome.summary` plus a Continue button.
- **Accessibility:** cards are real `<button>`s and the keyboard works (1–5 play a card, E ends the round).

### BG-B5 Wire-up + game over (after BG-A5)
- [ ] **Read:** `hooks/useBoardGame.ts`, your components.
- `BoardGamePage` uses `useBoardGame` and removes the fixtures.
- Phase routing:
  - `faceoff` → a "Drop the puck" button that dispatches `START_FACEOFF`.
  - `duel` → `DuelScreen`.
  - `duelResult` → the banner.
  - `gameOver` → `GameOverModal.tsx` (win/lose, New Game → `NEW_GAME` with `Date.now()` as the seed; that's the only non-engine randomness).
- While it's the CPU's turn, disable user input and show "CPU thinking…".
- **Done:** tsc, test, build all pass. Manual check: play a full match to a goal with no console errors.

---

## Round 2 — decisions from simulation (Chris, 2026-09-12)

### BG-A6 Whistle rule + CPU deck (Agent A)
- [ ] Design doc §3 (Whistle) and §4 (CPU deck).
- **Contract:**
  - `GameState` adds `cpuDeck: Deck` and `whistle: boolean`.
  - `DuelState` replaces `cpuIntent` with `cpuPlan: string[]`.
  - Delete `Intent`, `data/intents.ts`, and the intent code.
- **New file:** `engine/cpuDuelPolicy.ts`, whose `planCpuCards(state): string[]` is pure and deterministic. It lives in `engine/` because it's an NPC rule, and `engine` must not import `ai`.
- **Tests:** re-enable the sim so all 200 seeds end; report the win rate.

### BG-B6 CPU plan + whistle UI (Agent B)
- [ ] `DuelScreen` shows the CPU's `cpuPlan` as small face-up cards in the CPU panel, reusing `CardView` in a compact, non-interactive mode. Delete `IntentBadge`.
- Page shows a whistle notice while `state.whistle` is true.

## Round 3: fairness fix from sim (Red won 0%, because the user always acted first)

### BG-A7 Simultaneous reveal duels (Agent A)
- [ ] Implement design doc §4 "Round loop: secret commit, simultaneous reveal".
- **Contract:**
  - `DuelState` gains `userQueue: string[]`.
  - `GameState` gains `lastReveal: RevealResult | null`.
  - New action `UNQUEUE_CARD {queueIndex}`.
  - Remove `cpuRoundStartPoise` if nothing uses it anymore.
- Re-run the sim and report the Red win rate. Target is 25–60%. Don't tune numbers.

### BG-B7 Hide Red's cards (Agent B)
- [ ] Show card backs for `cpuPlan.length` with no card identities, via a new `CardBack` component.

### BG-B8 Reveal UI (Agent B)
- [ ] User queue row (click to unqueue), energy preview, and a reveal panel built from `lastReveal`.

### QA (Haiku)
- QA-Engine and QA-UI run read-only reviews after each round. The PM triages their findings to Agents A and B.

## Round 4: shots, mobile, game length

### BG-A9 Goalies only block (Agent A)
- [x] Done. The sim showed shots at 99% with `GOALIE_POISE` 30. The PM sweep found 43 gives ~11 turns and 44 gives ~14 turns; the goalie becomes a wall at 50+.

### BG-A10 Game length (Agent A)
- [ ] **Types and data:** `GameLength = 'short' | 'long'`. `GOALIE_POISE_BY_LENGTH = { short: 43, long: 44 }` replaces `GOALIE_POISE`.
- [ ] **State and actions:** `GameState.length`, `createInitialState(seed, length)`, and `NEW_GAME {seed, length}`.
- [ ] **Sim:** run both lengths.

### BG-B10 / B11 / B12 (Agent B)
- [x] B10: focus, overlap, and card-back fixes.
- [ ] B11: mobile (Pixel 8), with a vertical rink when narrow.
- [ ] B12: freeze vs rebound text.

### BG-B13 Game length picker (Agent B)
- [ ] A pre-game picker shows "Short game" and "Long game". New Game returns to the picker.

### BG-B14 Puck visibility (Agent B)
- [ ] **Tokens:** add `--color-puck` and `--color-puck-ring`.
- [ ] **Puck:** larger puck token with a ring.
- [ ] **Loose puck:** pulse animation, turned off when reduced motion is on.
- [ ] **Carrier:** glow under the carrier's feet, distinct from the selected outline.
- [ ] **HUD:** show "<Team> <role> has the puck", or "Loose puck" when nobody has it.

### BG-A11 Unplayable-card reason (Agent A)
- [ ] Add `cardBlockReason(state, i)` returning `'energy' | 'shotOnly' | 'checkOnly' | 'goalieBlockOnly' | null`. `canPlayCard` becomes `cardBlockReason(state, i) === null`, so there's a single legality path.

### BG-B15 Greyed-card reason labels (Agent B)
- [ ] Disabled cards replace their tags line with a short reason ("Need 2⚡", "Shots only", "Checks only", "Goalie: blocks only"). Also set `aria-describedby` and `title` to the reason.

### BG-B16 Clearer greyed-card wording (Agent B, Chris)
- [ ] "Only when shooting", "Only when checking", "Costs N⚡ · you have M", and "Goalies can only block".

### BG-B17 Nav entry + automatic theme (Agent B, Chris)
- [ ] Add a "Rink Quest" nav item with a stick-and-puck icon, last in the list. On mobile it replaces the old theme toggle slot, and no second floating button is added.
- [ ] Dark theme turns on when the system prefers dark **or** the local time is 19:00–07:00. Remove the manual toggle and the saved theme. Pure logic goes in `lib/themeSchedule.ts`, with tests.

## BG-9 Integration + balance (PM with Chris)
- [ ] Play full matches and tune `data/balance.ts`, `cards.ts`, and `intents.ts` with Chris. Then open a PR from `board-game`.

## Phase 2 (branch `rink-quest-phase2`) — bugs from Chris's 2026-09-13 playtest

### BG-A12 Unqueue returns drawn cards and reshuffles (Agent A)
- [ ] **Bug:** `playCard` resolves a card's `draw` immediately; `unqueueCard` refunds energy and returns the card to hand but keeps the drawn card. Queue/unqueue Stickhandle repeatedly for an unbounded hand.
- [ ] **Decision (Chris):** unqueue takes the drawn cards back, and the draw pile is **reshuffled** afterwards so unqueue can't be used to peek at the next card. Stickhandle's feel is unchanged: it still draws on queue and the drawn card is playable this round.
- [ ] **Types:** `DuelState` gains `queueDraws: string[][]`, parallel to `userQueue` — entry `i` holds the card ids that queue entry `i` drew (usually `[]`).
- [ ] **Deck helper:** add `returnCardsToDeck(deck, ids, seed): [Deck, number]` to `engine/deck.ts` — removes `ids` from hand (reuse `removeIdsFromHand`), pushes them onto the draw pile, then `shuffle`s the draw pile. No other pile changes.
- [ ] **`playCard`:** record the ids it drew into `queueDraws`. Compare hand before/after the `drawCards` call rather than re-deriving.
- [ ] **`unqueueCard`:** call `returnCardsToDeck` for that entry's drawn ids, drop the entry from `queueDraws`, refund energy as today. Update the JSDoc — the "Any draw it caused stays drawn" line is now wrong.
- [ ] **Edge case:** if a drawn id is no longer in hand (the player queued it after drawing it), the unqueue is **refused** — return `state` unchanged. Export `canUnqueueCard(state, queueIndex): boolean` so the UI can grey that slot. Do not cascade-unqueue.
- [ ] **Reset:** `queueDraws` clears with `userQueue` at reveal and on a new round.
- [ ] **Tests** in `engine/duel.test.ts`: queue→unqueue Stickhandle 5x leaves hand size and total card count unchanged; the returned card is shuffled in, not on top; `canUnqueueCard` is false for the blocked edge case; energy round-trips.
- [ ] **Out of scope:** no balance changes, no CPU-side changes, no UI.

### BG-B18 Show perk-adjusted card numbers, and fix pile wording (Agent B)
- [ ] **Not a bug, a visibility gap:** `CardView` renders the static `card.text` string, so an LD's Protect Puck reads "5 block" while the reveal reports 7. Position perks (`PERK_WING_SHOT_BONUS`, `PERK_DEFENSE_BONUS` in `data/balance.ts`) are invisible to the player.
- [ ] **Decision (Chris):** live numbers **plus** a perk badge.
- [ ] **Card text:** derive the displayed text from `card.effects` adjusted by the acting skater's role, reusing `cardEffects(card, role)` from `engine/duelShared.ts` — do not duplicate the perk math. Put the string builder in `utils/cardText.ts` with tests. Keep `card.text` as the fallback when no role is supplied.
- [ ] **`CardView`:** new optional `role?: Role` prop. With a role, show the adjusted text and, when `perkBonus` is non-zero, a small badge reading `<ROLE> +N` (e.g. `LD +2`). No role → today's behaviour exactly.
- [ ] **`DuelScreen`:** pass the user duelist's role to the hand and queue cards. It already has `attackerSkater`/`defenderSkater` and `duel.userSide`.
- [ ] **`RevealPanel`:** new `userRole` / `cpuRole` props, passed down to each side's `CardView`, so the reveal's cards and its damage line finally agree.
- [ ] **Pile wording (Chris #3):** `DuelScreen.tsx:239-244` reads "draw N / discard N", which implies a discard action the player doesn't have. Change to "Deck N · Used N".
- [ ] **Queue slot:** once BG-A12 lands, grey a queue card whose `canUnqueueCard` is false, with a `title` of "Can't take this back - you've queued the card it drew".
- [ ] **Styling:** badge colour from an existing token; add one to both `:root` and `[data-theme='dark']` only if nothing fits. No raw hex.
- [ ] **Out of scope:** no engine edits, no balance changes.

### BG-B19 Card tag colours and yellow energy (Agent B, Chris)
- [ ] **Goal (Chris):** cards read at a glance by what they do. Colour comes from the card's tag; green stays reserved for bonuses; energy reads yellow.
- [ ] **Tokens** — add to **both** `:root` and `[data-theme='dark']` in `react/src/styles/index.css`, following the existing `--color-*` naming:

  | Token | Tag | Light | Dark |
  | --- | --- | --- | --- |
  | `--color-card-block` | `block` | `#4fc3f7` | `#81d4fa` |
  | `--color-card-check` | `check` | `#e57373` | `#ef9a9a` |
  | `--color-card-shot` | `shot` | `#ffb74d` | `#ffcc80` |
  | `--color-card-skill` | `skill` (deking) | `#ba68c8` | `#ce93d8` |
  | `--color-energy` | — | `#fbc02d` | `#ffd54f` |

- [ ] **Card border:** `.card`'s border colour comes from `card.tags[0]` (every card in `data/cards.ts` has exactly one tag). Use a CSS-module class per tag and pick it in `CardView`; do **not** write inline styles or raw hex. Keep the 1px width and the existing `--color-text` border as the fallback when a tag has no class.
- [ ] **Energy (card only, Chris 2026-09-13):** `.cost` becomes a filled yellow pip — `--color-energy` background, a dark readable foreground, small and round. The duel screen's energy orbs (`.orbFull`/`.orb` in `DuelScreen.module.css`) are **out of scope** and keep their current blue.
- [ ] **Green stays bonuses only:** `.perkBadge` keeps `--color-success`. Do not use a green anywhere else in this ticket.
- [ ] **Accessibility:** colour must never be the only signal — the tags row stays exactly as it is. Check the border is visible against `--color-surface` in both themes, and that `.disabled`'s 0.5 opacity still reads.
- [ ] **Out of scope:** no engine, data, or balance changes. No card text changes. Don't touch the sprites or the rink.

### BG-B20 Mobile: no page scroll, no rink stutter (Agent B, Chris)
- [ ] **Bug (Chris, Pixel 9):** the rink visibly grows and shrinks while scrolling on mobile.
- [ ] **Root cause (PM, confirmed):** `.boardNarrow` in `RinkBoard.module.css` sizes itself from `100dvh`. `dvh` tracks the *dynamic* viewport, which changes as mobile Chrome's URL bar hides and reveals on scroll. `.page` in `BoardGamePage.module.css` sets no height, so the column overflows, the page scrolls, the URL bar animates, `dvh` changes, and the board resizes — a feedback loop. Fixing only one half won't hold.
- [ ] **Stop the resize:** `.boardNarrow` uses `100svh`, not `100dvh`. `svh` is the *small* viewport (URL bar visible) and does not change as the bar animates, so the board size is stable whatever the page does.
- [ ] **Stop the scroll:** on the `max-width: 576px` breakpoint the page fills exactly one viewport and does not scroll — `.page` gets `height: 100svh` and `overflow: hidden`, and the column's children must fit. Do not put `overflow: hidden` on `body` or `html`; keep it scoped to this page so the rest of the app is untouched.
- [ ] **Replace the magic number:** `.boardNarrow`'s `calc((100dvh - 150px) * 7 / 15)` hardcodes a 150px guess for the surrounding chrome. Let the board take the leftover space instead: give it `flex: 1`, `min-height: 0`, and its `aspect-ratio`, sizing from the flex row rather than a subtraction. The board must stay centred and must never overflow its column on either axis.
- [ ] **Verify at real sizes**, both orientations, with the browser tools: **412×915** (Pixel 9) and **360×640** (small Android). Confirm no vertical scrollbar on the page, the whole rink plus the HUD are visible without scrolling, and the board does not change size when you attempt to scroll.
- [ ] **Desktop must not regress:** `.board` at wide sizes keeps `width: min(100%, 960px)` and its `15 / 7` aspect ratio. Check 1280×800 still looks exactly as it does today.
- [ ] **Modals are exempt:** `DuelScreen` and the game-over modal may scroll internally if their content is tall — that's fine and expected. This ticket is about the board page behind them.
- [ ] **Out of scope:** no engine, data, or balance changes. Don't change the 576px breakpoint or `useIsNarrow`. Don't redesign the HUD.

### BG-B21 Tell the player they can select their skaters (Agent B, Chris)
- [ ] **Gap (Chris):** nothing tells a new player they can click their own (blue) skaters to move. There are hints for pass mode and "CPU is thinking", but the default move mode has none, and a skater only gets an outline *after* it is selected — there is no cue that it was clickable in the first place.
- [ ] **Decision (Chris):** a hint line **and** an idle glow on the player's movable skaters. The glow must be clearly distinct from the puck's, and the two must not visually collide.
- [ ] **Hint line:** reuse the existing `.hint` style in `BoardGamePage.module.css` (same as the pass-mode hint). Text: "Select one of your blue players to move." Wording must suit both click and tap; don't say "tap".
- [ ] **When both cues show:** it's the user's turn, `mode === 'move'`, `selectedId === null`, the CPU isn't thinking, and at least one user skater can actually move. The moment a skater is selected, both cues disappear. They return next turn. Nothing is remembered across turns or games.
- [ ] **Glow colour — must not collide with the puck.** The puck already owns cyan: `.puckGlow` in `SkaterSprite.module.css` is a cyan ellipse at the skater's feet, and `PuckToken` has a cyan border. Selection owns yellow (`--color-tile-highlight`). So add a new token `--color-skater-movable` in **both** `:root` and `[data-theme='dark']` of `react/src/styles/index.css`: light `#fb8c00`, dark `#ffa726`. Do not reuse `--color-card-shot` — card tokens are for cards.
- [ ] **Glow geometry — must not collide either.** The movable cue is a ring *around the whole sprite* (on `.wrapper`), not a feet ellipse, so it is distinguishable from `.puckGlow` by shape as well as hue. It never co-occurs with `.selected` (selection clears it), but it **does** co-occur with `.puckGlow` and `.puckBadge` on a carrier who can still move — check that case specifically and make sure the orange ring, the cyan feet glow, and the corner puck badge all stay legible together.
- [ ] **Motion:** a soft pulse, following the existing `puck-pulse` pattern in `PuckToken.module.css`, and disabled under `@media (prefers-reduced-motion: reduce)` exactly as that file does. Use a different animation name; don't alter the puck's.
- [ ] **Accessibility:** the glow is decorative and `pointer-events: none`, like `.puckGlow`. The hint carries the actual information; don't add a second `role="status"` that would double-announce alongside the existing hints.
- [ ] **Verify in the browser** at 412×915 and 1280×800: cue appears on your turn, vanishes on selection, returns next turn, and the carrier-who-can-move case reads clearly in **both** light and dark themes.
- [ ] **Out of scope:** no engine, data, or balance changes. No tutorial overlay, no coach marks, no persisted "seen it" flag. Don't change the puck's own visuals.

## Round 5: shot minigame + dead-card fix (Chris, 2026-09-13)

**Why (Chris's playtest):** 1-3 cards are greyed out in a typical hand, especially when shooting, and faceoffs are uninteresting. Chris's call: fix the dead draws *and* add a timing minigame for shots.

**PM analysis that shaped these tickets:**
- Greyouts have three sources. `allowedIn` mismatches (`wrist_shot`/`slapshot` in a faceoff, `body_check` outside a check) are **dead draws with no decision attached** — that's the bug. Energy-cost greyouts are the actual game and stay. `goalieBlockOnly` is CPU-side and invisible to the user.
- `duelShared.ts:33` is the **only** place `state.length` affects gameplay — short vs long is implemented entirely as goalie poise. Any change to shot resolution must re-home game length or it silently stops meaning anything.

### BG-A13 Filtered duel draw (Agent A) — DONE fba2abe7
- [ ] **Goal (Chris):** a card in hand is never unplayable *because of the duel kind*. Only energy may grey a card.
- [ ] **Change:** a duel hand is drawn only from cards legal in that duel kind. Reuse the existing legality path — `ruleBlockReason` in `engine/duelShared.ts` already answers "may this side play this card here". Do **not** write a second legality rule, and do **not** add a weighting/propensity table; filtering is exact where weighting is probabilistic.
- [ ] **Where:** the draw path in `engine/deck.ts` / `engine/duel.ts` used by `createDuel` and by the per-round redraw in `roundDuel`. Both must filter; a mid-duel draw that deals a dead card is the same bug.
- [ ] **Cards stay in the deck.** Filtering changes what is *drawn into hand*, not deck contents. An ineligible card is skipped for this duel and is still there next duel. Never delete cards from `drawPile`.
- [ ] **Empty-pool safety:** if the eligible pool can't fill the hand, deal what's eligible and stop — a short hand is correct, an infinite loop or a thrown error is not. Cover this with a test.
- [ ] **Shot duels are out of scope here** — BG-A14 replaces them. Write this so shot-tagged cards simply never qualify for any other duel kind's pool, which is what BG-A14 needs anyway.
- [ ] **Tests:** faceoff hand contains no `shot`- or `check`-only card; deke hand likewise; a duel whose eligible pool is smaller than `handSizeFor` deals a short hand and terminates; determinism holds for a fixed seed.
- [ ] **Out of scope:** no balance changes, no new cards, no UI. Don't touch `ruleBlockReason`'s rules themselves.

**PM split (2026-09-13):** BG-A14 was one ticket; it touches types, the reducer, `duelShared`, `duelOutcome`, `cards`, `balance` and the CPU path, which is too much for one turn-in. It is now **A14a (additive model, nothing calls it)** and **A14b (integration)**. A14a is purely additive so it cannot regress the running game, and BG-B22 can start against its contract as soon as it lands rather than waiting for integration.

### BG-A14a Shot band/save model, additive only (Agent A, after BG-A13) — DONE 18ed9365
- [ ] **PM note:** the four bullets covering persistent poise, outcome mapping, the CPU path and dead-code removal were duplicated here by the PM's ticket split and belong to A14b. Removed; the agent correctly flagged the contradiction rather than guessing.
- [ ] **Goal (Chris):** shots stop being a card duel and become a one-card ante plus a timing swing. This ticket is the **pure engine model only** — no React, no timing loop, no component. BG-B22 builds the UI against the contract you define here.
- [ ] **New flow the model must support:**
  1. Ante: the shooter is offered **3** cards from the shot pool and picks **1**.
  2. The picked card contributes **accuracy** and **power**.
  3. The UI runs a timing bar and reports a **band**: `perfect | good | weak | miss`.
- [ ] **Band geometry is concentric (Chris, 2026-09-13).** The target is a bullseye, not separate zones: a narrow **yellow** band in the centre is `perfect`, a wider **light blue** band surrounding it on both sides is `good`, anywhere else on the track is `weak`, and failing to press before the cycle ends is `miss`. Model this as two widths (yellow, blue) centred on the same point, so the UI can render it as nested bands.
- [ ] **Difficulty comes from width, never from speed (Chris).** Chris's explicit constraint: if the bar moves too fast, perfect becomes frustrating. Keep the sweep readable and make `perfect` hard by making the yellow band narrow. Do not tune difficulty by accelerating the bar.
  4. The engine rolls the save, seeded, and returns the outcome.
- [ ] **Two axes, both real mechanics (Chris):**
  - **Accuracy** widens the **yellow** band only, so perfect becomes more likely. The blue band stays roughly constant, which means a low-accuracy card still lands `good` reliably and a shot is never a write-off. Export both band widths as numbers the UI consumes; do not hardcode geometry in the UI.
  - **Power** subtracts from the goalie's save chance, **and** is the amount of goalie poise drained on a save. One number, two jobs — that is deliberate, so a heavy shooter wears the goalie down for later.
- [ ] **Save roll:** `saveChance = BASE_SAVE_BY_BAND[band] + poiseFactor(goaliePoise) - power`, clamped. Roll through `engine/rng.ts` with the seed in state. **Never `Math.random`.** Anchor `BASE_SAVE_BY_BAND` on Chris's ruling that a **perfect shot is still saved ~20% of the time**; `good`/`weak`/`miss` scale up from there. All of these live in `data/balance.ts` as named constants — Chris tunes them, so no magic numbers in engine code.
- [ ] **New shot cards:** add **2-3** to `data/cards.ts` and the starter deck so the 3-card ante isn't the same offer every time (today the deck holds only two distinct shot cards). Give them contrasting accuracy/power so the pick is a real decision — e.g. high power / low accuracy vs the reverse. `slapshot` keeps `exhaust`. Card `text` should read in hockey language, not as raw stats.
- [ ] **Perk change:** `PERK_WING_SHOT_BONUS` currently adds +2 damage to shot cards, which has nothing to attach to once shots deal no damage. It becomes an **accuracy** bonus for LW/RW. Keep the constant's role (one named value in `balance.ts`); update its JSDoc. Don't touch the LD/RD or C perks.
- [ ] **Tests:** a perfect band still concedes a save at the constant's rate for a seed that rolls into it; power reduces save chance and drains poise; a drained goalie saves less than a fresh one; weak-save freezes and good-save rebounds; the CPU path resolves through the same function; determinism for a fixed seed.
- [ ] **A14a IS ADDITIVE ONLY. Nothing in the running game may call your new code yet.** Export the band type, the two band widths, the save-roll function, the new cards and the balance constants, all covered by tests. Do **not** touch `duelOutcome.ts`, the reducer, `makeDuelist`, or the CPU's shot path — that is A14b. The existing shot card duel keeps working exactly as it does today, and the full suite must stay green with zero behaviour change.
- [ ] **Define the contract BG-B22 will consume** and state it plainly in your report: the band type, the shape carrying the two band widths, and the function the UI calls with a band to get an outcome. Agent B builds against this, so it must not change afterward without coming back to the PM.
- [ ] **Out of scope for A14a:** no React, no component, no CSS, no timing loop. No integration. Don't change faceoff/deke/check/intercept resolution.

### BG-A14b Integrate the shot minigame (Agent A, after BG-A14a)
- [ ] **Goal:** make A14a's model the real shot resolution path, replacing the shot card duel.
- [ ] **Persist goalie poise (Chris).** Move the goalie's poise out of per-duel `makeDuelist` into `GameState` so it carries across the whole match, seeded from `GOALIE_POISE_BY_LENGTH` on `NEW_GAME`. Lower poise lowers the save chance. This is what keeps `length` meaningful — `duelShared.ts:33` is currently the only place `state.length` affects gameplay at all, so if you drop poise, short vs long silently stops existing.
- [ ] **Drain on save:** a save drains poise by the shot's `power`. Keep fatigue **modest** (PM/Chris): it should shift late-game odds, not collapse the goalie into a sieve.
- [ ] **Outcome mapping — reuse `applyOutcome`'s existing paths, add no new outcome kinds:** goal on a beat; on a save, a **`weak`** band freezes (the existing `cleanSave` path) and **`good`/`perfect`** kicks out a rebound.
- [ ] **CPU shots** roll a band from seeded RNG against a difficulty constant in `balance.ts`, then go through the **identical** save path. Do not fork a second resolution path for the CPU.
- [ ] **Remove the shot exemption from BG-A13:** `isDrawEligibleCard` in `duelShared.ts` has an `if (duel.kind === 'shot') return true;` early return with a comment explaining why. Once shot duels no longer draw hands, that branch and `ruleBlockReason`'s `goalieBlockOnly` become dead. Remove what is genuinely unreachable; if unsure whether something is still reached, ask rather than delete. Report everything you removed.
- [ ] **Re-run the BG-A10 headless sim and report the scoring rate.** Before this change, shot attackers won **27%**. Report the new number. A large jump means the yellow band is too generous — report it, don't silently retune.
- [ ] **Out of scope:** no React, no component, no CSS. Don't change faceoff/deke/check/intercept resolution.

### BG-B22 Shot minigame UI (Agent B, after BG-A14a)
- [ ] **Goal (Chris):** the shot is the most exciting moment in the game and should feel like it. Pick a card, then time your swing.
- [ ] **Build `components/ShotMinigame.tsx`** (+ colocated module CSS), dumb: props in, callbacks out, exactly like `DuelScreen`. It renders inside `ModalOverlay` and follows `DuelScreen`'s focus-management and keyboard patterns — reuse them, don't reinvent.
- [ ] **Two steps, one screen:** the 3-card ante (reuse `CardView`, including its tag colours and perk badge from BG-B18/B19 — do not build a second card renderer), then the timing bar.
- [ ] **Timing bar — concentric bands (Chris):** an indicator sweeps a track over a bullseye target. A narrow **yellow** band in the centre is `perfect`; a wider **light blue** band on both sides of it is `good`; the rest of the track is `weak`. Both widths come from the engine (BG-A14 exports them) — **never hardcode them in CSS**, since accuracy changes the yellow band at runtime. Render them as nested bands so the player can read at a glance how close they came.
- [ ] **Colours:** yellow reuses `--color-tile-highlight` (it already means "target here" for tile selection). The light blue band needs a **new token pair** in both `:root` and `[data-theme='dark']` — do **not** borrow `--color-card-block`; card tokens are for cards, per BG-B19/B21. Check it against the puck's cyan so the two don't read as the same thing.
- [ ] **Speed (Chris):** a readable, fair sweep — roughly 1.8-2.2s per cycle, as a named constant, not a magic number. **Do not make the bar fast to make the game hard**; difficulty lives in the yellow band's width. Chris's words: too fast and perfect becomes frustrating.
- [ ] **Accessibility:** band position and the stated result carry the meaning, not hue alone — the result text must name the band in words. Two adjacent colour bands must not be the only signal.
- [ ] **Input:** click, tap, **and** keyboard (Space/Enter). Touch must work at 412×915 — the press target is the whole bar area, not a small button.
- [ ] **Reduced motion (`prefers-reduced-motion: reduce`):** no sweeping animation. Auto-resolve a band weighted by the picked card's accuracy, show the result, and move on. A pure-dexterity gate would lock out anyone who can't hit it; this is required, not optional. Follow the existing pattern in `PuckToken.module.css` / `SkaterSprite.module.css`.
- [ ] **Goalie poise bar:** now that poise persists (BG-A14), show it so the player can see the goalie wearing down. Reuse the existing `.poiseBar` `<progress>` styling from `DuelScreen.module.css` rather than a new widget.
- [ ] **Result:** say what happened in hockey words — the band, then goal / save / rebound / freeze. Reuse `describeOutcome` and `RevealPanel`-style presentation where it fits.
- [ ] **Mobile, and don't undo BG-B20:** verify at **412×915** and **1280×800** in both themes. The board page behind must still not scroll; the minigame may scroll internally if tall, like the other modals.
- [ ] **Out of scope:** no engine, data, or balance changes — if a number is wrong, report it, don't edit `balance.ts`. Don't touch the rink, the sprites, or `DuelScreen`'s own duel flow.

### BG-B23 Pixel font for the board game (Agent B, Chris)
- [ ] **Goal (Chris, 2026-09-13):** the whole Rink Quest feature uses the arcade pixel font "Press Start", matching the pixelated sprites.
- [ ] **Which font (PM decision):** use **"Press Start 2P"** from Google Fonts — same designer as the dafont "Press Start", and it's the maintained OFL release. `react/index.html` **already** loads Roboto from Google Fonts with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`; add this family to that existing setup. Do not add a font binary to the repo and do not download from dafont.
- [ ] **Token, not raw names.** Add a `--font-pixel` token in `react/src/styles/index.css` next to the existing font declarations (the app's base is `'Roboto', sans-serif` at line ~112). Always include a fallback stack ending in `monospace` — the page must stay readable if the font fails to load.
- [ ] **Scope it to this feature only.** Apply the token at the board-game page root so it inherits through the feature. **The rest of the stats app keeps Roboto** — do not change the global `body` font. Verify another route (e.g. Player Stats) is visually untouched.
- [ ] **Carve-out — two labels stay in the current font.** `SkaterSprite.module.css` has `.roleLabel` at `0.45rem` and `.stunBadge` at `0.6rem`. Press Start 2P is far wider per glyph than Roboto and is illegible below roughly 0.7rem; at 0.45rem the role label will overflow its tile. Leave those two on the existing stack. If you think they can work, say so in your report with what size they'd need — **don't change them unilaterally**, it's Chris's call.
- [ ] **Do not undo BG-B20.** That ticket made the mobile board fill exactly one viewport with **no page scrolling**. A wider font can push the HUD or card text back into overflow. Re-verify at **412×915** (Pixel 9) and **360×640**: no vertical scrollbar on the board page, the whole rink and HUD visible without scrolling, and the board does not resize when you try to scroll. If the font causes overflow, report it — adjust sizes, don't reintroduce scrolling.
- [ ] **Check the tight spots specifically:** card name and text in `CardView`, the duel screen title and round/energy row, the reveal panel, and the game-over modal. Long card names in a wide font are the most likely thing to break.
- [ ] **Both themes**, and check contrast still reads — pixel fonts have thin stems at small sizes.
- [ ] **Verify at 1280×800 too**, so desktop doesn't regress.
- [ ] **Out of scope:** no engine, data, or balance changes. No layout redesign, no font-size rescaling beyond what's needed to stop overflow. Don't touch the sprites themselves.

## Round 6: faceoff minigame + goalie buff (Chris, 2026-09-13)

**Why (Chris):** the faceoff is the last set piece that's still a generic card duel — same hand, same poise math, same screen as a deke, resolving to one flat outcome (`puck = carried by winner`). Shots also convert too often. Chris's calls, verbatim in effect: **full replacement** of the faceoff card duel, **the scrum outcome is in** (not deferred), goalies get buffed so shots land **under 56%**, and a good/perfect save gets **a chance to be covered instead of rebounding**, whistling play dead for a draw beside the net.

**PM framing — why a reaction drop, not a second sweep bar.** The shot minigame's skill is *tracking* (follow a sweeping indicator, press at centre). Reskinning that for the faceoff would be cheap and would make two of the game's three set pieces feel identical. A faceoff is contested and simultaneous, and its real skill is anticipating the drop. So the faceoff is a **reaction** game that reuses the proven *shape* — ante (pick 1 of 3) → input moment → seeded roll — without reusing the *input*.

**PM split:** BG-A14 taught us that one ticket spanning types + reducer + outcome + cards + balance + CPU + UI is unreviewable. Same split here: **A15a** (pure model, additive, nothing calls it) → **A15b** (integration, incl. scrum) → **B25** (UI). **A16** (goalie buff + covered puck) is separable and lands independently.

### BG-A15a Faceoff reaction model, additive only (Agent A)
- [ ] **Goal (Chris):** the faceoff stops being a card duel and becomes a one-card ante plus a reaction to the drop. This ticket is the **pure engine model only** — no React, no timers, no component. BG-B25 builds against the contract you define here.
- [ ] **New flow the model must support:**
  1. Ante: the centre is offered **3** faceoff-pool cards and picks **1**. The C's perk (`PERK_CENTER_FACEOFF_DRAW`, today "+1 duel card") is repointed to **draw 4, pick 1**. Don't touch the LW/RW or LD/RD perks.
  2. The linesman holds the puck for a random **700-1800ms**, then drops it.
  3. The UI reports a reaction, which buckets into a **band**: `clean | scrum | late | jump`.
  4. The engine rolls the contest, seeded, and returns the outcome.
- [ ] **Difficulty comes from window width, never from drop speed.** This is Chris's standing BG-A14a ruling carried over: the hold is random but the *windows* are what make a clean win hard. Do not tune difficulty by shortening the hold.
- [ ] **Bands are windows on reaction time (ms):** `clean` (`t <= cleanWindow`), `scrum` (`t <= scrumWindow`), `late` (anything slower), and `jump` (pressed **before** the drop). A jump is a false start: **one** re-drop with a narrowed clean window; a second jump loses the draw outright.
- [ ] **Two axes, both real mechanics:**
  - **`anticipation`** widens the **clean** window only. The `scrum` window stays constant, so a slow draw is never a write-off — exactly the role `accuracy` plays for the blue band in BG-A14a.
  - **`grip`** is a flat bonus to the contested roll **and** the size of the buff carried out of a clean win. One number, two jobs, deliberately — same design as shot `power`.
- [ ] **Contest roll:** `winChance = BASE_WIN_BY_BAND[band] + grip - opponentGrip`, clamped, rolled through `engine/rng.ts` with the seed in state. **Never `Math.random`.** All constants named in `data/balance.ts` — Chris tunes them, so no magic numbers in engine code: `FACEOFF_CLEAN_WINDOW_BASE_MS`, `FACEOFF_WINDOW_PER_ANTICIPATION_MS`, `FACEOFF_SCRUM_WINDOW_MS`, `FACEOFF_DROP_DELAY_MIN_MS`, `FACEOFF_DROP_DELAY_MAX_MS`, `BASE_WIN_BY_BAND`, `CPU_FACEOFF_REACTION`, `FACEOFF_JUMP_WINDOW_PENALTY_MS`.
- [ ] **CPU faceoffs** roll a band from seeded RNG against `CPU_FACEOFF_REACTION`, then go through the **identical** contest function. Do not fork a second resolution path for the CPU. Mirror `rollCpuShotBand`.
- [ ] **Six faceoff cards** in `data/cards.ts` + the starter deck, new `'faceoff'` `CardTag`, `allowedIn: ['faceoff']`, so the 3-card ante varies. Contrasting stats so the pick is a real decision, and `text` in hockey language, not raw stats:

  | Card | anticipation / grip | On a clean win |
  |---|---|---|
  | Quick Hands | 70 / 2 | — (pure speed) |
  | Tie It Up | 25 / 8 | a **loss** downgrades to a scrum instead |
  | Win It Back | 50 / 5 | back-draw: puck to your nearest D, not the C |
  | Body the Dot | 30 / 7 | opposing C stunned 1 turn |
  | Forehand Pull | 65 / 4 | +1 MP this turn |
  | Cheat the Draw | 85 / -2 | a jump is free — no re-drop penalty |

- [ ] **Card effects: one optional enum field, no new effect machinery.** Add `faceoffEffect?: 'backDraw' | 'stunLoser' | 'bonusMp' | 'scrumOnLoss' | 'freeJump'` to `CardDef`, exactly as additive as `accuracy`/`power` were. Do **not** extend `CardEffect` — these fire at outcome time, not during a reveal.
- [ ] **Tests:** anticipation widens the clean window and nothing else; grip shifts the contest roll and higher grip beats lower; a jump costs a narrowed re-drop and a second jump loses; the CPU path resolves through the same function; determinism for a fixed seed.
- [ ] **A15a IS ADDITIVE ONLY. Nothing in the running game may call your new code yet.** The existing faceoff card duel keeps working exactly as it does today and the full suite stays green with zero behaviour change. Do **not** touch `duelOutcome.ts`, the reducer, or `makeDuelist` — that is A15b.
- [ ] **Define the contract BG-B25 consumes** and state it plainly in your report: the band type, the shape carrying the window widths, and the function the UI calls with a reaction to get an outcome. Agent B builds against it, so it must not change afterward without coming back to the PM.
- [ ] **Out of scope:** no React, no component, no CSS, no timers, no integration. Don't change deke/check/intercept/shot resolution.

### BG-A15b Integrate the faceoff minigame, incl. scrum (Agent A, after BG-A15a)
- [ ] **Goal:** make A15a's model the real faceoff resolution path, **fully replacing** the faceoff card duel (Chris's call — not a C-only carve-out, and not a hybrid).
- [ ] **Three outcomes — this is the fix.** Today `applyOutcome`'s `faceoff` branch always sets `carried`, which is why the draw feels inert. It becomes:
  - **Clean win** → winner carries the puck **and** the card's `faceoffEffect` fires.
  - **Scrum** → the puck goes **loose** on a tile adjacent to the dot, so both centres race for it. Reuses the existing `Puck = { kind: 'loose', pos }` shape — **add no new puck or outcome kinds.**
  - **Loss** → opponent carries; their effect fires only if *they* won clean.
- [ ] **Faceoff spots (needed by BG-A16 too).** The board is 15x7; centre ice is `(7,3)`, goalies sit at `(0,3)` and `(14,3)`. Add a named spot table in `data/rink.ts`: centre ice, plus the two end-zone dots flanking each net — roughly `col 2` and `col 12`, `rows 1` and `5`. Coordinates are Chris-tunable; put them in the data file, not inline in the reducer.
- [ ] **A draw at a spot must not reset the whole formation.** The current whistle path teleports every skater back to its starting tile, which is right for centre ice and wrong for an end-zone draw. An end-zone faceoff moves **only the two centres** to the dot; everyone else stays where they are. Keep the full reset for centre-ice draws.
- [ ] **Which of the two dots:** the one nearest the shooter's row, ties broken by a seeded flip. Rewards positioning rather than being arbitrary.
- [ ] **Remove what the replacement makes dead.** The faceoff's `handSizeFor` +1 branch and any faceoff-only card-duel plumbing become unreachable once the draw no longer deals hands. Remove what is genuinely unreachable; **if unsure whether something is still reached, ask rather than delete.** Report everything you removed — same discipline as BG-A14b.
- [ ] **Re-run the BG-A10 headless sim and report** faceoff outcome distribution (clean / scrum / late) and whether game length shifted. A scrum rate above ~35% means the windows are too tight — **report it, don't silently retune.**
- [ ] **Out of scope:** no React, no component, no CSS. Don't change deke/check/intercept resolution.

### BG-A16 Goalie buff + covered puck (Agent A, independent of A15)
- [ ] **Goal 1 (Chris):** shots convert too often. Bring the headless-sim conversion rate **under 56%**, measured the way BG-A14b measured it. Tune `BASE_SAVE_BY_BAND` first; `POISE_SAVE_PENALTY_MAX` second. **Report the before and after numbers** — this is a measured change, not a guessed one. Note that the recent `SHOT_YELLOW_BASE_WIDTH` 0.05 -> 0.03 change already pushed the rate down, so measure from current HEAD.
- [ ] **Keep Chris's anchor intact:** a perfect shot is still saved ~20% of the time *before* modifiers. Buff the lower bands (`good`/`weak`) ahead of `perfect` — the reward for perfect timing must not be flattened.
- [ ] **Goal 2 (Chris):** a good/perfect save currently **always** rebounds. Add a seeded chance it is **covered** instead — the goalie smothers it, play is whistled dead, and the ensuing draw happens at one of the two dots **beside that net**, as in real hockey.
- [ ] **Covered is a third save result, distinct from freeze.** Today `ShotSaveResult` carries `freeze` (weak/miss — possession to the goalie's team, no whistle) and `rebound` (good/perfect). Add `covered`, rolled only on a `good`/`perfect` save, against a named `SHOT_COVER_CHANCE` in `balance.ts`. A covered puck sets the existing `whistle` flag and routes to the faceoff phase.
- [ ] **Sequencing with A15b — read this before starting.** A15b owns faceoff spots and the "don't reset the whole formation" rule. If A15b has not landed when you build this, a covered puck whistles to the **existing centre-ice faceoff**; wire the end-zone dot in as soon as A15b's spot table exists. Say in your report which of the two you shipped. Do **not** build a second, competing spot table.
- [ ] **Tests:** cover fires only on good/perfect saves and never on weak/miss; the cover roll is seeded and deterministic; a covered puck whistles and a rebound does not; conversion rate stays under the target across the sim.
- [ ] **Out of scope:** no React, no component, no CSS. Don't touch the faceoff *resolution* model — that's A15.

### BG-B25 Faceoff minigame UI (Agent B, after BG-A15a)
- [ ] **Goal (Chris):** the draw should feel like a draw — tense hold, sudden drop, fast hands.
- [ ] **Build `components/FaceoffMinigame.tsx`** (+ colocated module CSS), dumb: props in, callbacks out, exactly like `ShotMinigame` and `DuelScreen`. Renders inside `ModalOverlay`, reusing their focus-management and keyboard patterns — don't reinvent them.
- [ ] **Two steps, one screen:** the 3-card ante (reuse `CardView`, including tag colours and the perk badge — **do not build a second card renderer**), then the drop.
- [ ] **The drop:** linesman holds the puck, a visible "set" state, then the puck drops and the reaction window opens. The hold length comes from the engine's constants — **never hardcode timings in the component**, same rule BG-B22 follows for band geometry.
- [ ] **Jump feedback must be unmistakable:** a false start has to read instantly as *your* mistake, not as a bug. Name it in words ("Too early — re-drop"), don't rely on colour or motion alone.
- [ ] **Colours:** the `'faceoff'` card tag needs a token pair in both `:root` and `[data-theme='dark']`. Do **not** borrow the shot or block tokens — per BG-B19/B21, tags get their own. Check it against the puck's cyan and the yellow target band so nothing reads as the same thing.
- [ ] **Accessibility — required, not optional.** Reaction games gate harder than tracking games for motor impairment. Under `prefers-reduced-motion: reduce`, auto-resolve a band weighted by `anticipation` (the exact analogue of BG-B22's `rollBandFromAccuracy` fallback) and show the result. **That path must be genuinely competitive, not a forfeit.** Follow the existing pattern in `PuckToken.module.css` / `SkaterSprite.module.css`.
- [ ] **Input:** click, tap, **and** keyboard (Space/Enter). At 412x915 the press target is the whole drop area, not a small button.
- [ ] **Result:** say what happened in hockey words — the band, then won clean / tied up / lost the draw, and any buff that fired. Reuse `describeOutcome` and `RevealPanel`-style presentation where it fits.
- [ ] **Mobile, and don't undo BG-B20:** verify at **412x915** and **1280x800** in both themes. The board page behind must still not scroll; the modal may scroll internally if tall, like the others.
- [ ] **Out of scope:** no engine, data, or balance changes — if a number is wrong, **report it, don't edit `balance.ts`**. Don't touch the rink, the sprites, or `DuelScreen`'s own duel flow.

### BG-B25 addendum — the settled contract (PM, 2026-09-14)

BG-A15b landed in two cycles. The first produced an asymmetric draw that Chris rejected ("centres should compete, shouldn't be like shot"); the second made it genuinely head-to-head. **Build against this, not against the original ticket's looser description** — an underspecified contract is what produced the rejected version.

- **Both centres ante and react.** Each picks 1 card from its offer (the C draws 4, per `PERK_CENTER_FACEOFF_DRAW`) and each produces a reaction band. One function grades both sides, with no privileged path for either.
- **The function the UI's outcome flows through** (`engine/faceoffModel.ts`):
  ```ts
  rollFaceoffHeadToHead(
    userBand: 'clean'|'scrum'|'late', userGrip: number,
    cpuBand:  'clean'|'scrum'|'late', cpuGrip: number,
    seed: number,
  ): [{ outcome: 'win'|'scrum'; userWins: boolean; winChance: number }, number]
  ```
  The UI does not call this directly — it dispatches `PICK_FACEOFF_CARD` then `RESOLVE_FACEOFF_BAND` (or `AUTO_RESOLVE_FACEOFF`), mirroring the shot's reducer actions. `engine/faceoffDuel.ts` exposes `faceoffBandWindowsFor(state)` for the window geometry, the same way `shotBandWidthsFor` serves the shot bar. **Never hardcode window or timing geometry in the component.**
- **A scrum fires only on a genuine tie** — both sides reading the identical non-clean band. Any differing pair, `scrum` vs `late` included, goes through a real contest roll. The winner's `faceoffEffect` fires only if their band was `clean`.
- **Reduced motion is already solved at the engine level.** `AUTO_RESOLVE_FACEOFF` samples from a human-anchored range and holds `late` at ~16% across every card. The component must use that path under `prefers-reduced-motion: reduce` and must not roll its own — one source of truth, as BG-B22 does for the shot.
- **A jump is a false start:** one re-drop with a narrowed clean window, a second jump loses outright, and `freeJump` exempts its holder. This needs unmistakable wording in the UI ("Too early — re-drop"), never colour or motion alone.

## Round 7: daily streak calendar (Chris, 2026-09-14)

**Why (Chris):** give players a reason to come back each day. A win streak grants +1 energy per duel round. A pixel-art monthly calendar shows the streak visually. See design doc §9.

**Architecture note:** this is the first feature that uses `localStorage`. Persistence lives in a dedicated module (`data/dailyStreak.ts`) outside `engine/`. Engine code reads `bonusEnergy` from `GameState` but never touches the store. The hook bridges the two: it reads the streak on mount, passes `bonusEnergy` into state at game creation, and writes a win on game over. This keeps the "no `localStorage` in engine" rule intact.

### BG-A17 Streak persistence module (Agent A)
- [x] **Read:** design doc §9.1, §9.2. `data/balance.ts`, `types/game.ts`, `engine/duel.ts` (lines 89-95 and 305-311 — where `energy: ENERGY` is set).
- **`data/dailyStreak.ts`:** pure read/write module for the streak store. **Not in `engine/`** — this touches `localStorage`.
  - `StreakData { wins: Record<string, true>; lastWinDate: string | null }`
  - `loadStreak(): StreakData` — reads from `localStorage` key `rinkquest-streak`, returns a default if missing or malformed. Wrap every access in try/catch (private browsing, storage disabled).
  - `recordWin(data: StreakData): StreakData` — adds today's ISO date to `wins`, sets `lastWinDate`, garbage-collects entries older than 60 days, writes to `localStorage`, returns the updated data.
  - `currentStreak(data: StreakData): number` — counts consecutive calendar days ending at today (inclusive) that have a win. If today has no win, counts consecutive days ending at yesterday.
  - `hasStreakBonus(data: StreakData): boolean` — true when `currentStreak >= 1`.
  - `todayKey(): string` — today's date as `YYYY-MM-DD` in local timezone.
- **No imports from `engine/`, `hooks/`, or `components/`.** May import from `types/` and `data/`.
- **Tests** in `data/dailyStreak.test.ts`: streak counts correctly across consecutive days; a gap resets; garbage collection drops old entries; malformed localStorage returns the default; `recordWin` is idempotent for the same day.
- **Out of scope:** no GameState changes, no reducer changes, no UI.

### BG-A18 bonusEnergy on GameState and duel energy (Agent A, after BG-A17)
- [x] **Read:** design doc §9.2. `types/game.ts` (`GameState`), `engine/gameReducer.ts` (`createInitialState`), `engine/duel.ts` (lines 89-95 and 305-311).
- **Contract:**
  - `GameState` gains `bonusEnergy: number` (0 or 1).
  - `createInitialState(seed, length)` sets `bonusEnergy: 0` (the hook overrides it).
  - `NEW_GAME` action gains an optional `bonusEnergy?: number` field. `createInitialState` uses it when provided, else 0.
- **Duel energy:** in `engine/duel.ts`, the two places that set `energy: ENERGY` (duel creation at ~line 95 and next-round reset at ~line 309) become `energy: ENERGY + state.bonusEnergy`. The CPU's energy stays at `ENERGY` — the bonus is user-only, so the CPU's `cpuPlan` planning budget (in `cpuDuelPolicy.ts`) is unchanged.
- **Tests:** a game with `bonusEnergy: 1` starts duel rounds with energy 4; a game with `bonusEnergy: 0` starts with 3; the CPU always plans with 3 regardless.
- **Out of scope:** no UI, no localStorage, no streak logic. The hook (BG-B27) bridges them.

### BG-B27 Wire streak into the game hook (Agent B, after BG-A17 + BG-A18)
- [x] **Read:** `hooks/useBoardGame.ts`, `data/dailyStreak.ts` (from BG-A17), design doc §9.2.
- **`hooks/useBoardGame.ts`:**
  - On mount, call `loadStreak()` and `hasStreakBonus()` to determine `bonusEnergy` (0 or 1). Store the streak data in a `useRef`.
  - Pass `bonusEnergy` into the initial `createInitialState` call and into every `NEW_GAME` dispatch.
  - When the game ends with `winner === 'user'`, call `recordWin()` and update the ref. This is the only write path.
- **Return shape:** add `streakData: StreakData` and `streak: number` to `UseBoardGame` so the UI can show the calendar and streak count.
- **Out of scope:** no engine changes, no calendar UI.

### BG-B28 Streak energy badge in the duel UI (Agent B, after BG-B27)
- [x] **Read:** `components/DuelScreen.tsx`, `components/DuelScreen.module.css` (the `.orbFull`/`.orb` energy orbs), design doc §9.2.
- **When `state.bonusEnergy > 0`:**
  - The energy orb row shows 4 orbs instead of 3.
  - A small "+1⚡" badge (or a fourth orb in a distinct bonus colour) signals the bonus. Add a token `--color-energy-bonus` in both `:root` and `[data-theme='dark']` — a brighter or warmer yellow than `--color-energy`, so it reads as "extra" without being a new hue.
  - The `ShotMinigame` and `FaceoffMinigame` don't show energy, so no changes there.
- **Accessibility:** the badge text carries the meaning; colour alone is not sufficient.
- **Out of scope:** no engine changes, no calendar.

### BG-B29 Pixel-art streak calendar component (Agent B, after BG-B27)
- [x] **Read:** design doc §9.3. `components/GameLengthPicker.tsx` (adjacent UI), `components/GameButton.tsx`, `data/dailyStreak.ts`.
- **`components/StreakCalendar.tsx`** + colocated `.module.css`:
  - A **monthly calendar** in a 7-column grid (Sun–Sat headers), pixel-art styled.
  - Props: `{ streakData: StreakData; streak: number; onClose: () => void }`.
  - Each day cell shows:
    - Won days: a small filled puck icon (a 5×5 or 7×7 pixel circle in `--color-puck`, rendered as an inline SVG or CSS shape — not an emoji).
    - Today: highlighted border using `--color-tile-highlight`.
    - Future days: hidden or dimmed, no interaction.
    - Past days without a win: empty.
  - **Header:** month/year name, left/right arrows to navigate months (up to 2 months back, since GC drops entries older than 60 days).
  - **Streak display:** "🔥 N-day streak" (or "No streak" when 0) prominently above the grid, using `--font-pixel`. The fire is the one emoji exception for this feature.
  - **Reward line:** when `streak >= 1`, show "+1⚡ bonus energy today" below the streak count.
  - **Pixel border:** a stepped/aliased border around the calendar panel, matching the Rink Quest aesthetic. Use `image-rendering: pixelated` and box-shadow steps or a border-image, not a smooth `border-radius`.
  - **Close:** a "Back" `GameButton` at the bottom.
- **Responsive:** at 412×915, the calendar fills width with `--space-sm` gutters; at 1280×800 it's centred and no wider than ~400px.
- **Both themes.** Verify contrast on day cells in dark mode.
- **Out of scope:** no engine changes, no streak logic changes.

### BG-B30 Calendar entry point on the pre-game screen (Agent B, after BG-B29)
- [x] **Read:** `components/BoardGamePage.tsx`, `components/GameLengthPicker.tsx`.
- **Pre-game screen** (before game length is picked):
  - Add a "Daily Streak" `GameButton` (variant `secondary`) below the game length picker.
  - Clicking it shows `StreakCalendar` in place of the length picker (not a modal — same page flow as the length picker itself).
  - The calendar's "Back" returns to the length picker.
  - If the player has an active streak, show a one-line summary on the pre-game screen: "🔥 N-day streak · +1⚡ today" — so they see the reward before starting.
- **State:** `BoardGamePage` gains a local `view: 'picker' | 'calendar'` state, defaulting to `'picker'`.
- **Out of scope:** no engine changes. The calendar is read-only from this screen.

---

### BG-B26 Rink styling: nav placement + unplayable half-tiles (Claude, Chris asked for the code change, 2026-09-14)
- [x] **Nav:** `BoardGamePage` rendered `PageHeader` inside the padded `.page`, so the nav sat below a strip of page padding instead of flush at the top like every other page. It now renders as a sibling before `.page`, matching Schedule and Standings.
- [x] **Half-tiles:** the rounded rink boards clip the end columns. `data/rink.ts` now owns `RINK_CORNER_RADIUS` (tile units); `RinkBoard` derives its CSS `border-radius` from it (swapped for the narrow layout, which previously inherited the wide radius). Every tile with less than `MIN_PLAYABLE_TILE_COVERAGE` (0.75) of its area inside the boards is in `UNPLAYABLE_CORNERS`: cols 0 and 14 at rows 0, 1, 5, 6, plus cols 1 and 13 at rows 0 and 6. A first pass used "half or less", but a ~61% tile (col 1, row 0) still read as cut off once the border and rail were drawn and clipped the sprite on it (Chris's 2026-09-14 playtest); the next-worst tiles sit at 88%, so 0.75 separates them cleanly. `rink.test.ts` checks the list against the geometry, so changing the radius without updating the list fails the suite.

## Round 8: optional Google Sign-In streak sync (Chris, 2026-09-14)

**Why (Chris):** the daily streak (Round 7) only lives in `localStorage`, so it's lost on a new device, browser, private window, or cleared site data — which undercuts the whole "give players a reason to come back" point of the feature. Chris's call: sign-in is **optional and progressive**, never required to play — anonymous local-only play must work exactly as it does today. Signing in with Google only backs up the streak and syncs it across devices.

**PM architecture note — this is a real exception, not a natural extension.** `docs/architecture.md` states `features/board-game` is "a self-contained game with no API calls and no cross-feature imports." This round deliberately breaks that, narrowly: only a new `features/board-game/api/streakSync.ts` may call the network, gated behind an explicit user action (tapping "Sign in"), never automatic or silent for an anonymous player. `engine/`, `ai/`, `data/dailyStreak.ts`'s core read/write path, and `gameReducer` are untouched — they keep working with zero network dependency. BG-A20 updates the architecture doc to record this exception explicitly; don't leave it undocumented.

**PM investigation that shapes these tickets:**
- There is **no auth system anywhere in this app today** — no `users` table, no session middleware, no OAuth wiring. `api/src/presentation/middleware/auth.js` is a single shared-passphrase gate for the diagnostics route, not a per-user auth system — don't reuse or extend it; this needs its own middleware.
- The frontend's `axiosExpressHandler` (`react/src/lib/axiosInstance.ts`) is created with `withCredentials: false`, and the backend's CORS config (`api/src/composition/app.js`) sets no `credentials: true`. The frontend is a static SPA calling a separately-hosted API (`VITE_API_URL`), which makes cross-origin cookie sessions (`SameSite=None; Secure` cookies, CORS credential mode on both sides) an extra source of bugs for very little benefit here. **Use an app-issued bearer token returned in the response body and stored in `localStorage`, sent via an `Authorization` header**, not a cookie session. Simpler, and it avoids touching global CORS/axios config that every other feature also relies on.
- `react/src/lib/apiClient.ts` currently only exports a `get` helper. This round needs `post`/`put` too — add them there (shared, feature-agnostic), reusing the existing try/catch-and-log pattern, not a second HTTP client.
- Backend follows the Feghhi 3-pattern (thin presentation → domain slices → infrastructure) used by every existing slice in `api/src/slices/`. This isn't NHL data, so the mapping-boundary/anti-corruption-layer rule doesn't apply — keep the wire shape 1:1 with `StreakData`.

**Operational prerequisite — outside this repo, Chris only:** a Google Cloud project with an OAuth 2.0 Client ID configured for "Sign in with Google" (Google Identity Services), added as `GOOGLE_OAUTH_CLIENT_ID` in `api/.env` (see `api/.env.example`) and as a public `VITE_GOOGLE_CLIENT_ID` in `react/.env`. **BG-A19 cannot be tested end-to-end without this.** Say so plainly in that ticket's report if it's missing rather than stubbing around it.

### BG-A19 Backend: users table + streak sync API (Agent A — Backend) — done, `1f5ad1d1`
- [x] **Read:** `docs/architecture.md` (Backend Standard, Mapping Boundary), an existing slice end-to-end for the pattern (e.g. `api/src/slices/teams/`), `api/src/composition/container.js`, `api/src/composition/app.js` (CORS setup), `api/src/platform/migrations/001_create_hockey_domain_tables.sql`, `api/.env.example`.
- **Migration** `002_create_board_game_streak_tables.sql`: `users (id, google_sub unique not null, email, created_at)`; `board_game_streaks (user_id fk unique not null, wins jsonb not null default '{}', last_win_date text, updated_at)`.
- **New slice `api/src/slices/auth/`:**
  - `POST /api/auth/google` — body `{ credential: string }` (the Google ID token from Identity Services). Verify it with `google-auth-library`'s `verifyIdToken` against `GOOGLE_OAUTH_CLIENT_ID` (add the dependency). Upsert the `users` row keyed on the token's `sub`. Issue an app-owned, short-lived (e.g. 30-day) signed JWT — **your own token, never the Google token** — using a new `SESSION_JWT_SECRET` env var, returned in the response body as `{ token, email }`.
  - `GET /api/auth/me` — reads the `Authorization: Bearer <token>` header, verifies it, returns `{ email }` or 401.
- **New middleware** `presentation/middleware/requireAuth.js`: verifies the bearer JWT, attaches `req.userId`, else 401. Do not touch or extend `middleware/auth.js` — that's the unrelated diagnostics passphrase gate.
- **New slice `api/src/slices/boardGameStreak/`**, behind `requireAuth`:
  - `GET /api/board-game/streak` → `StreakData` for `req.userId`, or `{ wins: {}, lastWinDate: null }` if no row yet.
  - `PUT /api/board-game/streak` — body `StreakData`. **Server-side merge, never a blind overwrite:** union of both sides' `wins` keys (a win recorded anywhere is never lost), `lastWinDate` = the lexicographically later of the two. Upserts and returns the merged result.
- Wire both slices into `container.js`/`app.js` following the existing composition pattern.
- **Tests:** invalid/expired token is rejected; unauthenticated requests to the streak routes get 401; merge logic (disjoint wins union correctly, overlapping wins don't duplicate, `lastWinDate` picks the later date); PUT is idempotent for identical input.
- **Out of scope:** no frontend changes, no changes to any existing slice. Add `GOOGLE_OAUTH_CLIENT_ID` and `SESSION_JWT_SECRET` to `api/.env.example` with comments — you cannot create the actual Google Cloud credential; say so in your report if it's not present in `api/.env` for manual end-to-end testing.

### BG-A20 Architecture exception + frontend streak-sync client (Agent A — Backend/pure, after BG-A19) — done, `7966199c`
- [x] **Read:** `docs/architecture.md` (board-game exception paragraph), `data/dailyStreak.ts`, `react/src/lib/apiClient.ts`, any existing feature's `api/` folder (e.g. `features/teams/api/`) for the calling convention.
- **Doc change:** update the board-game exception line in `docs/architecture.md` to record the one narrow carve-out: `features/board-game/api/streakSync.ts` may call the network, for the optional Google sign-in sync only; `engine/`, `ai/`, `data/`, and the rest of `hooks/`/`components/` still make zero network calls.
- **`react/src/lib/apiClient.ts`:** add `post`/`put` helpers alongside the existing `get`, same try/catch-and-log shape, generic over the response type.
- **New `features/board-game/api/streakSync.ts`** (new `api/` subfolder for board-game, matching every other feature's layout): `googleSignIn(credential: string): Promise<{ token: string; email: string }>`, `fetchSession(token: string): Promise<{ email: string } | null>` (null on 401, don't throw), `fetchRemoteStreak(token: string): Promise<StreakData>`, `pushRemoteStreak(token: string, data: StreakData): Promise<StreakData>` (returns the server's merged result). All via the new `post`/`put`/`get` helpers with an `Authorization` header — no direct `axios` calls here.
- **`data/dailyStreak.ts` additions:** `saveStreak(data: StreakData): void` (writes to `localStorage` without the "record a win" side effects `recordWin` has — needed so the hook can persist a server-merged result locally); `mergeStreakData(local: StreakData, remote: StreakData): StreakData` (pure, mirrors BG-A19's server-side merge rule exactly — union `wins`, later `lastWinDate` — so client and server never disagree about what "merged" means).
- **Tests:** `mergeStreakData` (disjoint union, overlap, `lastWinDate` tie-break, empty-either-side); `saveStreak` round-trips through `loadStreak`; `streakSync.ts` functions with `fetch`/`post`/`put` mocked at the boundary (network never actually hit in tests).
- **Out of scope:** no UI, no hook wiring (BG-B31), no changes to `engine/` or `gameReducer`. Token storage location (`localStorage` key, e.g. alongside `rinkquest-streak`) is decided here but *used* by BG-B31 — name it and state the key in your report.

### BG-B31 Sign-in UI + hook sync wiring (Agent B, after BG-A20) — done, `566dc8d9` + `5adcecaa`
- [x] **Read:** `hooks/useBoardGame.ts`, `components/StreakCalendar.tsx`, `components/BoardGamePage.tsx`, `data/streakSync.ts` and `data/dailyStreak.ts` (from BG-A20), Google Identity Services docs for the "Sign in with Google" button/credential flow (the `index.html` script-tag pattern already used for the Google Fonts preconnect in BG-B23 is the model for loading Google's client script).
- **Sign-in entry point (done):** placed on the pre-game screen (`BoardGamePage`), alongside "Daily Streak" — visible without an extra click, unlike putting it inside `StreakCalendar`. Shows `GoogleSignInButton` when signed out, or "Signed in as {email}" plus a plain `GameButton` "Sign out" when signed in.
- **Theming (Chris, 2026-09-14; researched by PM 2026-09-14, see `docs/google-sign-in-handoff.md`):** give the sign-in affordance the same retro/pixel-art skin as the rest of the board game (`GameButton`/`GameButton.module.css` is the existing pattern — the "Sign out" button should just be a plain `GameButton`). **A fully custom-triggered Google button is not possible for the ID-token flow this app uses** — Google's Identity Services docs state there is no API to programmatically initiate the "Sign in with Google" credential flow from your own button; only their `renderButton` widget can launch it, and even their documented "custom button" fallback keeps the "G" logo, approved CTA text ("Sign in with Google" / "Sign up with Google" / "Continue with Google"), and specific color/font/padding fixed. (The `initTokenClient`/`requestAccessToken` OAuth flow *does* support a fully custom trigger button, but it yields an access token, not the ID token BG-A19's backend already verifies via `verifyIdToken` — switching to it means reworking the backend contract, out of scope here.) **Do this instead:** use Google's `renderButton` (or their documented custom-button spec, dark theme if it fits better) for the button itself, and put retro/pixel-art chrome (bordered panel, corner brackets, drop shadow, matching the game's palette) around it as a container — same treatment `StreakCalendar` already gives other embedded content. Don't reshape or recolor the Google button/logo itself.
- **On sign-in:** call `googleSignIn(credential)` → store the returned token (the `localStorage` key BG-A20 named) → `fetchRemoteStreak(token)` → `mergeStreakData(local, remote)` → `saveStreak(merged)` → `pushRemoteStreak(token, merged)` to reconcile the server too. Every step after storing the token must tolerate a network failure without breaking local play — log and continue, never throw into the render tree.
- **On mount, if a token already exists:** `fetchSession(token)`; if it returns null (expired/invalid), clear the stored token and fall back to signed-out silently — no error toast for an expired session.
- **`useBoardGame`'s win-recording path (BG-B27):** after `recordWin` updates local state, if signed in, fire `pushRemoteStreak` in the background (fire-and-forget, errors swallowed and logged) so a win syncs without blocking gameplay.
- **Sign out:** clears the stored token and any in-memory session state; local streak data is untouched (signing out never deletes what's on this device).
- **Accessibility + both themes**, matching every prior board-game UI ticket's bar (no color-only signals, tokens not raw hex, works at 412×915 and 1280×800).
- **Out of scope:** no new game mechanics. Nothing about how the local-only streak/bonus-energy math works changes for a signed-out player — this ticket only adds a backup/sync path on top.

**Implementation summary (PM, 2026-09-14):** `useGoogleAuthSession` hook owns the session (token in `localStorage['rinkquest-auth-token']`, mount-time restore via `fetchSession` with silent signed-out fallback, sign-in runs the full `googleSignIn → fetchRemoteStreak → mergeStreakData → saveStreak → pushRemoteStreak` chain). `authToken` threads `BoardGamePage → BoardGame → useBoardGame`, which fires `pushRemoteStreak` in the background after a recorded win. No new unit tests — this layer is plumbing over already-tested pieces (`mergeStreakData`, mocked `streakSync` functions), matching the repo's existing convention of not unit-testing hooks/components directly. Verified by actually running the dev server (playwright-core + system Chrome, not checked into the repo): pre-game screen renders the sign-in row with zero console errors, a corrupted/expired stored token is correctly cleared on mount, a match plays fine signed-out, and the layout holds at 412×915 and 1280×800 using only design tokens. **Not tested:** a real Google credential exchange — `GOOGLE_OAUTH_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID` are still not configured in this environment (see BG-9b below).

### BG-9b Integration + rollout check (PM with Chris) — blocked on Chris's Google Cloud setup
- [ ] Verify Google Cloud OAuth client is configured (`GOOGLE_OAUTH_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID` present) before BG-A19 is tested end-to-end — this is on Chris, not an agent. **Still not done as of 2026-09-14** — this is the only remaining blocker on Round 8.
- [ ] Manually verify: playing anonymously is completely unaffected by this round; signing in on device A then device B merges wins from both without dropping either; signing out and back in on the same device doesn't lose data; a network failure during sign-in degrades to "stayed signed out" rather than a broken game.
