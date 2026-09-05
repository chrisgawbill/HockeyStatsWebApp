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

- **Frontend** (`react/`): React 18 + TypeScript on Vite, React Router (`HashRouter`), React Bootstrap grid, CSS Modules.
- **Backend** (`api/`): Node + Express. Optional Postgres for response caching and normalized domain tables; a Python subprocess makes the Anthropic API call for team history.
- **Tests** (`api/src/test/`): built-in Node test runner (`node --test`), no jest/supertest. Frontend tests are planned (Phase 2 ticket 2.13).

## Repository layout

```text
api/      Express backend (src/presentation, src/slices, src/platform, src/composition)
react/    Vite + React frontend (src/app, src/features, src/components, src/lib, src/styles)
docs/     Project documentation
```

## Getting started

This project standardizes on [pnpm](https://pnpm.io/).

**Backend** (listens on `PORT` or 9000):

```bash
cd api
pnpm install
pnpm start
```

**Frontend** (Vite dev server):

```bash
cd react
pnpm install
pnpm start
```

The frontend defaults to `http://localhost:9000` for API calls. Set `VITE_API_URL` if the backend runs elsewhere.

Optional — apply the Postgres domain-table migrations (requires `CACHE_DATABASE_URL` in `api/.env`):

```bash
cd api
pnpm run db:migrate
```

### Environment variables

Copy the example templates and fill in real values (the real `.env` files are gitignored):

```bash
cp api/.env.example api/.env
cp react/.env.example react/.env
```

`api/.env.example` documents every backend variable (cache/database config, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `DIAGNOSTICS_PASSPHRASE`, `PORT`, `NODE_ENV`). Everything is optional; with no configuration the app runs with a filesystem cache and no AI endpoint. The AI endpoint needs both `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` set — the model name has no in-code default.

## Testing

```bash
cd api
pnpm test
```

The suite runs offline — no NHL network access, no database required. See the Testing section of [docs/architecture.md](./docs/architecture.md#testing) for what it covers.

## Documentation

| Document                                                                 | What it is                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [docs/architecture.md](./docs/architecture.md)                           | How the app fits together; conventions for new code. **Read first.** |
| [docs/phase-2-backlog.md](./docs/phase-2-backlog.md)                     | Feature roadmap with self-contained implementation prompts           |
| [docs/phase-2-progress.md](./docs/phase-2-progress.md)                   | Working journal for the Phase 2 roadmap                              |
| [docs/cleanup-backlog.md](./docs/cleanup-backlog.md)                     | Refactor, hygiene, and hardening tickets                             |
| [docs/frontend-backlog.md](./docs/frontend-backlog.md)                   | Material Design 3 alignment tickets                                  |
| [docs/exciting-features-backlog.md](./docs/exciting-features-backlog.md) | Differentiating feature ideas (mostly zero-fetch, client-side)       |
