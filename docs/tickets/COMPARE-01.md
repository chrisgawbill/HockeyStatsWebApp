# COMPARE-01 — Player comparison

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22: option A data (API-COMPARE-01); Compare button in `PlayerStatsDialog` only; PPG = points per game; PM's call on presentation: table only, GP unmarked, ties at displayed rounding. Product Owner reviews 375/1280 light/dark screenshots.

**Status:** DONE — accepted by the Product Owner from 375/1280 light/dark screenshots 2026-10-22. QA PASS 1–9; dialog Compare link checked in source only. Release needs API-COMPARE-01 deployed first (league-wide summaries return every player).

**Goal:** A user can pick two or three players and compare their season stats
side by side.

**Dependencies:** WPR-01 (headshots and stars), API-COMPARE-01 (every player
in the league-wide summaries). Career comparison is out of scope (would need
an API ticket for the NHL player landing).

**Data (approved 2026-10-22, option A):** The checkpoint check failed: team
summaries (`?teamId=`) hold the whole team, but the league-wide call held only
100 unsorted rows, and the contract had no team, shots, S% or PP goals.
API-COMPARE-01 fixes both on the existing endpoints. The page makes two calls,
`/player/skater/summary` and `/player/goalie/summary` with no `teamId`, which
serve both the picker and the table. Reading season stats from the database
was considered and rejected: `player_season_stats` is filled only as a side
effect of summary reads, so it has the same gaps, and nothing reads it yet.

**Approved design (2026-10-22; Product Owner left presentation to the PM):**

- Route `/compare?players=<id>,<id>[,<id>]` (plus the app's `season=`) so a
  comparison is shareable. Non-numeric ids dropped, duplicates removed, max 3;
  picking or removing replaces the URL. Unknown id: "not found this season"
  with Remove, in that slot only.
- Entry point: a "Compare" button beside Close in `PlayerStatsDialog`, which
  covers roster rows and favorite player cards; opens `/compare?players=<id>`
  with the picker focused. Leaderboards deferred; no header nav link.
- Player picker: ARIA combobox over the cached summaries, from 2 letters,
  case- and accent-insensitive, matching first- or last-name prefixes (last
  name first, then by GP), up to 8 rows, picked players excluded; ↑/↓, Enter,
  Esc, Tab. The first player sets the group; with none picked a Skaters |
  Goalies `SlidingToggle` chooses it. A mismatched slot in a shared URL shows
  a message instead of joining the table.
- Layout: headshot column per player, then stat rows (skaters: GP, G, A, P,
  PPG = points per game, +/-, SOG, S%, TOI/GP; goalies: GP, W, GAA,
  SV%, SO). Best value per row highlighted (bold, tint, dot, and hidden text):
  GAA lower-is-better, GP not highlighted, ties all marked at displayed
  rounding, all-tied rows unmarked, missing values skipped. Table only, no
  bars.
- Phones: sticky stat-label column, ~116px player columns; two players fit,
  the third peeks and scrolls inside the table, never the page.
- Shared pieces: `lib/comparePath.ts` (build/parse, used by the teams dialog
  and the page), `lib/playerHeadshot.ts` gains the season mug URL; the rest in
  `features/player-compare/`, which renders `favorite-players`
  `PlayerHeadshot` as a listed exception.

**Acceptance:**

- Opening a shared URL rebuilds the same comparison; unknown ids show a
  message for that slot only.
- Leaders highlight correctly, including ties and lower-is-better stats (GAA).
- 375/1280, light/dark, no page horizontal scroll; the picker is keyboard
  usable.

**Verify:** unit tests for best-value highlighting and URL parsing; Playwright
against a mocked API (shared URL rebuild, unknown id in one slot, skater and
goalie comparisons, keyboard picker) with 375/1280 light/dark screenshots.
