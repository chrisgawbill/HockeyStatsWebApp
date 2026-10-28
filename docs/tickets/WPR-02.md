# WPR-02 — Favorite teams and their form in the weekly report

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-26: team data frozen in the report (API-WPR-02); each team card shows the week's results and the full Team Form panel; team section below the players; headline and push gain a team line (see block). Product Owner reviews 375/1280 light/dark screenshots.

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Not run: the Product Owner review of the team section with real data. Previously recorded: ACTIVE — started 2026-10-26; mockups approved 2026-10-26; awaiting
Spotter and the Product Owner's screenshot review. Requested by the Product Owner 2026-10-26: "add a team
section to weekly report with team forms (if that component from TeamPage is
not its own component file it should be)".

**Goal:** The Weekly Player Report also has a team section: for each favorite
team, that week's results and its Team Form as of the end of the week.

**Reuse finding (PM, 2026-10-26):** the TeamPage "Team Form" panel is already
its own file, `features/teams/components/TeamFormPanel.tsx`, built on
`components/FormStrip`, `features/teams/components/PointsPaceSparkline` and
`SplitBars`, and `buildTeamForm(games, triCode)` in `lib/teamForm.ts`. It is
not yet reusable: it lives in `features/teams`, takes its styles from
`TeamPage.module.css`, and hard-codes the heading id `team-form-heading`
(several teams on one page would repeat it). Per the readability pass,
a piece used by two features moves to `components/`:

- Move `TeamFormPanel`, `PointsPaceSparkline` and `SplitBars` to
  `components/` with their own `TeamFormPanel.module.css` (the `form-panel`,
  `points-sparkline` and `split-bars` rules leave `TeamPage.module.css`).
- Add an optional `className` prop (as `FormStrip`, `TeamLogo` and other
  `components/` pieces already take) for the outer surface. Placement that
  belongs to one page stays with that page: TeamPage passes its margin and
  entry animation from `TeamPage.module.css`; the report passes its own
  spacing or width.
- Give the panel a heading/id prop so each instance is unique; TeamPage keeps
  its current heading and looks unchanged.

**Decided 2026-10-26 (Product Owner):**

1. **Data:** frozen in the report. API-WPR-02 adds `teams[]` to new reports;
   older reports have none and show no team section. The page builds each
   panel with `buildTeamForm` from the frozen games.
2. **Team card:** logo and name, the week's results (opponent, score,
   W/L/OTL), then the full Team Form panel as of the week's end.
3. **Order:** the team section goes **below** the players, sorted by fan tier
   (as on My Hockey); a team with no games that week shows "No games this
   week" with its form.
4. **Headline and push:** gain a team line (API-WPR-02).

**Presentation approved 2026-10-26 (Product Owner, from 375/1280 light/dark
mockups):** a "Favorite teams" heading; a "2-0-1 this week" line under each
team name; results card beside the Team Form panel from 769px, stacked on
phones; each card and its sparkline in the team's accent color; each result
row links to its game page; the fan tier orders the cards but no tier badge
is shown.

**Dependencies:** API-WPR-02 contract (build against it; a report without
`teams` shows no team section, so the page works before the API deploys).

**Implemented (2026-10-26):** `components/TeamFormPanel` (with
`PointsPaceSparkline`, `SplitBars` and `TeamFormPanel.module.css`) takes
`className`, `headingId` and `headingLevel`; TeamPage passes its margin and
entry animation as `.team-form`. `WeeklyReportTeamCard` and the page's
`ReportTeamsSection` render `report.teams` via `utils/weeklyReportTeams.ts`
(`listReportTeams`, `buildReportTeamForm`, week formatting). Logos come from
`TeamLogo` (theme-aware) rather than the frozen `logo` URL.

**Verification so far:** unit tests for `weeklyReportTeams`; tsc, vitest,
format check, build. TeamPage's Team Form pixel-identical before/after the move
at 375/1280 light/dark against a mocked API. `qa/weekly-report-teams.spec.mjs`
(16 tests, "WPR-02 Verify:") passed locally with a stand-in for Spotter's test
module; its TeamPage check also passes on the pre-move code. Real NHL data and
logos were not reachable here. Spotter on `c8b3ff9` (2026-10-26): PASS —
typecheck, unit tests and format pass; 286 anonymous page visits and 170
replayed project specs pass; 3 low findings: two home-page headshot requests
aborted in Firefox at 375 dark (an image request the browser cancelled; this
branch does not touch the home page), and its config lacks
`qa/weekly-report-teams.spec.mjs`, so the WPR-02 specs were not executed.
Spotter has no signed-in sweep, so the report page itself was not visited.
Spotter on `b5deb3d` (2026-10-26, same code as `c8b3ff9`, spec added to its
config): PASS — project specs 250/250 (the 80 new runs are the 16 WPR-02
Verify tests in chromium, firefox, webkit, iPhone 13 and Pixel 7);
typecheck, unit tests and format pass; 4 low findings, all home-page
logo/headshot requests the browser cancelled in Firefox at 375 (the same kind
churns in "fixed vs base"; this branch does not touch the home page). Its
advisory visual review flagged 11 WebKit/Pixel 7 shots, including team at
375/768; the previous run on identical code flagged no team shots, so these
are treated as run-to-run noise. Merged to `main` 2026-10-26 at the Product Owner's request,
ahead of API-WPR-02 (reports without `teams` show no team section).
API-WPR-02 kickoff (2026-10-27): `formGames` hold only the report week's
regular-season games, so each card's Team Form panel shows that week's form
(e.g. a 3-game strip and splits) instead of the season to date; no frontend
change, the shape is unchanged. Check the panel's look with week-only data at
the Product Owner's real-data review.

**Verify:** unit tests for any new form/week helpers; TeamPage's Team Form
looks unchanged after the move (before/after screenshot); Playwright against a
mocked API for the report's team section, including a no-games week and a
report without teams, at 375/1280 light/dark without horizontal scroll. The
Product Owner reviews screenshots.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Previously recorded: ACTIVE — started 2026-10-26; Team Form panel moved to `components/`, team section built against the API-WPR-02 contract; mockups approved 2026-10-26. Spotter PASS on `b5deb3d` (2026-10-26) with the WPR-02 specs (16 tests × 5 browsers, all pass); merged to `main` 2026-10-26. Pending: API-WPR-02 deploy and Product Owner review of the team section with real data. Not run: the Product Owner review of the team section with real data.
