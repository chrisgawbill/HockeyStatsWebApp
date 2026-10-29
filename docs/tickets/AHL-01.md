# AHL-01 — NHL/AHL toggle for the main league view

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE — Started by the Product Owner 2026-10-29. Implemented on
branch `ccr-373a3121-jzv70k`; pending Product Owner confirmation of the
checkpoint below, the experiential review, a Spotter run, and the API-AHL-02
deploy. Requested 2026-10-29 ("an NHL/AHL toggle on the page"). Frontend.

**Goal:** A visitor can switch the site's main league view between NHL and
AHL and see AHL standings, schedule, teams, rosters, players and stat leaders.

**Dependencies:** API-AHL-02 deployed.

**Read:** [architecture](../architecture.md), the header/nav component, the
API client used by standings, schedule, team and player pages.

**Product Owner checkpoint:**

- Where the toggle sits (PM recommendation: header, beside the nav, in the
  phone top bar on small screens) and how it looks; experiential review on
  desktop and phone.
- How the choice is kept (PM recommendation: `?league=ahl` in the URL so shared
  links open in the right league, remembered on the device for the next
  visit; NHL by default).

**Decisions:**

- 2026-10-29: Product Owner started the ticket. Built on both PM
  recommendations (toggle in the header beside the season selector, which is
  the phone top bar on small screens; `?league=ahl` in the URL, remembered on
  the device, NHL by default). Still needs explicit Product Owner
  confirmation and the desktop/phone review.
- 2026-10-29 (implementation): NHL URLs carry no `league`, so every NHL
  request and link is unchanged. Switching stays on the page, or moves to the
  team list (a team the other league lacks), the schedule (any game page) or
  home (an NHL-only page). AHL teams come from a fixed 2026-27 list of
  HockeyTech ids, codes and logos (the feed has no colors, so AHL pages use
  the default accent). AHL game links always open the game page, since the
  matchup preview is NHL only. Hidden in the AHL view: playoff race, playoff
  line, clinch legend, draft lottery, Up next, Rink Quest nav, player
  comparison, shot map and game flow, scoring summary, three stars, the
  season-series link, faceoff and Corsi categories, and every favorite
  control (until AHL-02, so AHL ids are never saved as NHL favorites).
  Boxscore fields the AHL lacks (TOI, PP goals, giveaways, takeaways) are left
  out of tables and team stats.
- Open for the Product Owner: the AHL roster still uses the "Line Change"
  layout, with lines projected from roster order because the AHL has no ice
  time; and Back after switching to the AHL stays in the AHL (NHL URLs carry
  no league). Recommendation: accept both for now.

**Scope:**

- The toggle sets the league for standings, schedule, game boxscore, team,
  roster, player stats and stat leaders pages, passing `league=ahl` to the API.
- NHL-only features (line changes, shot map and game flow, rivalries, the
  board game, draft lottery, player comparison until it supports AHL) are
  hidden or marked "NHL only" in AHL view, never shown with NHL data.
- Fields the AHL does not provide (`null` from the API) are hidden, not shown
  as 0.

**Exclusions:** favorites (AHL-02).

**Acceptance:**

- Switching leagues updates the page without a full reload and keeps the
  visitor on the same kind of page where it exists in the other league.
- Every page looks and works exactly as today in NHL view.

**Verify:** unit tests for the league state and API parameter; browser spec
switching leagues on standings, schedule and a team page at desktop and phone
widths; Spotter run.

**Evidence (2026-10-29, branch `ccr-373a3121-jzv70k`):**

- PASS: `pnpm tsc`, `pnpm test` (316/316, new: league state and storage,
  switch targets, the `league=ahl` API parameter, AHL standings names, AHL
  logos and colors for a shared `TOR`, AHL game links, null-aware team
  totals), `pnpm format:check`, `pnpm build`.
- PASS (local smoke, not Spotter): dev build against the local API with live
  HockeyTech data, at 1280px and 390px: standings, home, schedule, team list
  (32 AHL teams), the AHL `TOR` page (Toronto Marlies, no Leafs data, no
  favorite or lines calls), a final and a future AHL game; switching back
  and forth without a reload; no console errors.
- NOT RUN: Spotter on the pushed branch (`react/qa/league-toggle.spec.mjs`).
- NOT RUN: Product Owner experiential review on desktop and phone.

**Release follow-ups:** deploy API-AHL-02 before this ships (Product Owner).
