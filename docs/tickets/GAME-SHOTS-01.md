# GAME-SHOTS-01 — Shot map and game flow on the game page

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-27 (PM recommendations): one full rink; period/strength/player filters on the shot map only; views after Goals by period, side by side on desktop; blocked shots counted but not drawn; team colours with a both-theme fallback; Player filter added to scope (see block). Accepted by the Product Owner 2026-10-27 after Spotter passed.

**Status:** DONE — Spotter passed and the Product Owner accepted
2026-10-27; merged to `main`. Follow-ups that do not block acceptance: add
`qa/game-shots.spec.mjs` to Spotter's config so the eight specs run there;
check real games once API-PBP-01 is deployed and checked against a recorded
NHL payload (blocked-shot coordinates).

**Scope addition (Product Owner, 2026-10-27):** the shot map gets a Player
filter next to period and strength, built from `shooterId`/`shooterName` in
the game's events, so one player's shots and goals in that game can be shown.
A season-long player shot map is out of scope.

**Carried forward from API-PBP-01 (not reopened):** the contract as decided;
home always shoots toward +x and away toward -x; events without coordinates
have null `x`/`y`; shootout attempts are not in the feed; a 404 means the route
is not deployed or the id is unknown. No backend changes in this ticket.

**Decided at kickoff (Product Owner, 2026-10-27, PM recommendations):**

- **Rink:** one full rink, home attacking right; "◀ AWAY shoots / HOME shoots ▶"
  in the neutral zone. Goals filled, shots on goal as rings, misses as ×.
  Blocked shots are counted (totals, table, game flow) but not drawn: their
  location is where the block happened.
- **Filters (shot map only):** period segmented control All · 1st · 2nd · 3rd
  (· OT, 2OT… only when played); strength select All strengths / Even / Power
  play / Shorthanded; player select grouped by team (away first), sorted by
  last name, built from all events. Filters combine (all must match). "All"
  = no restriction: every period including OT, every strength including
  events with none, both teams. On phones the period control is full width
  with the two selects side by side below. The totals line and summary table
  follow the filters; the game flow always shows the whole game. An empty
  combination fades the rink with a sentence naming the filters and a Reset
  filters button.
- **Placement and states:** after Goals by period, before the Scoring
  summary; side by side at ≥900px, stacked below. Live games refresh on the
  existing game-detail polling interval (failed refresh keeps the last
  events). Games that have not started already redirect or show the preview
  scoreboard, so no views. A live game with no events shows "No shots yet"
  in both. A 404 hides both views silently; other failures show an inline
  error with Try again.
- **Null x/y:** left off the map, counted in the game flow, totals and table,
  with a note under the rink. (Events with a null time are left off the game
  flow only.)
- **Colours:** home keeps its primary (else secondary) moved into the
  data-viz lightness band and to 3:1 on the rendered chart card; the away team
  tries primary, secondary, then chart blue/orange, taking the first that
  stays distinct (OKLab ΔE ≥ 15 normal, ≥ 8 protan/deutan) in both themes.
  The pair is chosen once for both themes. About 40% of matchups keep both
  team colours. Legends, end labels and rink sides always name the team.
- **Accessibility:** charts are `aria-hidden`; a visible "Shots and goals by
  period (table)" disclosure (G, SOG, attempts per team per period, plus
  totals) is the text version and follows the filters; markers are not tab
  stops; tooltips (marker hover/tap, flow crosshair) only repeat table values.

**Implementation (2026-10-27):** `features/game-detail`: `GameShots`
(loads via `usePlayByPlay`, picks colours), `GameFlowChart` + `GameFlowGrid`,
`ShotMap` + `ShotMapFilters` + `ShotRink` + `RinkOutline` +
`ShotSummaryTable`, `ChartTooltip`; helpers `shotMapHelper`,
`gameFlowHelper`, `matchupChartColors`, `chartColorMath`, `rinkGeometry`;
`GetGamePlayByPlay` in the feature API. `SlidingToggle` gained an optional
`label` (accessible group name). Inline SVG, no new dependency, no backend
change.

**Verified (2026-10-27):** typecheck, format check, unit tests (65 files,
310 tests; new: filtering incl. the player filter, flow series/timeline,
matchup colours for all 992 pairings in both themes) and build pass.
`react/qa/game-shots.spec.mjs` (8 tests, titles "GAME-SHOTS-01 Verify:")
passed locally against a stand-in for the Spotter test module and a mocked
API.

**Spotter (2026-10-27, `5c05fdb`):** first run FAIL — the play-by-play
call was missing from the recorded fixtures (404 plus a logged console
error on every game visit). After the fixtures were re-recorded: PASS, no
medium or high findings; typecheck, unit tests and format pass; 286/286 page
visits plus fault visits across chromium, firefox, webkit, iPhone 13 and
Pixel 7; 250/250 project specs. Remaining lows: Firefox
`NS_BINDING_ABORTED` logo/headshot requests on the home page (the same
kind also shows as fixed vs base, so it comes and goes between runs and
this branch doesn't touch home), and Spotter's config does not yet list
`qa/game-shots.spec.mjs`, so the eight GAME-SHOTS-01 specs were not part
of the 250.

**Goal:** `/game/:gameId` shows where each team shot from and how the game
swung over time.

**Dependencies:** API-PBP-01 contract (the page must work before it deploys:
hide both views when the call 404s).

**Proposed design (PM recommendation, confirm at checkpoint):**

- **Shot map:** a half-rink SVG per team (or one full rink), goals as filled
  markers, other shots as outlines, team colours that pass contrast in light
  and dark. Tap/hover a marker for shooter, time, shot type. Filters: period,
  strength (all / even / PP).
- **Game flow:** cumulative shot attempts per team over elapsed time, with
  goal markers and period dividers. Built per the `dataviz` skill.
- New components inside `features/game-detail`; inline SVG, no new chart
  dependency unless the Product Owner approves one.
- Live games refresh with the existing game-detail polling.

**Acceptance:**

- Marker counts match the API events for the selected filters.
- Goals, period boundaries and the side normalization render correctly for a
  recorded game, including overtime.
- Keyboard and screen-reader users get a text summary (shots and goals by
  period) in place of the charts.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** unit tests for filtering and the flow series; Playwright against a
mocked API with screenshots.

**Imported overview record (2026-10-28):** DONE — Spotter passed and the Product Owner accepted 2026-10-27; merged to `main`. Follow-ups: add `qa/game-shots.spec.mjs` to Spotter's config; check against real games once API-PBP-01 deploys.
