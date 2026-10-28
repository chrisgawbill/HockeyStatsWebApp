# API-LINES-01 — Real line combinations from shift charts

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved: real lines from NHL shift charts, NHL calls batched/cached (see block).

**Status:** DONE (Product Owner approved 2026-10-19) (HockeyStatsAPI)

**Approved decisions (Product Owner):** Lines come from the team's most recent
completed game's NHL shift chart (`api.nhle.com/stats/rest/en/shiftcharts`).
Batch NHL calls: as fresh as possible, but never re-fetch immutable data, and
every response is pinned to one game so it is internally consistent.

**Contract:** `GET /team/lines/:triCode?season=` → `{ source: 'shifts'|'none',
game: { gameId, gameDate, opponent, homeAway } | null, forwardLines: [{ players:
[{ id, slot: 'LW'|'C'|'RW' }], togetherSeconds }] (≤4), defensePairs: [{
players: [{ id, slot: 'LD'|'RD' }], togetherSeconds }] (≤3), goalies: {
starterId: number|null } }`.

**NHL call budget:** latest completed game from the 10-minute `week/now` club
schedule (shared with After Action Reports), else the 12-hour season schedule;
positions from the 24-hour roster cache; shift chart cached forever once the
game is `OFF` (shared by both teams, single-flight via `GetOrFetch`), 5 minutes
while `FINAL` or empty. Lines are computed on read, never cached.
