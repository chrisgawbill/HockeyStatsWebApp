# API-PBP-01 — Play-by-play events for shot maps and game flow (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-26: PM recommendations — ticket contract plus `shooterName` and `periodType`, shootouts left out; home always shoots toward +x (flipped periods turned 180°), missing or unknown coordinates kept as `null`; raw payload cached forever once `OFF`, 1 minute live, 5 minutes otherwise (see block).

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Not run: the check against a recorded NHL payload and the dev-server deploy check. Previously recorded: ACTIVE — merged to HockeyStatsAPI `main` (`f769f5c`,
2026-10-26; change `ef41cce`). 138 tests pass. Deploy not independently
verified.

**Goal:** Expose a normalized, cached list of a game's shot and goal events so
the frontend can draw a shot map and game flow chart.

**Decided 2026-10-26 (Product Owner, PM recommendations):**

- `GET /schedule/playbyplay/:gameID` → `{ gameId, gameState, homeTeam:
  { id, triCode }, awayTeam, events: [{ eventId, period, periodType
  ('REG'|'OT'), timeInPeriod, elapsedSeconds, type:
  'goal'|'shot'|'miss'|'block', teamTriCode, shooterId, shooterName,
  goalieId|null, x, y, shotType|null, strength: 'ev'|'pp'|'sh'|null }] }`.
  Shootout attempts and every other play type are dropped. A game that has
  not started has no events; a malformed or unknown id is a 404.
- `teamTriCode` is the shooting team, also on blocked shots (the NHL credits
  those to the blocker). Strength is from the shooter's side; a pulled goalie
  counts one skater fewer, so an extra attacker alone is `ev`.
- Coordinates: home always shoots toward +x, away toward -x; a flipped period
  negates x and y. Ends come from `homeTeamDefendingSide`, else from the
  period's offensive-zone events; events without coordinates or with unknown
  ends keep `x`/`y` null. Documented in the API README and mapper.
- Cache: raw payload under `schedule:playbyplay_<id>`; permanent once `OFF`,
  60 seconds while `LIVE`/`CRIT`, 5 minutes otherwise (all caller-set TTLs,
  so per API-CACHE-01 they wait for the refetch and serve the expired copy on
  an NHL failure). Mapping runs after the cache read.

**Verify:** mapper unit tests (period side flip, inferred ends, overtime,
missing coordinates, blocked shots, strength, shootout and unknown types
dropped), service TTL test, route test, README route table. Done in
`ef41cce` against a hand-built payload in the NHL shape.

**Pending:** `api-web.nhle.com` was unreachable from the build environment,
so the fixture is not yet a recorded payload: confirm field names (notably
blocked-shot ownership and `homeTeamDefendingSide`) against a real OT game
and swap in the excerpt; Product Owner checks the route on the dev server.
A fresh cloud session on 2026-10-26 (03:04 UTC) was also refused
`api-web.nhle.com`, so the environment's allow-list change has not taken effect.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Previously recorded: ACTIVE — merged to HockeyStatsAPI `main` (`f769f5c`, 2026-10-26); tests pass. Pending: check against a recorded NHL payload (host unreachable from the build environment) and the dev-server check. Not run: the check against a recorded NHL payload and the dev-server deploy check.
