# HockeyStatsWebApp Architecture

This project is a hockey statistics web app with a React frontend and an Express backend. The frontend renders NHL schedules, standings, team pages, player leaders, and game details. The backend acts mostly as a proxy and cache layer over public NHL API endpoints, plus one AI-backed endpoint for team history data.

The most important mental model is:

```text
React pages/components
  -> React contexts and service functions
  -> Express API routes
  -> NHL public APIs, Postgres/filesystem cache, or Python AI subprocess
```

## Repository Layout

```text
.
├── api/                    Express backend
│   ├── app.js              Express app setup, middleware, routes, errors
│   ├── bin/www             HTTP server bootstrap, listens on PORT or 9000, starts the refresh scheduler
│   ├── routes/             Backend route modules grouped by feature
│   ├── services/           NHL API clients, response mappers, domain services, refresh scheduler
│   ├── db/                 Postgres pool + shared connection config, migrations, repositories
│   ├── test/               Backend tests (node --test)
│   └── utils/              Cache manager, season helpers, diagnostics auth, field coercion
├── react/                  Vite + React frontend
│   ├── src/App.tsx         Frontend route table
│   ├── src/index.tsx       React root and global context providers
│   ├── src/Pages/          Route-level page components
│   ├── src/Components/     Reusable UI sections and widgets
│   ├── src/Data/           Models, contexts, hooks, helpers, constants, and local data
│   ├── src/Services/       Frontend API clients and service functions
│   └── src/Style/          CSS modules and shared CSS
└── docs/                   architecture.md (this file), phase-2-backlog.md + phase-2-progress.md (feature roadmap/journal), cleanup-backlog.md (refactor/hardening tickets), frontend-backlog.md (MD3 design tickets), exciting-features-backlog.md (feature ideas)
```

There are separate `package.json` files for the frontend and backend. The root `package.json` is not the main app entry point.

## Frontend Architecture

The frontend is a Vite React app using TypeScript, React Router, React Bootstrap, CSS modules, and a few table/scrolling libraries.

### Routing

`react/src/App.tsx` defines the app routes with `HashRouter`:

