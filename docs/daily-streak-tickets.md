# Daily Streak Feature — Tickets for Chris

These are the same tickets from the backlog, written so you can pick them up one at a time. Each ticket tells you **what** to build and **why**, but leaves the **how** to you. If you get stuck, the backlog (`docs/board-game-backlog.md`, Round 7) has the detailed agent-style version with exact line numbers and function signatures.

The design spec is in `docs/board-game-design.md` §9 — read that first, it's short.

---

## The order

Build them in this order. Each one builds on the last.

```
A17 → A18 → B27 → B28 ─┐
                         ├→ (all three can happen in any order)
                   B29 ──┘
                   B30 (after B29)
```

---

## Ticket 1: Streak persistence (BG-A17)

**Goal:** Build a module that tracks which days the player has won a game, using `localStorage`.

**What it needs to do:**
- Save and load a record of win dates (as `"YYYY-MM-DD"` strings) from `localStorage`
- Count the current streak — how many consecutive days (ending today or yesterday) have a win
- Tell you whether the player currently has a streak bonus (streak of 1 or more)
- Record a new win for today
- Clean up entries older than 60 days so storage doesn't grow forever
- Handle `localStorage` being unavailable (private browsing, storage full, etc.) gracefully — never crash

**Where it goes:** `react/src/features/board-game/data/dailyStreak.ts`

**Why `data/` and not `engine/`:** The engine is pure — no browser APIs allowed. This module talks to `localStorage`, so it lives in `data/`. The engine will only ever see a number (`bonusEnergy`) passed in through `GameState`.

**Testing ideas:**
- A streak of 3 consecutive days counts as 3
- A gap in the middle resets the streak
- Recording the same day twice doesn't break anything
- If `localStorage` is empty or garbage, you get a clean default

**Don't peek at the backlog for this one unless you're stuck on:** what shape the stored data should be, or what the `localStorage` key should be called.

---

## Ticket 2: Bonus energy in the engine (BG-A18)

**Goal:** Make the game engine aware of bonus energy so streaking players get +1 energy per duel round.

**What to figure out:**
- `GameState` needs a new field to carry the bonus (0 or 1)
- The two places in `engine/duel.ts` where energy is reset to `ENERGY` (3) need to add the bonus on top — but only for the user, not the CPU
- `createInitialState` should default the bonus to 0
- The `NEW_GAME` action should accept a bonus energy value so the hook can pass it in later

**Key files to read:**
- `types/game.ts` — `GameState` lives here
- `engine/duel.ts` — search for `energy: ENERGY` (there are exactly two spots)
- `engine/gameReducer.ts` — `createInitialState` and the `NEW_GAME` handler
- `data/balance.ts` — where `ENERGY = 3` is defined

**The important constraint:** The CPU always plans with 3 energy. The bonus is a player-only perk. Check `engine/cpuDuelPolicy.ts` to make sure the CPU's planning budget doesn't accidentally pick up the bonus.

**Testing ideas:**
- Start a game with bonus 1 → duel rounds have 4 energy
- Start a game with bonus 0 → duel rounds have 3 energy
- CPU always plans with 3 regardless

---

## Ticket 3: Wire streak into the game hook (BG-B27)

**Goal:** Connect the streak module (Ticket 1) to the game hook (Ticket 2) so the bonus actually flows into gameplay.

**What to figure out:**
- When the hook mounts, load the streak and figure out whether the player gets the bonus
- Pass that bonus into the game's initial state
- When the player wins a game (`winner === 'user'`), record the win in the streak store
- Expose the streak data and count so the UI can show it later

**Key file:** `hooks/useBoardGame.ts` — this is the only file you should need to change.

**Think about:**
- When exactly does the win get recorded? (Hint: watch for `state.phase === 'gameOver'` and `state.winner`)
- Should you re-read the streak on every render, or just once? (Hint: `useRef` is lighter than `useState` for data the component doesn't need to re-render for)
- What does `newGame` need to do differently now?

---

## Ticket 4: Bonus energy badge in duels (BG-B28)

**Goal:** When the player has bonus energy, make it visible in the duel screen so they know why they have 4 energy instead of 3.

**What to figure out:**
- The duel screen already shows energy as orbs — find the CSS classes for them in `DuelScreen.module.css`
- When `bonusEnergy > 0`, you need a 4th orb that looks slightly different (a "bonus" feel)
- Add a colour token for the bonus orb in `react/src/styles/index.css` (both light and dark theme) — something warmer/brighter than the existing energy colour

**Constraints:**
- Colour alone can't be the only signal — a small "+1" label or distinct styling helps
- The shot and faceoff minigames don't show energy orbs, so no changes there
- Check it looks right in both light and dark themes

---

## Ticket 5: Pixel-art streak calendar (BG-B29)

**Goal:** Build a monthly calendar component that shows the player's win history as a pixel-art calendar grid.

This is the most creative ticket — you have a lot of room to make it look cool.

**What it should show:**
- A 7-column grid (Sun through Sat) for the current month
- Won days get a small puck icon (pixel-art style — an inline SVG circle, not an emoji)
- Today gets a highlighted border
- Future days are dimmed or hidden
- The current streak count shown prominently above the grid
- If there's an active streak, a line saying "+1 bonus energy today"
- Month navigation arrows to look back (up to ~2 months, since old data gets cleaned up)

**Pixel-art style cues:**
- Use `--font-pixel` (Press Start 2P) — the rest of the board game already uses it
- Stepped/aliased borders instead of smooth rounded corners (think retro game UI)
- Reuse the existing board-game colour tokens where they fit

**Where it goes:** `react/src/features/board-game/components/StreakCalendar.tsx` + colocated `.module.css`

**Props it receives:** the streak data (from the hook), the streak count, and an `onClose` callback.

**Check it at:** 412x915 (phone) and 1280x800 (desktop), both themes.

---

## Ticket 6: Calendar entry point (BG-B30)

**Goal:** Give the player a way to open the calendar from the pre-game screen.

**What to build:**
- A "Daily Streak" button on the pre-game screen (where the game length picker is)
- Clicking it swaps the length picker for the calendar (not a modal — same page flow)
- The calendar's "Back" button returns to the length picker
- If the player has an active streak, show a one-liner on the pre-game screen: something like "N-day streak - +1 energy today"

**Key file:** `components/BoardGamePage.tsx` — it already manages the `length` state for the picker; you just need a second piece of state to track whether you're showing the picker or the calendar.

**Keep it simple:** This is a small wiring ticket. The calendar component already exists from Ticket 5; you're just giving it a home.

---

## General tips

- **Run the checks** after each ticket: `npx tsc --noEmit`, `pnpm test`, and `pnpm build` (all from the `react/` directory).
- **Use `@/...` imports** everywhere — the project doesn't use relative imports.
- **No raw hex colours** in components — always use CSS tokens from `react/src/styles/index.css`.
- **Read the existing code** before writing new code. The patterns are consistent — match them.
- If something feels wrong or unclear, check the design doc (§9) or the detailed backlog (Round 7) before guessing.
