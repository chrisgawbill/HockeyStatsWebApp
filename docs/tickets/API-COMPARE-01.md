# API-COMPARE-01 — Every player in the season summaries (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22 (option A): league-wide summaries return every player; contract adds team, shots, S%, PP goals.

**Status:** DONE — Product Owner accepted 2026-10-25 by explicitly closing tickets awaiting acceptance. Previously recorded: merged to HockeyStatsAPI `main` (`0d39d93`, 2026-10-22) and live on the dev server (league-wide summaries return every player; checked 2026-10-25).

**Approved 2026-10-22 (option A):** no new endpoint.

- `GET /player/skater/summary` and `/player/goalie/summary` page through the
  NHL stats API (`platform/nhlStatsPages.js`, shared with the weekly report),
  sorted by points/wins then player id. Without `teamId` they return every
  player; league-wide entries use a new cache key (`*_summary_league_<season>`)
  so the old 100-row entries are never served. Team keys are unchanged.
- Skater contract adds `teamTriCodes` (string[]), `shots`, `shootingPct`
  (fraction, null with no shots) and `powerPlayGoals`; goalie contract adds
  `teamTriCodes`. Additive only; mapping still runs after the cache read.
- Rows are persisted when fetched from the NHL, not again on each cache hit.

**Verify:** `pnpm test` (mapper fields, pager, league paging/cache key,
persist-on-fetch). NHL field names were not checked live (the dev
environment blocks api.nhle.com); confirm on the first deploy.

**Deploy check (2026-10-25):** branch `ccr-ed30da63-xt8i5s` no longer exists on
`origin`; its change is on `main` as `0d39d93` and is live. On the dev server,
`GET /player/skater/summary?season=20262027` returned 717 skaters (sorted by
points) and `/player/goalie/summary` 68 goalies, with `teamTriCodes`, `shots`,
`shootingPct` (null only with zero shots) and `powerPlayGoals` populated from
the real NHL API, so the NHL field names are confirmed. `pnpm test` mapper and
summary tests pass (10/10).
