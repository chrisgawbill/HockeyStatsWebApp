# AHL-01 — NHL/AHL toggle for the main league view

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested by the Product Owner 2026-10-29 ("an NHL/AHL
toggle on the page"). Frontend.

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

**Decisions:** none yet.

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
