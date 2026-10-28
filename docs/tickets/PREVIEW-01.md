# PREVIEW-01 — Pre-game preview on the matchup page

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22: previews use /matchup (not the game page) with a Team DNA card per team; every game card links through one routing helper (future → /matchup, live/final → /game) and /game/:id redirects games that have not started; phones switch between the two DNA cards; the puck-drop chip turns into a game-page link at the start time (local timer, no polling); TeamDna/FormStrip move to `components/` and take the team color. Lines, goalies and the team comparison are dropped; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24 by explicitly closing tickets awaiting acceptance. Previously recorded: implemented and verified.

**Goal:** Before puck drop, a game opens a useful preview instead of an empty
box score: the `/matchup` page for its two teams with the game's date, arena and
puck drop, the season series, a Team DNA card per team, and recent form.

**Approved design (Product Owner, 2026-10-22):**

- **Entry (option A):** `lib/gamePath.ts` routes every game link: future or
  pregame with the start still ahead → `/matchup?teamA=<away>&teamB=<home>&game=<id>`,
  anything else → `/game/:id`. Schedule day cards, calendar chips, the team
  schedule strip and the Up next rows use it; future and live cards become
  clickable. Search keeps listing finished games only.
- **Redirect:** `/game/:id` redirects (history replace) from the loaded season
  list, with a box-score fallback in the game page; past the scheduled start it
  never redirects, so a stale list cannot bounce a started game.
- **Team DNA:** one card per team, tinted in the team color; side by side from
  768px, a team switch (also swipe) on phones. Order: series summary, Team DNA,
  form, played, upcoming. Shown on every matchup, preview or not.
- **Puck drop:** plain "Puck drop 7:00 PM" before the start; at the start a
  local timer turns it into "Game on · open the game page" (finished games:
  "Final · open the game page"). The page makes no requests and never polls.
- **Architecture:** `TeamDna` and `FormStrip` move to `components/` (own CSS
  modules, optional `teamColor`, otherwise they inherit `--color-primary`);
  `teamDna`, `teamForm`, `teamColor` helpers move to `lib/` with structural
  types; recorded in `architecture.md`.
- **Dropped from the original idea:** projected lines, goalies, and the team
  comparison section.

**Acceptance:**

- Future game cards open the preview; live/final cards and `/game/:id` for
  started games open the game page; `/game/:id` for a future game redirects.
- No new API calls (season games and league team list only); no polling.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** unit tests for the routing helper (`lib/gamePath.test.ts`) and game
context parsing (`matchup/utils/matchupGameContext.test.ts`); Playwright against
a mocked API for future/live/final games and a plain `/matchup`, with
screenshots.

**Evidence (2026-10-22):** tsc, Prettier, Vitest 50 files / 206 tests pass (14 new); build
passes; Playwright 29/29 against a mocked API (schedule card and team strip →
preview; live card → game page; warm and cold `/game/:id` redirect with history
replace; live and final stay; puck-drop flip after 120 simulated minutes with
zero requests; link opens the game page without bouncing; plain `/matchup`;
team change drops `game=`; phone switch; no horizontal scroll at 375/1280
light/dark). Up next links are covered by unit tests only (they need sign-in).
