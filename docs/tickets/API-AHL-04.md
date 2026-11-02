# API-AHL-04 — AHL favorites in the Weekly Player Report (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** READY — Requested by the Product Owner 2026-11-02 ("start work
on tying favorited AHL players and teams in the weekly report"). Approved by
that request; the checkpoint below needs answers before the affected
implementation. HockeyStatsAPI; starting it here does not authorize backend
edits, and that repository is not attached to the web app session.

**Goal:** The Monday Weekly Player Report and its push include the user's AHL
favorite players and teams alongside their NHL ones, so the report covers the
whole shared favorites list.

**Dependencies:** API-AHL-01 (stored AHL schedules and stats), API-AHL-03
(league on favorites; today the weekly dispatch reads only `league = 'nhl'`).
Blocks AHL-03's release. API-AHL-01/03 must be deployed first.

**Read:** API-WPR-01 and API-WPR-02 tickets;
`src/slices/weeklyPlayerReports/*` (`weeklyReportBuilder`, service,
repository), the push slice's `weeklyDispatch`, `src/platform/ahlApiClient.js`,
the API README "Weekly Player Report" section.

**Product Owner checkpoint:** resolved 2026-11-02 (all five items as
recommended below; see Decisions). Remaining: first real AHL report review.

**Checkpoint items as asked (PM recommendation in each item):**

1. **Break weeks.** Today a week with zero completed NHL games makes no
   reports at all. Recommendation: judge each league on its own. A week is a
   full break only when neither league completed a game; in an NHL break
   (All-Star week) a user still gets a report when an AHL favorite played.
2. **AHL skater stat line.** HockeyTech has no time on ice. Recommendation:
   the NHL line without TOI/GP (GP, G, A, PTS, +/-, SOG, best game); goalies
   unchanged (GP, W-L-OTL, SV%, GAA, SO). Shootout losses count as OTL, as
   in the NHL report.
3. **Headline and push.** AHL and NHL tri-codes can match (`TOR`).
   Recommendation: AHL teams in the team line carry the league, e.g.
   `Teams: EDM 2-0-1, TOR (AHL) 1-1-0.`; the best performer is chosen across
   both leagues with the same rule (skaters by points, else goalies by wins),
   and an AHL player's line has no tag (names do not collide in practice).
4. **Order.** Recommendation: one mixed list per section, as in the shared
   favorites list (players in their existing order, teams by fan tier); no
   separate AHL section.
5. **Weekly push mutes.** Recommendation: AHL players get the same per-player
   weekly-push mute as NHL players; team push mutes stay game-alert only
   (API-WPR-02 decision 2).

**Decisions:**

- 2026-11-02 (Product Owner): requested AHL favorites in the weekly report.
- 2026-11-02 (PM): split into this backend ticket and frontend AHL-03.
- 2026-11-02 (Product Owner): "go with your recommendations on all six"
  (items 1–5 here, plus AHL-03's league marking):
  1. Breaks are judged per league; a full break only when neither league
     completed a game. An AHL favorite who played in an NHL break week gets
     a report and push.
  2. AHL skaters: GP, G, A, PTS, +/-, SOG, best game, no TOI/GP; goalies
     unchanged; shootout losses count as OTL.
  3. AHL teams in the team line read `TOR (AHL) 1-1-0`; the best performer
     is chosen across both leagues by the existing rule; AHL player lines
     carry no tag.
  4. One mixed list per section, no separate AHL section.
  5. AHL players get the per-player weekly-push mute; team push mutes stay
     game-alert only.
- Still a spike decision inside approved scope (not a Product Owner item):
  on an AHL feed failure, 502 on the first Monday run, then NHL-only entries
  with a logged warning on the last run of the day.

**Scope (proposed contract, confirm at the checkpoint):**

- Every new report player and team gains `league: 'nhl' | 'ahl'`. Reports
  already stored are not rewritten; a missing `league` means NHL.
- AHL player entries use the existing `WeeklyReportPlayer` shape; fields the
  feed lacks are `null` (`toiPerGame`, `headshot`). `bestGame.gameId` and team
  `weekGames[].gameId` are HockeyTech game ids for AHL entries.
- AHL team entries use the `WeeklyReportTeam` shape, with `formGames` from the
  stored AHL season schedule for the report week (as API-WPR-02 decision 4).
- Data: one AHL league schedule read per week for the break check, AHL player
  stats for all distinct AHL favorites across users at once (per-game rows
  from the feed, or the stored per-game data if API-AHL-01 has it; spike
  first), and one AHL club schedule per distinct AHL team. Cache keys keep
  the `ahl:` prefix and include the week.
- A failing AHL feed must not block NHL entries: the spike decides between
  "502 and nothing written" (today's rule, retried by the second Monday run)
  and writing NHL-only entries; recommend 502 on the first run and NHL-only
  with a logged warning on the last run of the day.
- Once-only sending, the ledger, read tokens and the push payload are
  unchanged.

**Exclusions:** AHL After Action Reports and game pushes; AHL games in My
Hockey; rewriting existing reports.

**Acceptance:**

- A user with NHL and AHL favorites gets one report with both, each entry
  marked with its league; an AHL `TOR` and the Maple Leafs are two entries.
- AHL-only users get a report and push when an AHL favorite played.
- NHL-only users' reports and pushes are unchanged (byte-identical headline
  and payload except the new `league: 'nhl'` fields).
- An NHL break week with AHL games still yields reports for users whose AHL
  favorites played; a week with no games in either league yields none.
- The headline team line marks AHL teams `(AHL)`.

**Verify:** builder tests with recorded HockeyTech fixtures (AHL skater,
goalie, team week with an OT and a shootout loss, mixed-league headline,
same tri-code in both leagues); dispatch tests for an NHL break week with AHL
games, an AHL feed failure, and a rerun sending once; README report fields
updated.

**Evidence:** none yet.

**Release follow-ups:** deploy and check the first Monday report with an AHL
favorite (Product Owner).
