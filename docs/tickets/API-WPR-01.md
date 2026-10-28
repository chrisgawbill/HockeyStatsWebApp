# API-WPR-01 — Favorite players and the weekly player report (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-19: Monday 9:00 ET, zero-league-games break, proposed stat lines, 10-player cap, one on/off switch (see block); accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24; the first Monday run
(2026-10-26) produced a report the Product Owner checked against real NHL
data ("looked good") and the push reached their phone. HockeyStatsAPI `f243cce`.

**Approved decisions (Product Owner, 2026-10-19):**

- Report week is Monday 00:00 – Sunday 23:59 America/New_York; generated and
  pushed Monday about **9:00 ET** (cron 13:05 and 14:05 UTC; the script skips
  the run that lands before 9:00 ET and the ledger keeps it to one send).
- Break = **zero completed regular-season/playoff games league-wide** that
  week: no reports, no pushes. Users whose favorites' teams did not play are
  also skipped individually (design item 5).
- Stat lines as proposed in design item 6.
- **At most 10 favorite players** per user (409 on the 11th).
- **One on/off switch** (`users.weekly_report_push`, default on); no
  per-player mute. The report is still created for the inbox when it is off.
- Push wording: title `Weekly Player Report · Oct 13–19`; body is the best
  performer (skaters by points, else goalies by wins), e.g.
  `Connor McDavid: 2G 4A in 3 GP`, plus ` and N more` for the other players
  who played.

**Goal:** A signed-in user favorites players the same way they favorite teams.
Every Monday morning the API builds one Weekly Player Report per user covering
the previous Monday–Sunday and sends one push notification. If the league was
on a break that week, no report is created and nothing is sent.

**Requested by Product Owner (2026-10-19):** favorite a player like a team;
a weekly report arrives Monday morning with a notification; skip both when the
league is on a break.

**Read first:** this block and the WPR-01 block; AAR-01/AAR-02 blocks above;
HockeyStatsAPI `README.md` (favorites, After Action Reports, Web Push);
`src/slices/afterActionReports/*`, `src/slices/pushNotifications/*`,
`src/platform/migrations/003_*.sql` and `004_*.sql`,
`src/presentation/routes/{afterActionReports,push,player}.js`,
`bin/aar-push-cron.js`, `.github/workflows/after-action-push.yml`,
`src/platform/cacheManager.js` (`GetOrFetch`), `src/platform/nhlApiClient.js`.

