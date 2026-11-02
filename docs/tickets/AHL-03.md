# AHL-03 — AHL favorites in the weekly report page

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE — Started by the Product Owner 2026-11-02. Frontend.

**Goal:** The Weekly Player Report page shows AHL favorite players and teams
next to NHL ones, each clearly AHL and linking to its own league's pages.

**Dependencies:** API-AHL-04 contract (build against it: a report without
`league` fields reads as NHL, so the page works before the API ships);
AHL-02 (league-aware favorites).

**Read:** API-AHL-04, WPR-02 and AHL-02 tickets;
`features/favorite-players/components/WeeklyReportPage.tsx`,
`WeeklyReportTeamCard.tsx`, `utils/weeklyReportFormat.ts`,
`utils/weeklyReportTeams.ts`, `types/favoritePlayers.ts`, `lib/league.ts`,
the weekly-report part of `after-action-reports/components/NotificationBell.tsx`.

**Product Owner checkpoint:** the API-AHL-04 checkpoint items that show on
the page (stat line without TOI, one mixed list); how an AHL entry shows its
league (PM recommendation: the same small outlined "AHL" tag AHL-02 uses on
favorite cards); experiential review.

**Decisions:**

- 2026-11-02 (Product Owner): started the ticket ("start work on tying
  favorited AHL players and teams in the weekly report").
- 2026-11-02 (PM): the report-page changes below are safe before the API
  ships (every entry reads as NHL until `league` arrives). The bell's
  "covers NHL favorites only" copy and NHL-only weekly mutes stay until
  API-AHL-04 is deployed, then change in a follow-up commit on this ticket.

**Scope:**

- Report entries read `league` (missing means NHL).
- AHL player cards: "AHL" tag, AHL headshot fallback and star, no TOI/GP chip;
  best-game links open `/game/:id?league=ahl`.
- AHL team cards: "AHL" tag, AHL logo and fallback color, result rows open
  `/game/:id?league=ahl`; keys and heading ids include the league so an AHL
  and NHL `TOR` never share one.
- After API-AHL-04 deploys: the bell lists AHL players in the weekly-push
  mutes and drops "The weekly report covers your NHL players only."

**Exclusions:** report generation and headline wording (API-AHL-04); AHL
games in My Hockey.

**Acceptance:**

- A report with an NHL and an AHL `TOR` shows two team cards told apart by
  the AHL tag, each linking its games in its own league.
- An AHL skater card shows no TOI chip; NHL cards are unchanged.
- A report with no `league` fields renders exactly as today.

**Verify:** unit tests for the league-aware helpers; browser spec
(`qa/weekly-report-teams.spec.mjs` or a new `weekly-report-ahl.spec.mjs`)
with a mixed-league mocked report at 375/1280 light/dark; Spotter run;
Product Owner experiential review with a real AHL report.

**Implemented (report page, before API-AHL-04):** `league?` on
`WeeklyReportPlayer` and `WeeklyReportTeam`; `reportEntryLeague` (missing
means NHL); AHL skaters have no TOI chip (`skaterStatItems(stats, league)`);
AHL player and team cards show "AHL ·" in their meta/record line (the page's
existing favorites-list pattern, no new tag style), use the AHL headshot star,
logo and fallback color (`getTeamAccentColor` takes `league`), and link games
with `?league=ahl`. NHL ids are unchanged; AHL team ids are
`weekly-team-ahl-<TRI>` and `team-form-ahl-<TRI>`. Bell copy unchanged.

**Evidence (2026-11-02, branch `claude/charming-wright-hdk0cx`):**

- PASS: `pnpm tsc`, `pnpm test` (342/342, new: entry league defaults to
  NHL; AHL skaters have no TOI chip while NHL ones keep it),
  `pnpm format:check`, `pnpm build`.
- PASS (local Playwright against a preview build with a stand-in for
  Spotter's test module, not Spotter): `qa/weekly-report-ahl.spec.mjs`, 4/4
  (375/1280 light/dark), and the WPR-02 report-page specs 12/12.
- FAIL, not caused by this ticket: WPR-02's TeamPage spec (4 runs) expects
  the `team-form-enter` animation, which AERO-06 replaced with `ds-enter`;
  TeamPage is untouched here.
- NOT RUN: Spotter on the pushed branch (add `qa/weekly-report-ahl.spec.mjs`
  to its config); Product Owner experiential review; real AHL report data.

**Release follow-ups:** API-AHL-04 deploy, then the bell copy change and a
real-data review (Product Owner).
