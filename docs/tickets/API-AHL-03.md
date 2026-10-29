# API-AHL-03 — Favorites cover both leagues under the shared limits (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** DONE — Closed by the Product Owner 2026-10-29. Implemented on
HockeyStatsAPI branch `ccr-373a3121-jzv70k` (`3f3566b`). Requested
2026-10-29. HockeyStatsAPI.

**Goal:** A user can favorite AHL teams and players in the same favorites
lists as NHL ones, under the same limits.

**Dependencies:** API-AHL-01 (to validate AHL teams and players). Blocks
AHL-02.

**Read:** migrations `003`, `005`, `006`, `010`;
`src/slices/afterActionReports/afterActionReportService.js`
(`MAX_FAVORITE_TEAMS`), `src/slices/weeklyPlayerReports/weeklyPlayerReportService.js`
(`MAX_FAVORITE_PLAYERS`), the favorites routes.

**Product Owner checkpoint:**

- **Reports and push for AHL favorites** (PM recommendation: not in this
  ticket). AHL favorites appear in the favorites lists but do not create After
  Action Reports, game pushes or Weekly Player Report entries until a follow-up
  ticket adds AHL game polling. Confirm, or ask for that follow-up now.

**Decisions:**

- 2026-10-29 (Product Owner): there is no separate AHL favorites list. AHL and
  NHL favorites share one list and one limit: at most 5 teams and 10 players in
  total across both leagues.
- 2026-10-29: Product Owner started the ticket. Built on the PM
  recommendation for the checkpoint (AHL favorites are listed but create no
  reports or pushes). Still needs explicit Product Owner confirmation.
- 2026-10-29 (implementation): AHL team codes are 2-4 letters (the feed has
  `CV` for Coachella Valley), so the tri-code check is `^[A-Z]{2,4}$`; NHL
  input is still exactly 3 letters. An AHL team must be in this season's AHL
  teams. An AHL player must appear in this season's AHL skater or goalie
  table (name, team and position come from there, no headshot), so a player
  with no game yet this season is a 404 until they play. Both favorites
  routers validate `league` on every route, so `league=<other>` is a 400 even
  on `GET`.
- 2026-10-29 (Product Owner): closed the ticket as done, confirming AHL
  favorites are listed but create no reports or pushes until a follow-up.

**Scope:**

- Migration 015: add `league text NOT NULL DEFAULT 'nhl'`
  (`CHECK (league IN ('nhl','ahl'))`) to `favorite_teams` and
  `favorite_players`. Primary keys become `(user_id, league, team_tri_code)`
  and `(user_id, league, player_id)`, because AHL tri-codes and player ids can
  match NHL ones. Existing rows become `nhl`. The tri-code check allows AHL
  codes (relax to the format the API-AHL-01 spike finds).
- Favorites routes take an optional `league` query parameter (`nhl` default)
  on `PUT`, `DELETE`, `PATCH` and `push-mute`, so today's web app keeps
  working unchanged. AHL teams and players are validated against the AHL data
  (404 when unknown).
- `GET /api/favorites` and `GET /api/favorite-players` return every favorite
  from both leagues, each with `league`.
- The 5-team and 10-player limits count both leagues together (409 past the
  limit). Accounts already over a limit keep their favorites, as today.
- After Action Reports, push dispatch, the Weekly Player Report and My Hockey
  data read only `league = 'nhl'` favorites, so an AHL `TOR` is never treated
  as the Maple Leafs.

**Exclusions:** AHL reports and push (see checkpoint).

**Acceptance:**

- A user with 3 NHL and 2 AHL favorite teams gets 409 on a sixth team from
  either league; the same for players at 10.
- The same tri-code or player id can be favorited once per league.
- Existing favorites, tiers, labels and push mutes are unchanged after the
  migration, and no report or push behaves differently for NHL-only users.

**Verify:** migration 015 on real Postgres with existing favorites; service
and route tests for the shared limit and per-league keys; tests that report
and push dispatch ignore AHL favorites; README favorites section updated.

**Evidence (2026-10-29, API branch `ccr-373a3121-jzv70k`):**

- PASS: `pnpm test`, 195/195, including 5 new tests: shared 5-team and
  10-player caps across leagues (409 for a sixth team or eleventh player from
  either league), the same tri-code and player id favorited once per league,
  unknown AHL team or player 404, After Action Reports and game push dispatch
  ignoring an AHL `TOR`, the Weekly Player Report and its push ignoring AHL
  favorites, and the AHL team and player lookups against recorded fixtures.
- PASS: migration 015 on local Postgres 16 after 001-014 with existing
  favorites: every team and player row (tiers, labels, push mutes, times)
  identical before and after, all `league = 'nhl'`, new keys
  `(user_id, league, …)`.
- PASS: the real repository SQL on that database: 2 NHL + 2 AHL + 1 NHL team
  then 409 for both leagues, AHL `TOR` mute and tier changes leave NHL `TOR`
  untouched, deleting AHL `TOR` keeps NHL `TOR`; the same player id in both
  leagues, the 10-player cap across leagues; the weekly dispatch reads only
  NHL rows.
- NOT RUN: live AHL lookups against the real feed; deploy to the dev server.

**Release follow-ups:** deploy to the dev server and live AHL favorite
lookups there (Product Owner). Not yet run.
