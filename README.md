# HockeyStatsWebApp

A hockey statistics web app with a **Vite + React** frontend and an **Express** backend.
The frontend renders NHL schedules, standings, team pages, player leaders, and game
details. The backend acts mostly as a proxy and cache layer over the public NHL APIs,
plus one AI-backed endpoint for team history data.

```text
React pages/components
  -> React contexts and service functions
  -> Express API routes
  -> NHL public APIs, Postgres/filesystem cache, or Python AI subprocess
```

## Repository layout

```text
api/      Express backend (routes, services, mappers, db, utils)
react/    Vite + React frontend (Pages, Components, Data, Services, style)
docs/     Project documentation
```

## Getting started

This project standardizes on [pnpm](https://pnpm.io/).

**Backend**

```bash
cd api
pnpm install
pnpm start        # listens on PORT or 9000
```

**Frontend**

```bash
cd react
pnpm install
pnpm start        # Vite dev server
```

The frontend defaults to `http://localhost:9000` for API calls. Set `VITE_API_URL`
if the backend runs elsewhere.

### Environment variables

Copy the example templates and fill in real values (the real `.env` files are
gitignored):

```bash
cp api/.env.example api/.env
cp react/.env.example react/.env
```

`api/.env.example` documents every backend variable (cache/database config,
`ANTHROPIC_API_KEY`, `DIAGNOSTICS_PASSPHRASE`, `PORT`, `NODE_ENV`).

## Documentation

See [`docs/architecture.md`](docs/architecture.md) for the full architecture
reference: frontend/backend layering, the backend response-contract mappers, caching
and database migrations, season selection, the AI integration, and the diagnostics
layer.
