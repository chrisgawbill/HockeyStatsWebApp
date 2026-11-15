# PWHL-01 — PWHL in the league toggle

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested 2026-11-15 ("can we plug PWHL data in like we do
with AHL"). Frontend.

**Goal:** A visitor can switch the site's main league view to the PWHL and
see PWHL standings, schedule, games, teams, rosters, players and stat leaders,
the same way the AHL works today.

**Dependencies:** API-PWHL-01 deployed. Builds on AHL-01.

**Read:** [AHL-01](AHL-01.md) decisions; `react/src/lib/league.ts`,
`react/src/lib/LeagueContext.tsx`, `react/src/components/LeagueToggle.tsx`,
`react/src/lib/teamListData.ts` and `ahlTeamListData`, `teamLogo.ts`,
`teamColor.ts`; then the `league === 'ahl'` / `league === 'nhl'` checks (30
files).

**Product Owner checkpoint:**

- **Toggle with three leagues** (PM recommendation: keep the sliding toggle
  with NHL / AHL / PWHL if it fits the phone top bar at 360px, otherwise a
  compact select there and the toggle on desktop). Experiential review on
  desktop and phone.
- **Standings points note** (PM recommendation: a one-line legend under PWHL
  standings, "3 pts regulation win · 2 OT/SO win · 1 OT/SO loss"). The columns
  stay the same as the NHL's.

**Decisions:**

- 2026-11-15 (planning): as for the AHL, PWHL URLs carry `?league=pwhl`, are
  remembered on the device, and NHL stays the default with no `league` in its
  URLs. Everything AHL-01 hides in the AHL view is also hidden in the PWHL
  view, since the API answers the same for both HockeyTech leagues.
- 2026-11-15 (spike): the feed's 2026-27 team list is 12 teams: BOS 1, DET 10,
  HAM 11, MIN 2, MTL 3, NY 4, OTT 5, SJ 13, SEA 8, TOR 6, VAN 9, VGS 12
  (HockeyTech id). Logos are at `assets.leaguestat.com/pwhl/logos/<id>.png`
  (Minnesota's is `.jpg`). Teams are in Eastern and Western conferences. The
  feed has no team colors.

**Scope:**

- `League` becomes `'nhl' | 'ahl' | 'pwhl'`. `parseLeague`,
  `getLeagueQueryValue` and `withLeagueQuery` handle `pwhl`.
- Checks that mean "not the NHL" (`league === 'ahl'` for NHL-only features,
  favorites, playoff race, draft lottery and similar) become `league !==
  'nhl'`. Checks that mean "the AHL" stay as they are.
- A fixed 2026-27 PWHL team list (the ids, codes and logos above) beside
  `ahlTeamList`, with the default accent color. Tri-codes shared with the NHL
  (`BOS`, `DET`, `MIN`, `MTL`, `OTT`, `SEA`, `TOR`, `VAN`) or the AHL (`HAM`,
  `SJ`, `TOR`) always resolve within the chosen league.
- The team list's conference and division dropdown shows the PWHL's groups,
  not the AHL's or NHL's names.
- The standings points note per the checkpoint.

**Exclusions:** PWHL favorites and the weekly report (a later PWHL-02 after
API-PWHL-02); ice time, faceoffs and other stats the API leaves `null`.

**Acceptance:**

- Switching to the PWHL updates the page without a full reload and keeps the
  visitor on the same kind of page where it exists, following the AHL-01
  rules.
- PWHL `TOR` opens the Toronto Sceptres, never the Maple Leafs or Marlies.
- The NHL and AHL views look and work exactly as before.

**Verify:** unit tests for league parsing and storage, the `league=pwhl` API
parameter, PWHL logos for a shared tri-code, and switch targets with three
leagues. Browser spec switching NHL → AHL → PWHL on standings, schedule and a
team page at desktop and phone widths. Spotter run.

**Evidence:** none yet.

**Release follow-ups:** deploy API-PWHL-01 before this ships (Product Owner).
Check 2026-27 standings and game pages once PWHL games start on 2026-12-04.
