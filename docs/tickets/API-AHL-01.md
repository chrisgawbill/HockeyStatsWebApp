# API-AHL-01 — AHL data client and stored AHL tables (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE — Started by the Product Owner 2026-10-29. Implemented on
HockeyStatsAPI branch `ccr-373a3121-jzv70k` (`9a9f57d`); pending Product Owner
confirmation of the two checkpoint choices below, then review and merge.
Requested 2026-10-29 ("bring in AHL data the same way we bring in NHL data …
add tables to db"). HockeyStatsAPI.

**Goal:** The API can fetch, cache and store AHL teams, rosters, schedules,
standings and player stats, so later tickets can serve them in the same shapes
as the NHL routes.

**Dependencies:** none. Blocks API-AHL-02 and API-AHL-03.

**Read:** `src/platform/nhlApiClient.js`, `src/platform/cacheManager.js`,
`src/platform/refreshScheduler.js`, migrations `001` and `013`, the API README
"Stored stats" and "Caching" sections.

**Product Owner checkpoint:**

- **Data source.** The NHL API does not serve the AHL. The AHL's stats come
  from HockeyTech (`lscluster.hockeytech.com/feed/`, client code `ahl`), which
  has no public documentation; the key is the one the AHL website uses. It can
  change or be blocked without notice. Confirm we accept that risk before work
  starts. The PM has not yet called the feed (blocked in the planning session),
  so the first step is a spike that records real payloads as test fixtures.
- **Separate tables vs. a league column** (PM recommendation: separate
  `ahl_*` tables, as requested). AHL team and player ids are a different
  numbering system and can collide with NHL ids, so they must never share a key
  with NHL rows.

**Decisions:**

- 2026-10-29: Product Owner started the ticket and allowed
  `lscluster.hockeytech.com` in the environment's network settings. Built on
  the PM recommendation (accept the feed risk; separate `ahl_*` tables). Still
  needs explicit Product Owner confirmation of both.
- 2026-10-29 (spike): the feed answered with the AHL website key. HockeyTech
  has no preseason; its "Exhibition" seasons map to game type 1, Calder Cup
  and division playoffs to 3, regular seasons to 2. All-star events are left
  out. The season id follows from the start date with the NHL September 1
  rollover. Standings use the modulekit `statviewtype` conference view, and
  player stats use `statviewfeed` with every player on one page (1,234 skaters
  in 2025-26). Rosters are stored when they are first read, not by the
  scheduled refresh.

**Scope:**

- `src/platform/ahlApiClient.js`: an axios client for the HockeyTech feed,
  with the key and client code in `.env` (`AHL_FEED_KEY`,
  `AHL_CLIENT_CODE=ahl`) and documented in `.env.example`.
- Season mapping: HockeyTech numbers each season (and its regular season,
  playoffs and preseason) with its own integer id. Map these to our 8-digit
  season id (`20252026`) plus a game type, so `?season=` works the same for
  both leagues.
- Migration 014 (proposed, final columns follow the spike): `ahl_seasons`
  (HockeyTech id → `season_id`, `game_type`), `ahl_teams`, `ahl_players`,
  `ahl_schedule_games`, `ahl_roster_entries`, and `ahl_team_stat_reports`
  (raw payload per season, team and report, like `team_stat_reports`). Every
  table keeps the raw `source_payload`.
- Cache keys are prefixed `ahl:` so they never collide with NHL entries; use
  the existing lifetimes and stale-while-refresh behavior.
- The scheduled schedule refresh also refreshes the current AHL season
  schedule and standings. No live AHL game poll in this ticket.

**Exclusions:** routes (API-AHL-02), favorites (API-AHL-03), shift charts and
line combinations, shot coordinates, push and reports.

**Acceptance:**

- With the feed reachable, a refresh stores the current AHL season's teams,
  schedule, standings and league-wide skater and goalie stats.
- With the feed down, cached and stored AHL data is still read, and nothing
  NHL-side changes or fails.
- No existing NHL table, cache key or route changes.

**Verify:** migration 014 on real Postgres; client and mapper unit tests
against recorded HockeyTech fixtures; README documents the data source, its
risk and the new tables.

**Evidence (2026-10-29, API `9a9f57d`):**

- PASS: `pnpm test`, 180/180, including 7 new AHL tests against fixtures
  recorded from the live feed (`src/test/fixtures/ahl/`, key removed).
- PASS: migrations 001–014 applied on local Postgres 16.
- PASS: a live refresh against the real feed stored 46 seasons, 32 teams,
  1,152 games for 2026-27, standings, 837 skaters and 76 goalies. A roster
  read stored 27 players. Every cache key starts with `ahl:`.
- PASS: with the feed failing, the refresh logged and returned. The cached
  schedule and the stored skater report were still served.
- PASS: no NHL table, cache key or route changed. The NHL refresh runs first
  and catches its own errors.
- NOT RUN: deploy to the dev server, and a scheduled refresh there.
