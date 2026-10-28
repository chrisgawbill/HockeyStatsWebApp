# SCHED-STATUS-01 — Live and final states on the schedule from cached game data

Delivery rules: [development workflow](../agent-development.md).

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket; Spotter, the dev-server deploy check and a game-night check were not run. Requested by the Product Owner 2026-10-27 ("more reliably
mark a game done in schedule view when we know the game is done via our DB …
mark a game as live when we have in-game results"). HockeyStatsAPI + frontend.

**Problem:** `GET /schedule/` serves the season schedule from a 12-hour cache
(refreshed 8:00, 19:00 and 23:00 UTC), so games read FUT or LIVE for hours
after the game page, My Hockey or push dispatch already cached them live or
final. The frontend backfill only filled scores and kept the stale state.

**Decisions (PM, within the request):** no contract change. For each game in
the season response that has started (`gameTime` passed) and is not `OFF`,
the API reads, from the cache only (any age, never an NHL call), the game's
`boxscore_<id>` and `landing_<id>` payloads and its teams' `team_<tri>_week_now`
club weeks (kept fresh by After Action Report dispatch). The furthest-along
state wins (FUT < PRE < LIVE/CRIT < FINAL < OFF, more goals on a tie); the game
never moves backwards. Its scores and period type come with it, and the ticket
link is dropped once it leaves FUT. Play-by-play payloads are skipped (large,
and the game page caches the boxscore alongside them). The frontend backfill
now also covers past games not yet final and takes `gameState` and period type
from the boxscore it fetches. Today's games are not polled by the schedule.

**Verify:** API `pnpm test` (overlay tests in `scheduleService.test.js`); web
tsc, `pnpm test`, build, format. Spotter: a game cached final or live shows
FINAL (F/OT, F/SO) or LIVE with its score on the day card and calendar chip
before the next schedule refresh. Product Owner: check a real game night.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. API and web checks pass; merged to `main` 2026-10-27 (HockeyStatsAPI `0a3e9dc`, web app `71f6a65d`). Not run: Spotter, the dev-server deploy check and a game-night check.
