# API-AHL-02 — AHL read routes behind a league switch (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested by the Product Owner 2026-10-29. HockeyStatsAPI.

**Goal:** The web app can ask any supported read route for AHL data with
`league=ahl` and get the same response shape it already reads for the NHL, so
the page only needs a league toggle.

**Dependencies:** API-AHL-01. Blocks AHL-01.

**Read:** `src/presentation/routes/{standings,schedule,team,player}.js`, the
mappers under `src/slices/*/mappers`, `src/presentation/middleware/validateSeason.js`.

**Product Owner checkpoint:** confirm the route list below and that
unsupported routes answer 404 for `league=ahl` (PM recommendation) rather than
falling back to NHL data.

**Decisions:** none yet.

**Scope:**

- A `league` query parameter (`nhl` default, `ahl`), validated by middleware
  (400 for anything else). Omitting it keeps today's behavior exactly.
- `league=ahl` supported on: `GET /standings`, `GET /schedule`,
  `GET /schedule/:gameId` (boxscore), `GET /team/:teamId?`,
  `GET /team/roster/:triCode`, `GET /team/schedule/:triCode`,
  `GET /player/skater/summary`, `GET /player/goalie/summary`, and the skater
  and goalie stat leaders.
- AHL mappers produce the NHL response shapes field for field. A field the AHL
  feed does not have is `null`, never invented; the README lists those fields.
- Each AHL response includes `league: "ahl"` so the web app can tell them
  apart.
- `GET /player/stats/version` takes `league` too.

**Exclusions:** `/team/lines`, `/schedule/playbyplay`, `/schedule/landing`,
`/player/skater/corsi`, `/player/skater/faceoffs`, rivalries, Rink Quest and
the AI endpoint stay NHL-only and answer 404 for `league=ahl`.

**Acceptance:**

- Each supported route returns AHL data for `league=ahl` in the NHL shape,
  with `?season=` working for current and past AHL seasons.
- Every route answers exactly as before without `league` or with `league=nhl`.
- An AHL tri-code that matches an NHL one (for example the Toronto Marlies and
  Maple Leafs, if both use `TOR`) resolves to the right team for each league.

**Verify:** route and mapper tests for each supported route with AHL fixtures,
plus a test that NHL responses are unchanged; README route tables updated.
