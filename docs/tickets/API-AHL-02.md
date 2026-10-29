# API-AHL-02 — AHL read routes behind a league switch (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** DONE — Closed by the Product Owner 2026-10-29. Implemented on
HockeyStatsAPI branch `ccr-373a3121-jzv70k` (`7a4a5c1`). Requested
2026-10-29. HockeyStatsAPI.

**Goal:** The web app can ask any supported read route for AHL data with
`league=ahl` and get the same response shape it already reads for the NHL, so
the page only needs a league toggle.

**Dependencies:** API-AHL-01. Blocks AHL-01.

**Read:** `src/presentation/routes/{standings,schedule,team,player}.js`, the
mappers under `src/slices/*/mappers`, `src/presentation/middleware/validateSeason.js`.

**Product Owner checkpoint:** confirm the route list below and that
unsupported routes answer 404 for `league=ahl` (PM recommendation) rather than
falling back to NHL data.

**Decisions:**

- 2026-10-29: Product Owner started the ticket. Built on the PM
  recommendation (the route list below; unsupported routes answer 404 for
  `league=ahl`). Still needs explicit Product Owner confirmation.
- 2026-10-29 (implementation): list responses (player summaries, stat
  leaders) carry `league: "ahl"` on every row, since a top-level field would
  change their array shape. AHL `teamId`s are HockeyTech team ids, AHL game
  ids are HockeyTech game ids. The boxscore maps HockeyTech's `gameSummary`
  to the boxscore fields the web app reads (`GameDetailBoxscore`), not the
  whole NHL gamecenter payload. Schedule `broadcasts` stays `[]` rather than
  `null` so list readers keep working. Leader categories the feed cannot
  answer (`faceoffLeaders`) return `[]`. Goalie rate leaders (save % and GAA)
  need a third of the most games any goalie has played, a stand-in for the
  AHL's qualifying rule. `league` is validated on the league-capable routers,
  so `league=<other>` is now a 400 there.
- 2026-10-29 (Product Owner): closed the ticket as done, confirming the
  route list and 404 for unsupported routes with `league=ahl`.

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

**Evidence (2026-10-29, API branch `ccr-373a3121-jzv70k`):**

- PASS: `pnpm test`, 190/190, including 10 new route and mapper tests
  (`src/test/ahlRoutes.test.js`) against recorded HockeyTech fixtures, a new
  trimmed `gameSummary` fixture among them.
- PASS: NHL responses unchanged: route tests for no `league` and
  `league=nhl` on every league-capable route, and a live check that
  `/standings` and `/schedule/2025020001` answer byte-identically with and
  without `league=nhl`.
- PASS: live smoke test against the real feed: every supported route
  answered 200 for `league=ahl` in the NHL shape, including
  `?season=20242025`; `TOR` resolved to the Marlies; excluded routes 404,
  `league=xhl` 400, unknown game 404.
- PASS: on local Postgres 16 with migrations 001–014,
  `GET /player/stats/version?league=ahl` answered `version: null` before an
  AHL refresh and the refresh time after it; stat leaders then read the
  stored report.
- NOT RUN: deploy to the dev server.

**Release follow-ups:** deploy to the dev server (Product Owner); AHL-01
depends on it. Not yet run.