**Facts from shared discovery (verify, don't re-derive):**

- Favorites today: `favorite_teams(user_id, team_tri_code, created_at,
  push_muted)`; routes `GET/PUT/DELETE /api/favorites/:triCode` and
  `PUT /api/favorites/:triCode/push-mute`, all behind the session token.
- Push: `push_subscriptions` + VAPID env; `POST /api/push/dispatch` is
  secured by `Bearer CRON_SECRET`; a per-item sent ledger
  (`after_action_report_pushes`) guarantees once-only sends; read tokens are
  30-day JWTs (`purpose: "aar-read"`).
- The hosted API sleeps; nothing may run on an in-process timer. The existing
  GitHub Actions cron (`after-action-push.yml`, UTC only) wakes it.
- The NHL hosts are unreachable from the cloud dev container. Every NHL
  payload shape below is an assumption the worker must code defensively
  against and the Product Owner should spot-check after deploy.

**Proposed design (PM recommendation; confirm at the checkpoint):**

1. **Data model** (migration `005_*`): `favorite_players(user_id, player_id,
   created_at)` (PK user+player, max 25 per user);
   `weekly_player_reports(user_id, week_start date, created_at, read_at,
   payload jsonb)` (PK user+week) holding the frozen report so reopening it
   never re-fetches; `weekly_player_report_pushes(user_id, week_start)` sent
   ledger; `users.weekly_report_push` boolean (default true) as the one
   on/off switch.
2. **Routes:** `GET /api/favorite-players`, `PUT/DELETE
   /api/favorite-players/:playerId` (validate the id against the NHL player
   landing, cached 24h, and store name/team/position for display);
   `GET /api/weekly-player-reports` (newest first, at most 12) and
   `POST /api/weekly-player-reports/:weekStart/read`; extend
   `GET /api/push/config` or add `PUT /api/push/weekly-report` for the
   toggle; `POST /api/push/weekly-dispatch` secured like `/dispatch`.
3. **Report week:** Monday 00:00 to Sunday 23:59 **America/New_York**; the
   report is generated Monday at about 8:00 ET. GitHub cron is UTC, so
   schedule both `12:05` and `13:05` UTC on Mondays; the script computes the
   ET hour and the ledger keeps it idempotent across DST.
4. **Break detection (league-wide, one call):** fetch the NHL league schedule
   for the report week (`/schedule/{monday}` returns a 7-day `gameWeek`;
   assumed shape). Count completed games with gameType 2 (regular season) or
   3 (playoffs). **Zero games means a break:** no report rows, no pushes,
   return `{ skipped: "league-break" }`. This covers the offseason, the
   All-Star/holiday breaks, and any Olympic-style pause; preseason games
   (gameType 1) do not count. A week with at least one game is not a break.
5. **Per-user skip:** a user with no favorited players, or whose favorites'
   teams played zero games that week, gets no report and no push.
6. **Report content, per player:** GP that week, then skaters G, A, PTS,
   +/-, SOG, TOI/GP, and the week's best game ("2G 1A vs BOS, Oct 18");
   goalies GP, W-L-OTL, SV%, GAA, SO. A player who did not play shows "Did
   not play (team played N games)". The push says "Your weekly player
   report: <best performer line>" and opens the report.
7. **NHL call batching:** one league schedule call for the break check, then
   stats for **all distinct favorited players across all users at once**,
   not per user. Preferred: the stats REST summary endpoints filtered by
   date range and game type with per-game rows
   (`/stats/rest/en/skater/summary` and `/goalie/summary` with a
   `cayenneExp` on `gameDate` and `gameTypeId`, `isGame=true` to get game
   rows; assumed). Fallback: per-player `/player/{id}/game-log/now`, one call
   per distinct player, cached for the week. Raw payloads go through
   `GetOrFetch` with keys that include the week, so a retried dispatch
   reuses them; computed reports are persisted in `weekly_player_reports`,
   never in the cache.
8. **Sending:** reuse the AAR-02 push sender, VAPID config, 404/410
   subscription cleanup, and the claim-before-send ledger. One push per
   user per week, to all of that user's devices; never to users with the
   toggle off.

**Edge cases to test:** DST weeks (both cron runs, exactly one send); a
traded player (report under the team(s) he played for that week); a player
with zero games; goalie and skater on one report; dispatch run twice; NHL
stats call failing (no reports created, non-2xx so the workflow shows red;
nothing half-sent); a break week (nothing created or sent); a user who
favorited a player mid-week (include the whole week).

**Product Owner decisions needed before implementation:** the send time and
timezone (recommended Monday 8:00 ET); whether break means zero league games
(recommended) or "no games for my favorites" only; the stat lines above;
the 25-favorite cap; the single on/off toggle versus per-player mute.

**Implemented (`f243cce`):** migration `005_create_favorite_players_and_weekly_reports.sql`;
`slices/weeklyPlayerReports` (pure `weeklyReportBuilder`, repository, service);
push slice gains the weekly ledger, switch, `weeklyDispatch`, and `wpr-read`
read tokens accepted by `POST /api/push/read`; routes `/api/favorite-players`,
`/api/weekly-player-reports`, `GET/PUT /api/push/weekly-report`,
`POST /api/push/weekly-dispatch` (optional `{ weekStart }` for manual reruns);
`bin/weekly-report-cron.js` + `.github/workflows/weekly-player-report.yml`.
Contract details are in the API README. Push payload: `{ kind: "weekly-report",
title, body, weekStart, tag: "wpr-<weekStart>", readToken }`.

**Verification so far:** 161 API unit/route tests; a real Postgres 16 run of
the new SQL (cap under 12 concurrent adds, break week, concurrent double
dispatch sends once, read token, cascade). Independent QA ran the real app on
real Postgres with stubbed NHL and a local HTTPS fake push service (payloads
decrypted): favorites, cap, normal/break/DST weeks, cron script end to end,
sequential and concurrent double runs, switch, read tokens both directions,
NHL failure (502, nothing written, recovers), 410 cleanup, week validation,
and an AAR dispatch smoke — all PASS. Not verifiable here: real NHL payload
shapes, the real cache/rate limiter, and the GitHub workflow.

**Deploy:** run migration 005; add the Monday schedule to the workflow (or a
new `weekly-player-report.yml`) using the existing `CRON_SECRET` and
`AAR_PUSH_API_URL` secrets; scheduled workflows run only from `main`.

**Verification:** API unit and route tests with stubbed NHL payloads; a
real-Postgres run of the new SQL; QA drives `/api/push/weekly-dispatch`
against a fake push service for a normal week, a break week, a DST week and
a double run.

**Deploy check (2026-10-25, dev server, read-only):** HockeyStatsAPI `main`
(`81da435`) runs on Node 24.22.1 on port 9000; `schema_migrations` lists 001–009.
`GET /api/favorite-players`, `/api/weekly-player-reports`,
`/api/weekly-player-reports/:weekStart` and `/api/push/weekly-report` answer 401
without a session (an unknown route is 404), and the journal shows signed-in
304 (not modified) responses to them since 23:00 UTC 2026-10-24. The workflow schedule is
replaced by the notifier's `weekly-player-report` schedule (Mondays 9:00 and
12:00 America/New_York, bearer matches `CRON_SECRET`); `/health` shows its next
run at 2026-10-26 13:00 UTC and no run yet. No weekly reports exist yet.
Pending: the first Monday run, a spot-check of the first real report's NHL
payload shapes, and an authenticated response-body check.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-24; first Monday run 2026-10-26 checked by the Product Owner (report and phone push); HockeyStatsAPI `f243cce`.
