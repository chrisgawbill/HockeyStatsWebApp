# API-CACHE-01 — Cache resilience (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-25: stale-while-revalidate for entries on their default TTL, serve-stale on error for caller-set (live) TTLs; completed seasons permanent once cached after they ended; no in-memory layer; production confirmed on Postgres (see block); accepted by the Product Owner 2026-10-25

**Status:** DONE — merged to HockeyStatsAPI `main` (`1e11b15`, 2026-10-25);
accepted by the Product Owner 2026-10-25. Deploy not independently verified.

**Context:** With `CACHE_DATABASE_URL` set the cache already lives in Postgres
(`app_cache`); the Product Owner confirmed 2026-10-25 that production uses it.

**Decided 2026-10-25 (Product Owner):**

- Entries on their type's default TTL (12h/24h: summaries, standings,
  leaders, rosters, schedules, team stats) are served expired at once while
  one background refresh runs; a failed refresh keeps the expired copy.
- Entries on a caller-set TTL (5-minute gamecenter and preliminary shift
  charts, 10-minute current week, push dispatch's forced refresh) wait for
  the refetch and fall back to the expired copy when the NHL call fails.
  A cache miss still fails when the NHL call fails.
- Standings, stat leaders, team summaries and player summaries/Corsi/faceoffs
  of a completed season never expire once cached after that season ended
  (September 1 of its end year); a mid-season copy refreshes once, then stays.
- No in-memory layer for now; revisit only with timings.

**Implementation:** `getOrFetchCached` in `src/platform/cacheManager.js`
(callers pass `{ seasonId }` for the permanent-season rule;
`getSeasonEndMs` in `seasonHelper.js`). Tests in `src/test/cacheManager.test.js`;
README "Caching" section. No browser checks (backend only).

**Original proposal:**

- Serve-stale on error: when an entry has expired and the NHL fetch fails,
  return the expired entry instead of failing.
- Stale-while-revalidate (or a daily warm-up cron) for large entries such as
  the league-wide summaries, so the first visitor after expiry does not wait
  on a multi-page NHL fetch.
- Never expire completed seasons' summaries, standings and leaders (like
  official shift charts).
- Optional, only if timings show it: a short in-memory layer in front of
  Postgres for large entries.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-25. Merged to HockeyStatsAPI `main` (`1e11b15`); tests pass; deploy not independently verified.
