# Rink Quest — Board Game Backlog

The rules spec is [board-game-design.md](./board-game-design.md). Work happens on branch `board-game`. The PM (Claude) hands tickets to two Sonnet agents: **Agent A** builds the engine (pure TypeScript) and **Agent B** builds the UI (React). Chris makes every executive decision.

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