- `/` renders `LandingPage`
- `/standings` renders `StandingsPage`
- `/schedule` renders `SchedulePage`
- `/teamList` renders `TeamList`
- `/team/:teamId` renders `TeamPage`
- `/game/:gameId` renders `GameDetailPage`
- `/diagnostics` renders `DiagnosticsPage` (intentionally unlinked; see [Diagnostics Layer](#diagnostics-layer))

Because this uses `HashRouter`, URLs are intended to work in static hosting environments such as GitHub Pages.

All page components are lazy-loaded (`React.lazy` + `Suspense`), so a route's code is only downloaded when it is first visited. An `ErrorBoundary` (from the `react-error-boundary` package) wraps `<Routes>` so a render-time exception in one page degrades to an error card with a retry button instead of blanking the whole SPA.

### Global Providers

The providers are split across two files by whether they depend on routing or the selected season:

- `react/src/index.tsx` wraps the app in the providers that need neither — `ThemeProvider` and `ListOfTeamsDataProvider` — then renders `<App />`.
- `react/src/App.tsx` nests the rest _inside_ `HashRouter`, in this order: `SeasonProvider` → `StandingsDataProvider` → `ListOfGamesProvider` → `StatLeadersProvider` → `Routes`. `StatLeadersProvider` (`StatLeadersContext.tsx`) is one provider that loads both skater and goalie leader maps (calling `useStatLeaders` twice) and exposes them through the `useSkaterLeaderData`/`useGoalieLeaderData` hooks.

This ordering is deliberate. `SeasonProvider` (`react/src/Data/Context/SeasonContext.tsx`) reads the `?season=` URL param via `useSearchParams`, so it must sit inside `HashRouter`. The season-dependent data providers re-fetch when the selection changes, so they must sit inside `SeasonProvider`. `ThemeProvider`/`ListOfTeamsDataProvider` depend on neither, so they stay at the `index.tsx` root. See [Season Selection](#season-selection).

These providers fetch shared data once and make it available to pages through custom hooks. This keeps page components from repeatedly fetching the same high-level data.

### API Access

Frontend HTTP calls are centralized in:

- `react/src/Services/axiosInstance.ts`
- `react/src/Services/apiHandler.ts`
- `react/src/Services/genAIHandler.ts`

`axiosInstance.ts` creates `axiosExpressHandler`, which points to `import.meta.env.VITE_API_URL`. In development builds it falls back to `http://localhost:9000`; in production builds a missing `VITE_API_URL` logs an error and requests fall back to relative URLs. Requests time out after 15 seconds so a hung backend resolves to each caller's existing error path instead of spinning forever.

`apiHandler.ts` maps frontend operations to Express routes. For example:

- `GetCurrentStandings()` calls `/standings`
- `GetScheduledGames()` calls `/schedule/`
- `GetGameDetails(gameID)` calls `/schedule/:gameID`
- `GetTeamRoster(triCode)` calls `/team/roster/:triCode`
- `GetSkaterSummary(teamId)` calls `/player/skater/summary`
- `GetHealth(passphrase)` calls `/health` and `GetCacheReport(passphrase)` calls `/health/cache-usage`; both attach the passphrase as the `x-diagnostics-key` header (never a query string), since the backend reads it from that header (see [Diagnostics Layer](#diagnostics-layer))

Note: draft lottery odds are not fetched from an API; they are computed locally (see [Important Hockey And NHL API Background](#important-hockey-and-nhl-api-background)).

`genAIHandler.ts` calls `/python-service` and normalizes the AI response into JSON when possible.

### Data Layer

The frontend data layer lives under `react/src/Data/`.

Use this structure when deciding where code belongs:

- `Models/`: class-like data shapes used by the UI, such as `ScheduledGame`, `Team`, `StandingsTeam`, and `PlayerStatLeader`.
- `Helpers/`: conversion logic that wraps normalized backend contracts into app model classes (and layers on app-only logic such as draft-lottery odds). For the most-used NHL data, raw-field extraction now happens in the backend mappers (see [Backend Response Contracts](#backend-response-contracts)), so these helpers no longer parse raw NHL shapes. Also home to presentation-only helpers (`gameStatusHelper.ts` for schedule time/status formatting, `scheduleHelper.ts` date grouping) and frontend season utilities (`seasonHelper.ts`, see [Season Selection](#season-selection)).
- `Context/`: React providers and hooks for shared state.
- `Hooks/`: reusable custom hooks that compose services, helpers, and constants. For example, `useStatLeaders.ts` loads and tracks stat leader data using `STAT_CONFIG` and `PlayerStatLeaderConverter`.
- `Constants/`: static configuration such as stat leader category mappings.
- `LocalData/`: local static NHL team metadata (`teamListData.ts`). The old mock page data is gone; the real team-page types now live in `Models/teamPageTypes.ts`.

The app often receives large, inconsistent NHL API objects. For the most-used NHL data (schedule games, standings teams, roster players, skater/goalie summaries, stat leaders) the backend now normalizes these into stable contracts before they reach the frontend; helper files wrap those contracts into model classes. When adding new NHL data, prefer normalizing at the backend boundary (a mapper) over re-parsing raw shapes in the browser.

### Page Responsibilities

Pages are route-level containers. They usually fetch or assemble data, then pass display-ready props to smaller components.

- `LandingPage` shows stat leaders, standings, and draft lottery odds from global contexts.
- `StandingsPage` switches between conference and division standings using data from `StandingsContext`.
- `SchedulePage` reads all scheduled games from `ScheduleContext` and renders one of three views chosen by a `?view=day|week|month` URL param (toggled with the shared `SlidingToggle`). Day view uses the tall `ScheduleCard`; week/month views render the shared `ScheduleCalendar` 7-column grid of compact `GameChip`s. All three are client-side projections of the same already-loaded season array — only `?season=` triggers a re-fetch (see [Season Selection](#season-selection)). Completed games link to detail pages.
- `GameDetailPage` fetches boxscore and landing data for one game, computes period scores and team totals, then renders game-detail sections.
- `TeamPage` fetches team stats, roster, schedule, skater stats, goalie stats, and AI-generated static history info for one team.

## Backend Architecture

The backend is an Express app in `api/`. It listens on port `9000` by default.

`api/app.js` is the central setup file. It configures:

- environment variables with `dotenv`
- response compression and `helmet()` security headers
- CORS for local frontend ports and GitHub Pages
- JSON/body parsing
- static files
- route modules
- a `/python-service` endpoint, behind a rate limiter (10 requests per 15 minutes per IP, returning a JSON 429); `trust proxy` is set so the limiter keys on the real client IP behind Render-style proxies
- a JSON error handler

The scheduled schedule-cache refresh timer lives in `api/services/refreshScheduler.js` and is started by `bin/www` after the server begins listening — importing `app.js` (as the tests do) starts no timers.

`bin/www` also owns process-level resilience: an `uncaughtException` logs and exits with code 1 (the process is in an undefined state, so the host restarts it rather than limping on), and `SIGTERM`/`SIGINT` trigger graceful shutdown — close the HTTP server, then both Postgres pools, with a 10-second force-exit fallback.

### Backend Route Modules

Routes are grouped by NHL domain. Most data routes accept an optional `?season=` query param; see [Season Selection](#season-selection) for the shared validation and defaulting behavior.

- `api/routes/standings.js`
  - `GET /standings` — optional `?season=`
  - Current season uses the live `https://api-web.nhle.com/v1/standings/now`; a past season is translated to its settled end date via the `/standings-season` index, since the NHL standings endpoint is date-based, not season-based
  - Normalizes each team into a `StandingsTeamContract` via `standingsMapper` (see [Backend Response Contracts](#backend-response-contracts))

- `api/routes/schedule.js`
  - `GET /schedule/` — optional `?season=`
  - Fetches a season schedule by calling weekly NHL schedule endpoints, then returns `{ games }` where each game is a `ScheduleGameContract`. The fetch window depends on the season: the current season runs from October 1 through today + 28 days; a past season runs through June 30 of the following year
  - `GET /schedule/landing/:gameID`
  - Fetches/caches game landing data (raw passthrough; short TTL)
  - `GET /schedule/:gameID`
  - Fetches/caches game boxscore data (raw passthrough; short TTL)

- `api/routes/team.js` (all accept optional `?season=`)
  - `GET /team/roster/:triCode` — returns a normalized `RosterContract` (`{ players }`)
  - `GET /team/schedule/:triCode` — returns `{ games }` of `ScheduleGameContract`, sorted by date
  - `GET /team/:teamId?` — raw team summary stats (not yet normalized)
  - Uses NHL team stats and club schedule endpoints, with cache keys that include team/sort inputs and season

- `api/routes/player.js` (all accept optional `?season=`)
  - `GET /player/skater/statLeaders/:statIndicator` — flat array of `StatLeaderContract`
  - `GET /player/goalie/statLeaders/:statIndicator` — flat array of `StatLeaderContract`
  - `GET /player/skater/summary` — array of `SkaterSummaryContract`; optional `?teamId=` scopes to one team
  - `GET /player/skater/corsi` — raw passthrough (frontend merges into skater stats by `playerId`); optional `?teamId=`
  - `GET /player/goalie/summary` — array of `GoalieSummaryContract`; optional `?teamId=`
  - Uses NHL skater and goalie stats endpoints

- `api/routes/health.js`
  - `GET /health`
  - `GET /health/cache-usage`
  - Passphrase-protected diagnostics endpoints (see [Diagnostics Layer](#diagnostics-layer))

- `POST /python-service`
  - Defined in `api/app.js`
  - Rate-limited (10 requests per 15 minutes per IP — cached responses make legitimate use rare) and rejects a `cacheKey` that is neither `default` nor a plausible tricode (`/^[A-Z]{3}$/`), so anonymous callers cannot burn Anthropic credits or multiply cache entries
  - Calls `api/routes/hockey-ai.py` through a Python subprocess
  - Caches AI responses by cache key
  - The body carries an explicit `triCode` field for domain persistence (the old inference from `cacheKey` is kept as a fallback for one release)

There is no `/` route: the app is a JSON API with no view engine. Unmatched paths fall through to the 404 + JSON error handlers.

### NHL API Clients

`api/services/nhlApiClient.js` defines separate Axios clients for the NHL APIs:

- `axiosNhl`: `https://api-web.nhle.com/v1`
- `axiosNhlTeam`: `https://api.nhle.com/stats/rest/en/team`
- `axiosNhlStats`: `https://api.nhle.com/stats/rest/en/skater`
- `axiosNhlGoalie`: `https://api.nhle.com/stats/rest/en/goalie`

All four clients set a 10-second `timeout`, so a hung NHL upstream surfaces as the shared JSON error handler's 500 instead of hanging the request (and the user's spinner) indefinitely.

Prefer these clients over creating new Axios instances inside route handlers.

### Backend Response Contracts

`api/services/mappers/` holds the normalization layer (an anti-corruption layer) that translates messy, inconsistent NHL API shapes into stable, documented contracts **once**, at the backend boundary. The frontend consumes these contracts, not raw NHL JSON, so NHL field renames are fixed in one mapper instead of across pages and helpers.

Mapper modules, each documenting its shape(s) with a JSDoc `@typedef`:

- `scheduleMapper.js` — `mapGame(rawGame, { date, dayAbbrev })` → `ScheduleGameContract`; `mapBroadcasts` → `GameBroadcastContract[]`. One mapper serves both schedule sources (the weekly endpoint supplies the date on the week; the club-schedule endpoint supplies it per game).
- `standingsMapper.js` — `mapStandingsTeam(rawTeam)` → `StandingsTeamContract` (or `null` for rows with no resolvable id). Owns the `teamId` fallback chain and `clinchingIndicator`/`clinchIndicator` spelling normalization.
- `rosterMapper.js` — `mapRoster(rawRoster)` → `RosterContract` (`{ players }`), flattening forwards/defensemen/goalies and keeping the raw position code.
- `playerMapper.js` — `mapSkaterSummary`, `mapGoalieSummary`, and `mapStatLeaders(raw, category)`.

Conventions for this layer:

- **Mappers are pure functions** with defensive fallbacks for missing or renamed NHL fields (e.g. `venue?.default ?? ""`, guarded `.default` unwraps, `faceoffWinPct > 0 ? value : null`).
- **Map after `GetOrFetch`, not inside it.** Cached entries store the **raw** NHL response, and the route maps on the way out. This means a mapper change never requires clearing the cache, and old cache entries stay compatible.
- **Shape translation only.** App/derived/display logic stays on the frontend (e.g. draft-lottery odds in `leagueStandingsHelper.ts`, TOI string formatting, `pointsPctg` rounding). Corsi (SAT%) is a separate endpoint merged on the frontend by `playerId` and is intentionally not part of the skater contract.

### Backend Caching

`api/utils/cacheManager.js` provides raw-response caching with TTLs and in-flight request de-duplication. It is intentionally a cache/persistence boundary, not a domain model layer: raw NHL responses are stored, then mapped on the way out through `api/services/mappers/`.

Cache types:

- `PLAYER`
- `ROSTER`
- `AI`
- `SCHEDULE`
- `STANDINGS`
- `STAT_LEADERS`
- `TEAM`

Storage mode:

- Both the cache pool (`cacheManager.js`) and the domain pool (`db/pool.js`) read their connection string and SSL settings from the shared `api/db/connectionConfig.js`, so SSL behavior is defined in one place. The two pools themselves stay separate.
- **TLS certificate verification.** When SSL is enabled (`NODE_ENV=production` or `CACHE_DATABASE_SSL=true`), `getSslConfig()` verifies the Postgres server certificate against a CA supplied via `DATABASE_CA_CERT` and connects with `rejectUnauthorized: true`. `DATABASE_CA_CERT` accepts either the PEM text itself (paste the full certificate block, e.g. into a Render env var) or a path to a `.pem` file. It is **required** whenever SSL is on: `getSslConfig()` throws (fail-closed) rather than falling back to an unverified connection, so a missing or wrong cert surfaces immediately instead of silently allowing a MITM-able link. Neon chains to Let's Encrypt's ISRG Root X1 (`https://letsencrypt.org/certs/isrgrootx1.pem`). Local development sets `CACHE_DATABASE_SSL=false`, which disables SSL entirely and bypasses the cert requirement.
- With no `CACHE_DATABASE_URL`, the app uses generated local folders under `api/cache/`.
- With `CACHE_DATABASE_URL`, the app defaults to Postgres and stores rows in `app_cache`.
- `CACHE_STORAGE=filesystem|postgres|hybrid` can override that default. `hybrid` reads Postgres first and can use local files as a secondary store.
- When both stores miss, `readCache` also checks an optional seed folder, `api/cache-seed/<type>-cache/<key>.json`. A seed hit is written back into the active store(s). The folder does not exist by default; it is a hook for shipping pre-warmed cache data with a deployment.

The Postgres table is created automatically if needed:

```sql
CREATE TABLE IF NOT EXISTS app_cache (
  cache_key text PRIMARY KEY,
  type text NOT NULL,
  logical_key text NOT NULL,
  timestamp_ms bigint NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

`cache_key` is `${type}:${logical_key}` and the table also has a unique `(type, logical_key)` index. Writes use `INSERT ... ON CONFLICT DO UPDATE`, so the database updates an existing season/team/stat entry instead of creating duplicate records.

Filesystem cache entries use this shape:

```json
{
  "timestamp": 1710000000000,
  "data": {}
}
```

Use `GetOrFetch(type, key, fetcher)` for new cached backend fetches. It checks the cache, prevents duplicate simultaneous fetches for the same key, writes fresh data, and returns the result.

Use `CACHE_TYPES.AI` for AI-generated summaries. When Postgres storage is enabled, those summaries go into the same `app_cache` table unless a future feature needs a separate reviewed/source-attributed AI summary table.

`GET /health/cache-usage` reports the active primary cache at the top level. In Postgres or hybrid cache mode, `sections`, `largestSection`, and `total` use `app_cache` byte counts; filesystem details remain available under `local`, and Postgres entry/byte counts remain available under `external`. In filesystem mode, the top-level fields continue to describe the local cache folders.

### Database Migrations

Domain tables live behind explicit SQL migrations under `api/db/migrations/`. Run them from the API package:

```text
cd api
pnpm run db:migrate
```

The migration runner (`api/db/migrate.js`) reads `CACHE_DATABASE_URL` and `CACHE_DATABASE_SSL` from `api/.env`, creates `schema_migrations` if needed, applies only pending `.sql` files, and records each successful migration. The first migration creates:

- `seasons`
- `teams`
- `players`
- `team_season_snapshots`
- `schedule_games`
- `roster_entries`
- `player_season_stats`
- `stat_leaders`
- `ai_summaries`

These tables are for normalized app-facing data. Keep `app_cache` as the raw API payload cache/fallback so mapper changes and future persistence jobs can still work from original NHL response shapes.

The current React app still does most schedule, standings, and team-page slicing in the browser after loading broad season data. A future Phase 2 ticket should replace that with query-backed API endpoints over the normalized tables where it reduces payload size or repeated manual filtering, while preserving client-side presentation-only projections.

### Controller, Service, And Repository Layers

Database-backed domain persistence follows the same broad controller/service/repository shape used in many .NET APIs:

- `api/routes/` is the controller layer. Routes read HTTP inputs, fetch/cache raw NHL data, queue service work, and return the current API response contract.
- `api/services/domain/` is the service layer. Services coordinate transactions, call DB mappers, and call repositories.
- `api/services/mappers/db/` owns pure DB mapping. DB mappers convert raw NHL/API payloads into normalized row objects without touching the database.
- `api/db/repositories/` is the repository layer. Repositories own SQL only; they know table/column names and expose focused read/upsert functions.

Current repository modules cover seasons, teams, players, schedule games, rosters, player season stats, stat leaders, and AI summaries. Current domain services cover team season snapshots, schedules, rosters, player stats, stat leaders, and AI summaries.

Keep routes thin: fetch/cache raw data, call the appropriate service when normalized persistence is desired, then return the current API response contract. Do not put SQL in route files.

When `DATABASE_URL` or `CACHE_DATABASE_URL` is configured, existing routes make best-effort service calls after fetching/caching raw data. Service failures are logged and do not break the HTTP response. Set `DISABLE_DOMAIN_PERSISTENCE=true` to turn off normalized table backfills while keeping the raw cache behavior.

**Batched writes and a serialized task runner (C8).** Each domain service opens one transaction and writes its rows with multi-row `INSERT ... ON CONFLICT DO UPDATE` upserts via `api/db/repositories/batchSql.js` (`batchUpsert` dedupes rows by their conflict key — a single `ON CONFLICT` statement may not affect the same row twice — and chunks the `VALUES` list to stay under Postgres's 65,535 bind-parameter limit), rather than a per-row loop. This keeps each transaction to a handful of statements. `upsertSeason` runs first in every service because the child tables have `NOT NULL` foreign keys to `seasons`; batching — not statement ordering — is what keeps the shared `seasons`-row lock held only briefly. `runServiceTask` (`api/services/domain/runServiceTask.js`) then chains these fire-and-forget tasks through a concurrency-1 promise queue (keeping its by-label dedupe), so two same-season tasks can never hold overlapping transactions. Together these eliminate the `Query read timeout` lock contention that previously left large payloads (season schedules, stat leaders) silently unpersisted against the remote Neon database, where each round trip costs ~20–100 ms and a per-row transaction held the season lock for minutes.

**Domain pool connection (production).** The domain pool (`api/db/pool.js`) and the raw cache pool (`api/utils/cacheManager.js`) both target the same Neon Postgres instance. `connectionConfig.getDatabaseUrl()` resolves `DATABASE_URL` first, then falls back to `CACHE_DATABASE_URL`. On Render, set an explicit `DATABASE_URL` for the domain pool, or rely on the `CACHE_DATABASE_URL` fallback — both point at the same Neon DB. This is what makes normalized domain data survive Render's ephemeral-disk restarts: the raw payloads already persist in Neon's `app_cache`, and these batched domain writes persist alongside them.

### Season IDs

`api/utils/seasonHelper.js` exposes two helpers. `getCurrentSeasonId()` computes the current NHL season ID — strings like `20252026`, treating October as the start of a new season. `isValidSeasonId(idStr)` validates the format (8 digits, where the first 4 + 1 equals the last 4).

Use these helpers rather than hard-coding season IDs, except when intentionally showing historical data.

## Season Selection

Season-aware controls let users browse past seasons instead of only the one inferred by `seasonHelper`. The same `seasonId` flows from a frontend selector, through the URL, to the season-capable backend routes.

### Backend

Season-capable routes (`standings.js`, `schedule.js`, `team.js`, `player.js`) share one Express middleware, `validateSeason` (exported from `api/utils/seasonHelper.js`):

1. It reads the optional `?season=` query param.
2. If present and `isValidSeasonId` rejects it, it responds `400` with the shared `INVALID_SEASON_MSG` and stops.
3. Otherwise it resolves `season || getCurrentSeasonId()` onto `req.seasonId`. Handlers read `req.seasonId` and use it everywhere downstream — including the **cache key**, so different seasons never collide in the filesystem cache (e.g. `skater_${stat}_${seasonId}`, `${triCode}_${season}`).

Apply it as route middleware (`router.get(path, validateSeason, handler)`) or, where every route in a module is season-capable, at the router level (`router.use(validateSeason)` — as `team.js` does). Add it to any new season-capable route rather than re-inlining the validate-and-default logic.

Two endpoints don't take a season directly and translate instead: standings is date-based (a past season → its `standingsEnd` date from the `/standings-season` index), and the schedule fetch windows by season (see the route notes above).

### Frontend

`SeasonContext.tsx` holds the shared selection, backed by the `?season=` URL param (so a season is deep-linkable and survives refresh). `SeasonProvider` wraps the app inside `HashRouter`; `useSeason()` returns `{ season, setSeason }`. An absent or invalid param falls back to `getCurrentSeasonId()`, and `setSeason` preserves other params such as `?date=` and `?view=`.

`react/src/Data/Helpers/seasonHelper.ts` is the frontend twin of the backend helper: `getCurrentSeasonId`, `isValidSeasonId`, plus `getRecentSeasonIds(count)` and `formatSeasonLabel` ("20252026" → "2025–26") for the picker.

The `SeasonSelector` component (Landing, Schedule, Standings, Team pages) is a controlled `<select>` over the recent seasons; a deep-linked season outside that window is appended so the control always has a matching option. Data providers/hooks (`ScheduleContext`, `StandingsContext`, `useStatLeaders`) re-fetch when `season` changes, and `apiHandler.ts` threads `season` through the relevant calls (most via its `withParams` helper). When a selected season has no data, pages render the shared `EmptyState` component.

## AI Integration

The app has a small AI integration for team background information.

Frontend flow:

```text
TeamPage
  -> InterfaceWithChatBot()
  -> POST /python-service
  -> hockey-ai.py
  -> Anthropic API
```

`TeamPage` asks for a strict JSON object with fields such as `arena`, `founded`, `stanleyCups`, `conferenceChampionships`, and `hallOfFamers`.

Important details:

- The Python script requires `ANTHROPIC_API_KEY`.
- The Claude model is read from the **required** `ANTHROPIC_MODEL` env var (the current value is `claude-sonnet-4-6`); it has no in-code default, so every environment must set it or the AI route fails. Upgrading the model is then a config change rather than a code change.
- In development, Express tries to run `api/venv/bin/python3`.
- In production, Express uses `python3`.
- AI responses are cached for a long time using `CACHE_TYPES.AI`.
- AI output should be treated as helpful but not authoritative unless separately verified.

## Diagnostics Layer

The app exposes a small, passphrase-protected diagnostics layer for inspecting backend health and cache usage.

End-to-end flow:

```text
DiagnosticsPage (unlinked route #/diagnostics)
  -> GetHealth(passphrase) / GetCacheReport(passphrase)  (x-diagnostics-key header)
  -> api/routes/health.js  (authCheck middleware)
  -> seasonHelper, cacheManager, process env
```

### Endpoints

- `GET /health` returns API status, app version, environment, current `seasonId`, cache storage mode, cache-directory writability, external cache configured/reachable flags, whether `ANTHROPIC_API_KEY` is configured, uptime, and server time. Sensitive values are reported as booleans/status only, never as raw values.
- `GET /health/cache-usage` returns the primary cache size by section. In Postgres or hybrid cache mode, the top-level `sections`, `largestSection`, and `total` fields come from `app_cache`; filesystem details are nested under `local`, and Postgres entry/byte counts are nested under `external`.

### Authentication model

The single most important rule: **the backend is the only real gate.** Because the frontend is a static SPA, any check done in React is bypassable, and the Express endpoints are publicly reachable. So:

- `api/utils/auth.js` holds `matchesPassphrase` (a pure, constant-time `crypto.timingSafeEqual` comparison against `DIAGNOSTICS_PASSPHRASE`, failing closed if unset) and `authCheck`, an Express middleware applied via `router.use(authCheck)` in `health.js`. It guards every route in that module and returns `401` without the correct passphrase.
- The passphrase travels in the `x-diagnostics-key` **header**, not a query string, so it is not written to request logs or browser history. `app.js` lists this header in CORS `allowedHeaders` so the browser preflight succeeds.
- `DIAGNOSTICS_PASSPHRASE` lives only in `api/.env` and is generated with high entropy (e.g. `crypto.randomBytes(32)`); it must never be committed or baked into the frontend bundle.

### Frontend

`DiagnosticsPage` is an unlinked route — "hidden" only by obscurity, which is acceptable because the backend enforces access. It shows a passphrase gate, then renders an MD3 status grid and a cache-usage table (bytes formatted for display on the frontend). The entered passphrase is kept in `sessionStorage` so a refresh stays authenticated within the tab; a wrong passphrase or unreachable API is caught and surfaced without crashing the app.

## Important Hockey And NHL API Background

This app depends on public NHL API response shapes. Those shapes can change without notice, so the code often uses defensive fallbacks.

The app should treat NHL responses as source data used to render this app, not as a redistributable data product. The cache exists to reduce repeated upstream requests, preserve app availability, and keep raw payloads near the backend mapper boundary. Avoid building public bulk export endpoints or reselling copied NHL data without explicit permission.

Useful domain terms:

- `triCode`: three-letter team abbreviation, such as `COL`, `NYR`, or `TOR`. Frontend team routes use this in `/team/:teamId`, even though the route parameter is named `teamId`.
- `teamId`: numeric NHL team ID, used by NHL stats endpoints.
- `seasonId`: NHL season identifier, such as `20252026`.
- `gameTypeId=2`: regular season.
- `gameType=3`: playoffs.
- `gameState`: NHL game state. The UI treats `FUT` and `PRE` as future/pre-game states. Completed games include states such as `OFF` and `FINAL`.
- `cayenneExp`: NHL stats API query expression. Backend code URL-encodes these expressions before sending them to NHL stats endpoints.
- `clinchingIndicator` / `clinchIndicator`: NHL standings APIs may use either spelling. The backend `standingsMapper` normalizes this to `clinchingIndicator` so the frontend never has to.

Draft lottery odds are currently calculated locally in `leagueStandingsHelper.ts` based on league rank.

## Developer Conventions

### General

- Keep frontend API calls in `react/src/Services/apiHandler.ts` unless there is a strong reason to create a separate service.
- Keep raw NHL response conversion at the backend boundary in `api/services/mappers/` for shared NHL data. Frontend helpers should wrap normalized contracts and own presentation-only or derived app logic.
- Keep reusable display components in `react/src/Components/`.
- Keep route-level orchestration in `react/src/Pages/`.
- Use existing model classes in `react/src/Data/Models/` when passing structured data through the UI.
- Prefer adding typed interfaces or models at the boundary where raw API data becomes app data.

### Frontend

- Use CSS modules for page/component-specific styles.
- Use shared CSS only for truly shared primitives.
- Use context providers for data that many pages/components need.
- Use local component state for one-page or one-widget state.
- Do not call NHL APIs directly from the browser; go through the Express backend.
- Preserve route state fields like `sourcePath`, `fallbackPath`, and `activeNavPath` when adding navigable cards or detail pages. They are used to keep navigation context.
- Keep date parsing local-time aware. Several places intentionally parse `YYYY-MM-DD` manually to avoid UTC date shifts.

### Backend

- Add new NHL proxy endpoints as route modules under `api/routes/`.
- Reuse clients from `api/services/nhlApiClient.js`.
- Use `GetOrFetch` for data that is expensive, reused, or unlikely to need second-by-second freshness.
- Choose cache keys that include every input affecting the response, such as team ID, tri-code, stat name, and season.
- For season-capable routes, apply the shared `validateSeason` middleware and read `req.seasonId` rather than re-inlining the validate-and-default logic (see [Season Selection](#season-selection)).
- Pass errors to `next(error)` so the shared JSON error handler responds consistently.
- Keep route handlers thin: validate/collect request inputs, fetch (via `GetOrFetch` where appropriate), then map the raw response through a mapper in `api/services/mappers/` before returning JSON. Put all NHL-field knowledge in the mapper, not the handler.
- When normalizing cached data, map **after** `GetOrFetch` so the cache stores the raw response (see [Backend Response Contracts](#backend-response-contracts)).

### AI And Automation

- Do not assume AI-returned hockey facts are perfect. Cache keys can make wrong data persist for a long time.
- When changing prompts, keep them strict about JSON shape because the frontend expects parseable structured data.
- For AI agents working on this codebase: inspect the relevant page, service function, backend route, helper, and model together before changing behavior. A frontend display issue may come from any layer in that chain.

## Testing

Backend tests live in `api/test/` and use the built-in Node test runner — no jest/supertest dependencies:

```text
cd api
pnpm test
```

What they cover:

- Mapper behavior for schedule games, standings teams, roster players, skater/goalie summaries, and stat leaders, including missing/renamed NHL fields (`mappers.test.js`, `dbMappers.test.js`)
- `isValidSeasonId`, `getCurrentSeasonId`, and the `validateSeason` middleware (`seasonHelper.test.js`)
- Route behavior with mocked NHL clients, diagnostics auth (401 without/with wrong key), and cache-key composition — every response-changing input (season, team, stat category) must appear in the key (`routes.test.js`)
- Cache manager read/write/TTL behavior and small utils (`cacheManager.test.js`, `fieldValue.test.js`, `jsonParam.test.js`)

`api/test/testApp.js` is a small harness that drives an Express router through fake req/res streams, so tests need no listening port. Tests never hit the NHL network or a real database.

Not covered yet: frontend tests (planned in Phase 2 ticket 2.13) and anything requiring a live Postgres instance.

## Local Development

Typical development setup:

```text
Backend:
  cd api
  pnpm install
  pnpm start

Frontend:
  cd react
  pnpm install
  pnpm start
```

This project standardizes on `pnpm`; `package-lock.json` files are gitignored.

The frontend defaults to `http://localhost:9000` for API calls. Set `VITE_API_URL` if the backend is running somewhere else.

The backend allows CORS from:

- `http://localhost:3000`
- `http://localhost:5173`
- `https://chrisgawbill.github.io`

## Current Maintenance Notes

- `TeamPage.tsx` still holds some display-shaping logic inline (grouping roster players by position, formatting TOI, building stat rows), but the raw NHL parsing it used to duplicate now lives in the backend mappers. If team page behavior grows, consider moving the remaining display transforms into helper files near `react/src/Data/Helpers/`.
- Team summary stats (`/team/:teamId?`) and skater corsi (`/player/skater/corsi`) are not yet normalized into contracts. If they grow more consumers, add mappers for them under `api/services/mappers/`.
- This file is the main architecture reference. The root `README.md` covers project overview, setup commands, environment variables, and the documentation index; keep the two consistent when either changes.
- Known cleanup and refinement work (dead scaffolding, unused dependencies, small consistency fixes) is tracked separately in [cleanup-backlog.md](./cleanup-backlog.md) rather than in the Phase 2 feature backlog. Design-system alignment work lives in [frontend-backlog.md](./frontend-backlog.md), and differentiating feature ideas in [exciting-features-backlog.md](./exciting-features-backlog.md).
