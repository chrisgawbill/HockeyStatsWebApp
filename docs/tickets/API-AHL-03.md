# API-AHL-03 — Favorites cover both leagues under the shared limits (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested by the Product Owner 2026-10-29. HockeyStatsAPI.

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
