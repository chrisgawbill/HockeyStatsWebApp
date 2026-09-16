# HockeyStatsWebApp

A hockey statistics web app. A React frontend renders NHL schedules, standings, team pages, player stat leaders, and game details; the independent [HockeyStatsAPI](https://github.com/chrisgawbill/HockeyStatsAPI) service proxies and caches public NHL APIs, normalizes their responses into stable contracts, and exposes one AI-backed endpoint for team history background.

```text
React pages/components
  -> React contexts and service functions
  -> HTTPS/JSON HockeyStatsAPI service
  -> NHL public APIs, Postgres/filesystem cache, or Python AI subprocess
```

For the full picture — layers, conventions, caching, season handling, diagnostics — start with [docs/architecture.md](./docs/architecture.md).

## Tech stack

- **Frontend** (`react/`): React 18 + TypeScript on Vite, React Router (`HashRouter`), React Bootstrap grid, CSS Modules.
- **API** ([HockeyStatsAPI](https://github.com/chrisgawbill/HockeyStatsAPI)): Node + Express. Optional Postgres for response caching and normalized domain tables; a Python subprocess makes the Anthropic API call for team history.
- **Tests**: API tests live in HockeyStatsAPI and use Node's built-in test runner; frontend tests use Vitest.

## Repository layout

```text
react/    Vite + React frontend (src/app, src/features, src/components, src/lib, src/styles)
HockeyStatsAPI  Independent Express API service (separate repository)
docs/     Project documentation
```

## Getting started

This project standardizes on [pnpm](https://pnpm.io/).

**Frontend** (Vite dev server):

```bash
cd react
pnpm install
pnpm start
```

The deployed frontend uses `https://hockeystatsapi.onrender.com` through the GitHub Actions `VITE_API_URL` variable. Local development defaults to `http://localhost:9000`; set `VITE_API_URL` if the API runs elsewhere.

### Environment variables

Copy the example templates and fill in real values (the real `.env` files are gitignored):

```bash
cp react/.env.example react/.env
```

Backend environment variables and migrations are documented in the [HockeyStatsAPI repository](https://github.com/chrisgawbill/HockeyStatsAPI).

## Testing

API tests run in HockeyStatsAPI; frontend tests run from `react/` with `pnpm test`. See the Testing section of [docs/architecture.md](./docs/architecture.md#testing) for what the frontend suite covers.

## Documentation

| Document                                                                 | What it is                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [docs/architecture.md](./docs/architecture.md)                           | How the app fits together; conventions for new code. **Read first.** |
| [docs/phase-2-backlog.md](./docs/phase-2-backlog.md)                     | Feature roadmap with self-contained implementation prompts           |
| [docs/phase-2-progress.md](./docs/phase-2-progress.md)                   | Working journal for the Phase 2 roadmap                              |
| [docs/cleanup-backlog.md](./docs/cleanup-backlog.md)                     | Refactor, hygiene, and hardening tickets                             |
| [docs/frontend-backlog.md](./docs/frontend-backlog.md)                   | Material Design 3 alignment tickets                                  |
| [docs/exciting-features-backlog.md](./docs/exciting-features-backlog.md) | Differentiating feature ideas (mostly zero-fetch, client-side)       |
| [docs/board-game-design.md](./docs/board-game-design.md)                 | Rink Quest board game rules and design rationale                     |
| [docs/board-game-notes.md](./docs/board-game-notes.md)                   | Rink Quest maintainer notes and optional Google sign-in setup         |
