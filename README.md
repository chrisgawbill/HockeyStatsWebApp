# HockeyStatsWebApp

A hockey statistics web app. A React frontend renders NHL schedules, standings, team pages, player stat leaders, and game details; an Express backend proxies and caches public NHL APIs, normalizes their responses into stable contracts, and exposes one AI-backed endpoint for team history background.

```text
React pages/components
  -> React contexts and service functions
  -> Express API routes
  -> NHL public APIs, Postgres/filesystem cache, or Python AI subprocess
```

For the full picture — layers, conventions, caching, season handling, diagnostics — start with [docs/architecture.md](./docs/architecture.md).

## Tech stack

- **Frontend** (`react/`): React 18 + TypeScript on Vite, React Router (`HashRouter`), React Bootstrap grid, CSS Modules. Installed with **pnpm**.
- **Backend** (`api/`): Node + Express. Optional Postgres for response caching and normalized domain tables; a Python subprocess makes the Anthropic API call for team history.
- **Tests** (`api/test/`): built-in Node test runner (`node --test`), no jest/supertest. Frontend tests are planned (Phase 2 ticket 2.13).

## Getting started

Backend (defaults to port `9000`):

```bash
cd api
npm install
npm start
```

Frontend (Vite dev server):

```bash
cd react
pnpm install
pnpm start
```

The frontend calls `http://localhost:9000` by default in development; set `VITE_API_URL` if the backend runs elsewhere.

Optional — apply the Postgres domain-table migrations (requires `CACHE_DATABASE_URL` in `api/.env`):

```bash
cd api
npm run db:migrate
```

## Configuration

All backend configuration lives in `api/.env` (gitignored — never commit it). Everything is optional; with no configuration the app runs with a filesystem cache and no AI endpoint.

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port (default `9000`) |
| `ANTHROPIC_API_KEY` | Enables the AI team-history endpoint |
| `DIAGNOSTICS_PASSPHRASE` | Gates the `/health` diagnostics endpoints (generate with high entropy) |
| `CACHE_DATABASE_URL` | Postgres connection string; enables DB caching and domain persistence |
| `CACHE_DATABASE_SSL` | `true`/`false` override for the Postgres SSL behavior |
| `CACHE_STORAGE` | `filesystem` \| `postgres` \| `hybrid` — overrides the default storage mode |
| `DISABLE_DOMAIN_PERSISTENCE` | `true` turns off best-effort normalized-table backfills |

Frontend: `VITE_API_URL` (build-time) points the app at the backend.

## Testing

```bash
cd api
npm test
```

The suite runs offline — no NHL network access, no database required. See the Testing section of [docs/architecture.md](./docs/architecture.md#testing) for what it covers.

## Documentation

| Document | What it is |
| --- | --- |
| [docs/architecture.md](./docs/architecture.md) | How the app fits together; conventions for new code. **Read first.** |
| [docs/phase-2-backlog.md](./docs/phase-2-backlog.md) | Feature roadmap with self-contained implementation prompts |
| [docs/phase-2-progress.md](./docs/phase-2-progress.md) | Working journal for the Phase 2 roadmap |
| [docs/cleanup-backlog.md](./docs/cleanup-backlog.md) | Refactor, hygiene, and hardening tickets |
| [docs/frontend-backlog.md](./docs/frontend-backlog.md) | Material Design 3 alignment tickets |
| [docs/exciting-features-backlog.md](./docs/exciting-features-backlog.md) | Differentiating feature ideas (mostly zero-fetch, client-side) |
