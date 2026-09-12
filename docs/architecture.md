# HockeyStatsWebApp Architecture

Full-stack NHL stats app: React (Vite) frontend + Express proxy/cache backend + Postgres (Neon) persistence + Python/Anthropic AI subprocess.

## Core Rules & Invariants
- **Frontend Standard:** Bulletproof React. Features isolate their own `api/`, `components/`, `hooks/`, `types/`, `utils/`. Cross-feature imports forbidden (exceptions: `schedule` uses `game-detail` boxscore; `TeamPage` uses `schedule` game model; other features import `ScheduledGame`-shaped helpers from `schedule/utils/gameStatusHelper.ts` rather than copying them). Shared primitives keyed on bare values (a `gameState` string, a date string) live in `react/src/lib/` instead — features import from `lib/` rather than copying a helper or reaching into another feature.
- **Backend Standard:** Feghhi 3-Pattern (Thin Presentation -> Domain Slices -> Infrastructure). Constructor DI wired via explicit composition root (`container.js`). No direct SQL or external I/O in routes.
- **Mapping Boundary:** Anti-corruption layer in `slices/<slice>/mappers/`. Raw NHL payloads cached first via `GetOrFetch`; mapping runs **after** cache read on outbound response. Never cache normalized contracts.
- **Imports:** Frontend uses `@/*` (`react/src/*`). Backend uses Node subpath imports with `.js` extensions: `#presentation/*`, `#slices/*`, `#platform/*`, `#composition/*`. No relative climbing (`../../`).
- **Database/Writes:** Neon Postgres. Concurrency-1 task queue (`runServiceTask`) runs batched multi-row upserts (`batchUpsert`). Always upsert `seasons` row first (FK root).

---

## Directory Trees

### Frontend (`react/src/`)
```text
├── app/               # Root providers, HashRouter, App.tsx routes, LandingPage
├── components/        # Cross-domain primitives (PageHeader, SeasonSelector, SlidingToggle, EmptyState)
├── features/          # Domain feature slices
│   ├── [feature]/     # schedule, game-detail, standings, teams, stat-leaders, draft-lottery, season, diagnostics
│   │   ├── api/       # Typed endpoints wrapping @/lib/apiClient
│   │   ├── components/# Feature UI + colocated CSS modules
│   │   ├── hooks/     # Contexts and domain hooks (e.g., useStatLeaders)
│   │   ├── types/     # Domain models/contracts
│   │   └── utils/     # Presentation mappers, pure calculations (draft odds)
├── lib/               # axiosInstance (15s timeout), apiClient core, genAIHandler, shared cross-feature primitives (gameStatus, dateFormat)
└── styles/            # Global styling, tokens, reset
