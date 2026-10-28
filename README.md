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

The deployed frontend contacts the hockeystatsAPI that is hosted on my own dev server. 

### Environment variables

Copy the example templates and fill in real values (the real `.env` files are gitignored):

```bash
cp react/.env.example react/.env
```

Backend environment variables and migrations are documented in the [HockeyStatsAPI repository](https://github.com/chrisgawbill/HockeyStatsAPI).

## Testing

API tests run in HockeyStatsAPI; frontend tests run from `react/` with `pnpm test`. See [test documentation](./react/src/test/README.md) for coverage and verification commands.

## Documentation

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Agent entry point and targeted reading order. |
| [Development workflow](docs/agent-development.md) | Decisions, delegation, verification, and delivery. |
| [Code conventions](docs/code-conventions.md) | Naming, readability, reuse, and comments. |
| [Ticket index](docs/agent-ticket-index.md) | Links to individual tickets and dependency overview. |
| [Architecture](docs/architecture.md) | Current system behavior and boundaries. |
| [Rink Quest design](docs/board-game-design.md) | Board game rules and rationale. |
| [Opening Night 2.0 design](docs/opening-night-2-design.md) | Proposed next-generation game direction. |
