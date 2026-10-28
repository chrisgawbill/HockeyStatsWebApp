# API-WPR-02 — Favorite teams in the weekly report (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided with WPR-02 2026-10-26: frozen `teams[]` in new reports and a team line in the headline/push. Kickoff confirmed 2026-10-27: wording, team mute ignored in the weekly push, team-only users included, `formGames` limited to the report week (see block).

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Not run: the deploy check and the first Monday report with teams (2026-11-02). Previously recorded: ACTIVE — started 2026-10-26, kickoff decisions recorded
2026-10-27; implemented on HockeyStatsAPI `ccr-54dd4737-q7e2xd` (`aa7b308`).

**Goal:** New Weekly Player Reports freeze the user's favorite teams and
their week, so WPR-02 can show results and Team Form that never change on
reopening.

**Proposed contract (PM recommendation, confirm at kickoff):**

- Each new report gains `teams: [{ triCode, name, logo, tier, label,
  weekGames: [{ gameId, date, opponent, isHome, teamScore, opponentScore,
  outcome: 'W'|'L'|'OTL' }], formGames: [...] }]`, where `formGames` are the
  team's completed regular-season games through `weekEnd` in the fields
  `buildTeamForm` reads (`date, gameState, homeTeam, awayTeam, homeScore,
  awayScore, periodType`). Teams are the user's favorite teams when the
  report is made. Existing reports are not rewritten.
- Source: the cached club season schedule (12-hour cache), one per distinct
  favorite team across users during dispatch, like the player stats.
- Team line (Product Owner chose to add one): the headline gains a second
  sentence with each team's week record, e.g. "… Teams: COL 2-0-1, DAL 1-2-0."
  Teams without games are left out of the line; no line when none played.
  The push body is the headline, as today.
- A user is still skipped only when none of their players or teams played.

**Verify:** report builder unit tests (week records, OT losses, a team with
no games, the team line, a report with no favorite teams), dispatch test for
the frozen `teams[]`, README report fields updated.

**Kickoff decisions (Product Owner, 2026-10-27, recorded on the kickoff page):**

1. **Team line** as proposed: `Connor McDavid: 2G 4A in 3 GP and 2 more.
   Teams: EDM 2-0-1, DAL 1-2-0.`; teams in fan-tier order, idle teams left
   out, no line (headline unchanged) when no team played; only teams played:
   `Your favorite players did not play this week. Teams: COL 2-0-1.`; no
   favorite players: `Teams: COL 2-0-1, DAL 1-2-0.`
2. **Weekly push:** body is the headline built from the players not muted for
   the weekly push plus the team line for every team that played; a team's
   push mute covers After Action game alerts only. The push is sent when an
   unmuted player or any team played.
3. **Team-only users are included:** a user with favorite teams and no
   favorite players gets a Monday report and push when a team played.
4. **`formGames` hold only the report week's completed regular-season games**
   ("weekly reports should just show that week's performance and those
   games"). Field names and shape are unchanged; this replaces "through
   `weekEnd`" above, so WPR-02's Team Form panel in a report reflects the
   week rather than the season.

**Implemented (`aa7b308`):** `scheduleService.getClubSeason(triCode, season,
{ fresh })` (club season schedule from the 12-hour cache, plus the team's name
and logo from the payload); `weeklyReportBuilder` `buildReportTeams`,
`isClubScheduleCurrent`, and `buildHeadline(players, teams)`; the service loads
every user's favorite teams (`listAllFavoriteTeams`) and one club schedule per
distinct team across users, in parallel with the player stats. Week games are
the club games the league week schedule lists as completed regular-season or
playoff games. A cached club schedule missing one of those finals (the cache
serves expired copies) is refetched once; still missing, or any team schedule
failing, is a 502 with nothing written, so the second Monday run retries.
Users with no favorite teams get `teams: []`. README report fields updated.

**Verification so far:** `npm test` 146/146: builder tests for week records,
OT and shootout losses, a team with no games, fan-tier order, a playoff OT
loss, the team line in every case, a report with no favorite teams and
team-only reports; dispatch tests for the frozen `teams[]` (one club schedule
per distinct team, team-only user pushed, rerun unchanged), a stale club
schedule refetched once, a team schedule failure writing nothing, and the
team-only push body when every player is muted; a `getClubSeason` mapping test.
Not verifiable here: real NHL club schedule payloads (team name fields, OT/SO
`periodDescriptor`), a real Postgres run, and a real push.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Previously recorded: ACTIVE — kickoff decisions recorded 2026-10-27; implemented on HockeyStatsAPI `ccr-54dd4737-q7e2xd` (`aa7b308`), 146 API tests pass. Merged to `main` (`fff44ed`) 2026-10-27, which starts the Jenkins deploy (not confirmed from here). Pending: deploy check, then the Product Owner checks the first Monday report with teams (2026-11-02). Not run: the deploy check and the first Monday report with teams (2026-11-02).
