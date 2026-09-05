# Phase 2 Backlog

> **Path note (2026-09-04):** the repository was restructured — frontend to Bulletproof React (`react/src/{app,features,components,lib,styles}`) and backend to a presentation/slices/platform split (`api/src/...`). File paths mentioned below predate that move; see `docs/architecture.md` for where each file now lives.

Future feature roadmap for the HockeyStatsWebApp. Items are ordered so shared backend/frontend foundations come before user-facing workflows that depend on them.

Each open ticket carries a self-contained **implementation prompt** meant to be pasted verbatim into a fresh Claude Code session (Sonnet/Opus acting as the senior dev, pairing with a junior dev who writes the code). Prompts list exact files to read, numbered steps with pause points, project invariants that must hold, an out-of-scope fence, and done-criteria. Completed tickets keep their original shorter prompts for the historical record.

## 2.1 API health, diagnostics, and environment visibility

- [x] **Owner:** Either | **Depends on:** Architecture baseline | **Done:** 2026-05-31 (see [phase-2-progress.md](./phase-2-progress.md#21--api-health-diagnostics-and-environment-visibility))

Add lightweight operational visibility so local development and deployments can quickly answer whether the React app, Express API, NHL upstreams, cache folders, and optional AI integration are configured correctly.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp. Read docs/architecture.md first.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add a small diagnostics layer for the Express API and expose it in a simple frontend-accessible way.

Things to implement:
- GET /health endpoint in api/app.js or a dedicated route module
- Return API status, app version if available, current seasonId from seasonHelper, cache directory availability, and whether ANTHROPIC_API_KEY is configured
- Add a frontend service function for the health endpoint
- Add a small development-only diagnostics view or footer indicator that can show API reachable/unreachable
- Keep sensitive values hidden; report booleans/status only
- Add basic error handling so diagnostics failure does not break the main app
```

## 2.2 Normalize API response contracts

- [x] **Owner:** Either | **Depends on:** 2.1 | **Done:** 2026-05-31 (see [phase-2-progress.md](./phase-2-progress.md#22--normalize-api-response-contracts))

Create stable backend response shapes for schedule, standings, teams, rosters, and player stats so frontend helpers do less defensive guessing against raw NHL API objects.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp. Read docs/architecture.md and inspect api/routes plus react/src/Data/Helpers.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Introduce normalized backend response contracts for the most-used NHL data.

Things to implement:
- Identify duplicated frontend normalization in helpers and page components
- Add backend mapper functions near the relevant route modules or in api/services
- Normalize schedule game, standings team, roster player, skater summary, goalie summary, and stat leader shapes
- Keep existing routes backward compatible where practical, or update frontend callers in the same change
- Document each normalized shape with concise JSDoc or TypeScript model comments
- Add defensive fallbacks for NHL fields that are missing or renamed
```

## 2.3 Season and date range controls

- [x] **Owner:** Either | **Depends on:** 2.2 | **Done:** 2026-06-02 (see [phase-2-progress.md](./phase-2-progress.md#23--season-and-date-range-controls))

Let users explore past and current seasons instead of only the season inferred by `seasonHelper` and the currently cached schedule window.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp. The app currently computes the current NHL season ID in api/utils/seasonHelper.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add season-aware controls across schedule, standings, team stats, and player leader workflows.

Things to implement:
- Add backend support for optional seasonId query params where NHL endpoints support it
- Validate seasonId format like 20252026 before using it
- Add frontend season selector state that can be shared by pages that need it
- Update schedule and stat leader calls to include selected season where supported
- Make current season the default using existing seasonHelper behavior
- Show clear empty states when a selected season has no available data
```

## 2.4 Backend contract and season test coverage

- [x] **Owner:** Either | **Depends on:** 2.2, 2.3 | **Done:** 2026-06-02 (see [phase-2-progress.md](./phase-2-progress.md#24--backend-contract-and-season-test-coverage)); shipped alongside the centralized cache manager and Postgres cache/domain persistence work (PRs #40–#42)

Add focused backend tests before building more Phase 2 features on top of the normalized contracts and season-aware routes. The backend now owns the highest-risk shared behavior: response mappers, `validateSeason`, season-aware cache keys, diagnostics auth, and route response contracts.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp backend tests. Read docs/architecture.md, docs/phase-2-progress.md sections 2.2 and 2.3, api/package.json, api/routes, api/services/mappers, api/utils/seasonHelper.js, api/utils/cacheManager.js, and api/utils/auth.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add targeted backend tests for normalized contracts, season validation, cache keys, and diagnostics auth.

Things to implement:
- Choose a lightweight backend test setup that fits the existing api package; add npm scripts only if they are missing
- Unit test mapper behavior for schedule games, standings teams, roster players, skater/goalie summaries, and stat leaders
- Include mapper cases for missing or renamed NHL fields, especially guarded `.default` unwrapping and `clinchingIndicator`/`clinchIndicator`
- Unit test `isValidSeasonId`, `getCurrentSeasonId` where practical, and `validateSeason` middleware success/failure behavior
- Add route-level tests for health diagnostics auth and at least one season-aware route using mocked NHL clients/cache boundaries
- Verify cache keys include every response-changing input where caching is used: season, team, stat category, and schedule/standings variants; explicitly note any intentionally uncached route boundaries
- Keep NHL network access out of tests; use fixtures or small inline mock payloads
- Document how to run the backend tests locally and what they intentionally do not cover yet
```

## 2.5 Schedule Filters, Team Calendar, and Global Search

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.4

Add client-side schedule filters (`?team=`, `?status=`, `?type=`, `?range=`) and a global team/game search dropdown in `PageHeader`. All filters and searches project over already-loaded in-memory context data (`ScheduleContext`, `teamListData`). Zero new backend endpoints, zero new network requests on filter/search changes.

**Implementation prompt:**

```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- My goal is to learn and write the code myself. Explain the architectural pattern, outline the required interfaces/signatures conceptually, point me to existing repo examples to mirror, and let me write the code.
- Critique my code when I paste it: check edge cases, token/rendering efficiency, and adherence to invariants.
- Execute ONE step at a time. Conclude each step with a focused question or prompt for my implementation before moving forward.

Context: 
- Refer to @docs/architecture.md.
- Tech Stack: React (Vite, HashRouter), TypeScript, CSS Modules.
- Primary Source Files:
  - Bulletproof React paths: @/features/schedule/*, @/features/teams/*, @/components/*.
  - @/features/schedule/components/SchedulePage.tsx
  - @/features/schedule/hooks/ScheduleContext.tsx
  - @/features/schedule/utils/scheduleHelper.ts (use parseLocalDate, formatDateParam)
  - @/features/teams/utils/teamListData.ts (localTeamList)
  - @/components/PageHeader.tsx

Invariants:
- Zero Network Requests: Only ?season= fetches data. Date, view, filters, and search are 100% in-memory projections.
- URL State Preservation: Use setSearchParams(prev => ...) to preserve sibling query params (season, view, date).
- Date Safety: Never new Date("YYYY-MM-DD"). Use parseLocalDate from scheduleHelper.ts.
- Navigation State: Preserve sourcePath, fallbackPath, activeNavPath on /game/:gameId routes.
- Anti-Overengineering: No external search libraries (no Fuse.js), debounce hooks, or portal modals. Use String.prototype.includes() and native elements.

Scope Boundaries:
- In Scope: Filters for team (triCode), status (upcoming/final), game type (regular/playoff via isPlayoff). Global search for Teams + Games.
- Out of Scope: Player search (ticket 2.8), backend endpoints (ticket 2.14), modifying api/.

Steps (Guide me through ONE at a time. No code generation):
1. Design the Filter Contract: Walk me through designing the `ScheduleFilters` TypeScript interface and its mapping to URL query parameters on `/schedule`.
2. Pure Filter Function: Guide me to implement `filterGames()` in `@/features/schedule/utils/scheduleFilterHelper.ts` (pure function, zero React hooks).
3. Schedule UI Wiring: Guide me in adding native filter controls to `SchedulePage.tsx` synchronizing with URL search params.
4. Empty States: Guide me to wire the existing `EmptyState` component for empty filter results vs empty seasons.
5. Search Index: Guide me to construct a memoized search index (`useMemo`) in `PageHeader.tsx` over teams and loaded season games.
6. Dropdown UI & Navigation: Guide me to build the search dropdown with native keyboard navigation (arrows, Enter, Escape) linking to `/team/:triCode` or completed `/game/:gameId`.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass.
- Changing filters fires zero network calls.
- Deep-linking #/schedule?team=COL&status=final works on fresh reload.
```

## 2.6 Enhanced game detail pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.5

Make game detail pages useful before, during, and after games by separating preview, live, and final states. The current backend still passes game landing and boxscore responses through raw, while schedule list data is normalized. This ticket should either keep detail-specific raw handling isolated in the page or introduce backend mappers for repeated detail shapes if the UI starts depending on them heavily.

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Explain the domain rules and data contracts conceptually. Point me to files I can copy patterns from, and let me write the code.
- Review my code for edge cases (missing NHL fields, null safety) after I paste it.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - Frontend: @/features/game-detail/components/GameDetailPage.tsx, @/features/game-detail/types/gameDetail.ts, @/features/game-detail/api/gameDetailApi.ts
  - Backend: api/src/presentation/routes/schedule.js, api/src/slices/schedule/scheduleService.js

Invariants:
- Anti-Corruption: All raw NHL chaining stays inside @/features/game-detail/utils/gameDetailHelper.ts. Components receive typed view models only.
- Polling: Live polling must use a single setInterval >= 60 seconds, cleared on unmount.
- Navigation History: Preserve sourcePath, fallbackPath, and activeNavPath.
- Anti-Overengineering: No state machine libraries. Map gameState directly: FUT/PRE = preview; FINAL/OFF = final; others = live.

Scope Boundaries:
- In Scope: Preview state, live state with polling, final state hardening, section-level fallbacks.
- Out of Scope: Player profile links (ticket 2.8), backend mapper changes.

Steps (Guide me through ONE at a time. No code generation):
1. State Discrimination: Help me map NHL `gameState` strings into an enum/union ('preview' | 'live' | 'final') inside a pure helper.
2. View Models: Guide me in designing pure transformation helpers that unwrap raw landing/boxscore data into clean props.
3. Preview View: Guide me in assembling the pre-game matchup preview and local puck-drop time display.
4. Live Polling: Guide me in implementing an unmount-safe 60-second polling interval for live games.
5. Hardening & Fallbacks: Guide me in adding section-level fallbacks so missing blocks in historical games don't blank the view.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass.
- Handled safely across preview, live, and final game states.
- Interval cleanly terminates on unmount.
```
## 2.7 Team page depth: roster, schedule, leaders, and history

- [ ] Owner: Either | Depends on: 2.2, 2.3, 2.5

Rebuild TeamPage into a URL-backed tabbed hub (?tab=overview|roster|schedule|skaters|goalies|history). Keep official NHL data strictly separated from AI-generated history.

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Explain the state transitions and layout structure conceptually. Point out relevant existing helpers, then let me write the code.
- Review my implementation for URL parameter hygiene and render-phase performance.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - @/features/teams/components/TeamPage.tsx
  - @/features/teams/types/teamPageTypes.ts
  - @/features/teams/utils/teamPageHelper.ts
  - @/lib/genAIHandler.ts

Invariants:
- URL Tabs: Driven by ?tab= param, defaulting to overview. Preserve ?season= and existing params via setSearchParams(prev => ...).
- AI Separation: AI content isolated in its own sub-component with a prominent "AI-generated" disclaimer. Never blend with official NHL stats.
- Derivations: Preserve useMemo derivation of standings/ranks from StandingsContext at render time to prevent deep-link races.
- Anti-Overengineering: No external tab packages. Semantic HTML buttons and CSS modules only.

Scope Boundaries:
- In Scope: URL tabs, grouped roster view (F/D/G), sortable skater/goalie tables, AI history tab.
- Out of Scope: Player profile routes (ticket 2.8), AI backend prompt versioning (ticket 2.12).

Steps (Guide me through ONE at a time. No code generation):
1. Tab State: Guide me in wiring ?tab= parameter state into TeamPage.tsx while preserving sibling query params.
2. Overview Tab: Help me structure the overview cards using existing standings context projections.
3. Grouped Roster: Guide me in writing a pure helper in `teamPageHelper.ts` to categorize players by position group.
4. Skaters & Goalies Tables: Guide me to wire sortable table state over existing summary contracts.
5. Isolated History Tab: Guide me in encapsulating the AI history block with disclaimer badges and failure states.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass.
- Deep-linking #/team/COL?season=20232024&tab=roster restores exact tab and season on reload.
```
## 2.8 Player profile pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.7

Introduce dedicated player detail views (#/player/:playerId) and integrate player names into the global search dropdown created in ticket 2.5. Reuse normalized contracts (SkaterSummaryContract, GoalieSummaryContract) and local roster data without redundant network round trips[cite: 2].

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Guide me through data flow, model design, and route registration conceptually. Let me write the code.
- Review my code for strict TypeScript typing and pattern compliance.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - @/features/players/*, @/features/teams/*, @/components/*
  - @/features/players/api/playerApi.ts
  - @/features/teams/api/teamsApi.ts
  - @/components/PageHeader.tsx
  - @/app/App.tsx

Invariants:
- Season Awareness: /player/:playerId respects active ?season=.
- Pure Helpers: Slicing and stats transformations belong in pure utils (@/features/players/utils/), not inside components.
- Polymorphism: Single polymorphic PlayerPage container handling Skater or Goalie layouts based on position; no duplicated pages.
- Anti-Overengineering: No heavy charting libraries or career projection models.

Scope Boundaries:
- In Scope: PlayerPage layout, skater/goalie stats tables, extending PageHeader search index with players.
- Out of Scope: Backend persistence changes, career milestone forecasting.

Steps (Guide me through ONE at a time. No code generation):
1. Player Contract: Help me define the TypeScript interface merging profile data with existing skater/goalie summary shapes.
2. Route & API: Guide me in adding the lazy route in `App.tsx` and the endpoint client in `playerApi.ts`.
3. View Components: Guide me in building `PlayerPage.tsx` and presentation tables.
4. Search Integration: Guide me in updating `PageHeader.tsx` to index loaded players and route to `/player/:playerId`.
5. Empty States: Guide me in handling missing or unpersisted historical player seasons.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass.
- Clicking player from roster and search dropdown navigates seamlessly.
- Handles skaters and goalies correctly without layout issues.
```
## 2.9 Favorites and personalized dashboard

- [ ] **Owner:** Either | **Depends on:** 2.5, 2.7, 2.8

Let users mark favorite teams and players via local storage, surfacing personalized games, standings, and leaders on the landing page without requiring user accounts or backend persistence

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Guide me on React context design, browser storage boundaries, and accessibility. Let me write the code.
- Critique my implementation for reactive performance and error-resilience.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - react/src/index.tsx (route-agnostic provider placement)
  - @/app/LandingPage.tsx
  - @/features/teams/components/TeamPage.tsx
  - @/features/players/components/PlayerPage.tsx

Invariants:
- Provider Placement: FavoritesContext belongs in react/src/index.tsx alongside ThemeProvider (independent of routing/season).
- Schema Versioning: Wrap localStorage data in a versioned object ({ version: 1, ... }) with fallback parsing.
- Reactivity: Favorites dashboard sections derive from loaded contexts using useMemo; no duplicate network requests.
- Anti-Overengineering: Use window.localStorage and standard React context. No external state stores.

Scope Boundaries:
- In Scope: FavoritesContext, accessible toggle button, personalized LandingPage section.
- Out of Scope: Cloud syncing, backend favorites endpoints.

Steps (Guide me through ONE at a time. No code generation):
1. Context & Storage: Guide me to structure `FavoritesContext.tsx` with version checking and graceful JSON error handling.
2. Custom Hook: Guide me to define the `useFavorites()` hook API.
3. Toggle Component: Guide me to build an accessible semantic button with `aria-pressed`.
4. Dashboard Cards: Guide me to derive favorite teams' upcoming games and records on `LandingPage.tsx`.
5. Edge Cases: Guide me in handling seasons where a favorited team has no games or data.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass.
- Favorites persist across reloads; corrupted localStorage falls back cleanly.
```
## 2.10 Advanced standings and playoff race views

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.9

Expand standings views to include Wildcard and League-wide tables, column sorting, clinching indicator badges, and favorite-team row highlighting

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Explain hockey standings logic, tiebreaker rules, and table projection patterns. Let me write the code.
- Review my math and data transformations for correctness against official NHL rules.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - @/features/standings/components/StandingsPage.tsx
  - @/features/standings/utils/leagueStandingsHelper.ts
  - @/features/standings/types/standingsTeam.ts
  - #slices/standings/mappers/standingsMapper.js

Invariants:
- Pure Helpers: Standings math, wildcard partitioning, and draft odds remain pure functions in `leagueStandingsHelper.ts`.
- URL State: View mode stored in ?mode=conference|division|wildcard|league. Sibling params preserved.
- Mapping Boundary: Map new fields AFTER GetOrFetch on backend.
- Anti-Overengineering: Native HTML table elements with CSS modules. No heavy datagrid dependencies.

Scope Boundaries:
- In Scope: Wildcard and league projections, table header sorting, clinch indicators, favorite highlights.
- Out of Scope: Playoff bracket trees, simulation projections.

Steps (Guide me through ONE at a time. No code generation):
1. Contract Check: Help me verify if `StandingsTeamContract` contains all necessary sequence and stats fields.
2. Wildcard Logic: Guide me in writing the pure helper to split teams into division top-3 and wildcard seeds.
3. Mode Toggle: Guide me in adding ?mode= URL controls to `StandingsPage.tsx`.
4. Sorting Logic: Guide me in implementing a lightweight, multi-column sorting state for table headers.
5. Visual Cues: Guide me in wiring clinching badges and favorite-team row highlights.

Validation Criteria:
- cd react && npx tsc --noEmit and pnpm build pass; cd api && pnpm test passes if backend mappers touched.
- Wildcard seeds match official standings. Sorting works without resetting URL params.
```
## 2.12 AI history hardening and source separation

- [ ] **Owner:** Either | **Depends on:** 2.7

Harden the AI-backed team history pipeline: move prompt generation and schema validation to the backend, introduce versioned cache keys, and enforce typed failure modes so AI output never poisons data models or impersonates official stats

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Guide me through backend domain separation, validation contracts, and error mapping conceptually. Let me write the code.
- Review my validation logic and status code assignments.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - Backend: #presentation/routes/ai.js, #slices/aiSummaries/aiSummaryService.js, #platform/aiRunner.js
  - Frontend: @/lib/genAIHandler.ts, @/features/teams/components/TeamHistoryCard.tsx

Invariants:
- Backend Ownership: Prompt text, JSON validation, and cache keys belong strictly on the backend. Frontend sends only triCode.
- Validate Before Cache: Only valid JSON payloads are cached under CACHE_TYPES.AI. Failed runs never cache.
- Versioned Keys: Key format: ${triCode}_s${schemaVersion}_p${promptVersion}.
- Anti-Overengineering: Hand-rolled pure validator function. No external schema libraries (Zod/Joi).

Scope Boundaries:
- In Scope: Backend prompt encapsulation, validator function, discrete error codes, graceful fallback UI.
- Out of Scope: Migrating to Anthropic Node SDK (ticket 2.15), streaming.

Steps (Guide me through ONE at a time. No code generation):
1. Pure Validator: Guide me to write a lightweight validation function for the required team history fields.
2. AI Service Encapsulation: Guide me in updating `aiSummaryService.js` to handle prompt assembly, validation, and versioned caching.
3. HTTP Status Codes: Guide me in mapping validation and provider failures to discrete HTTP responses (503, 502, 422).
4. Frontend Client: Guide me in updating `genAIHandler.ts` to consume the simplified endpoint.
5. Safe UI: Guide me to build the disclaimer badges and fallback cards in `TeamHistoryCard.tsx`.

Validation Criteria:
- cd api && pnpm test passes with validator tests.
- Missing ANTHROPIC_API_KEY gracefully returns 503 without process crash.
- Stale/broken responses fail closed.
```
## 2.13 Frontend coverage and release readiness

- [ ] **Owner:** Either | **Depends on:** 2.1 through 2.12

Set up a lightweight frontend test harness using Vitest and React Testing Library[cite: 2]. Cover pure helper utilities (especially scheduleFilterHelper.ts and seasonHelper.ts) and critical context projection logic

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Teach me how to configure Vitest with Vite, design minimal test cases, and test assertions. Let me write the test files.
- Review my tests for boundary conditions, speed, and isolation.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Tech Stack: Vitest, @testing-library/react, jsdom.
- Target Test Files:
  - @/features/schedule/utils/scheduleFilterHelper.test.ts
  - @/features/season/utils/seasonHelper.test.ts
  - @/features/standings/utils/leagueStandingsHelper.test.ts

Invariants:
- Isolation: Test pure in-memory logic. Never mock network layers inside pure unit tests.
- Performance: Complete suite must execute in under 3 seconds.
- Anti-Overengineering: Native Vitest assertions and simple fixtures. No Cypress, Playwright, or MSW.

Scope Boundaries:
- In Scope: Vitest + jsdom configuration, helper unit tests for filters, season validation, and lottery odds.
- Out of Scope: E2E browser flows, visual regression testing.

Steps (Guide me through ONE at a time. No code generation):
1. Test Configuration: Guide me to configure `vite.config.ts` and `package.json` test scripts for Vitest and jsdom.
2. Season Tests: Guide me in testing `isValidSeasonId`, `getCurrentSeasonId`, and local date string parsing.
3. Filter Tests: Guide me in structuring test fixtures for `filterGames()` across combinations of filters.
4. Standings Tests: Guide me in asserting rank derivations and lottery odds calculations against fixture data.

Validation Criteria:
- cd react && pnpm test passes cleanly.
- Tests accurately catch boundary errors without environment leaks.
```
## 2.14 Query-backed frontend data flows

- [ ] **Owner:** Either | **Depends on:** 2.4, 2.5, 2.7, 2.10

Expose read queries against the normalized Postgres domain tables (schedule_games, player_season_stats, standings) to bypass heavy full-season client downloads for filtered views, while strictly maintaining the Feghhi 3-pattern architecture

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Guide me through SQL parameterization, Feghhi layer boundaries, and fallback mechanics. Let me write the code.
- Review my SQL queries and DI container registrations.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Tech Stack: Node.js, Express, Postgres (platform/pool.js), Node native test runner.
- Architecture: Feghhi 3-Pattern:
  - Presentation (#presentation/routes/) -> thin controllers.
  - Slices (#slices/) -> Service + Repository + Mappers.
  - Composition Root (#composition/container.js).

Invariants:
- Feghhi Invariant: Zero SQL queries in routes or services. SQL belongs exclusively in *Repository.js files[cite: 1].
- Constructor DI: Inject repositories into services, and services into routers via container.js[cite: 1].
- Fallback Safety: Unpopulated DB queries must smoothly fall back to the raw cache pipeline without throwing 500s.
- Anti-Overengineering: Parameterized raw SQL with existing pool.js. No ORM.

Scope Boundaries:
- In Scope: Read queries for schedule ranges/standings in Postgres, repository methods, thin route queries.
- Out of Scope: Altering cache TTLs, UI modifications, schema changes.

Steps (Guide me through ONE at a time. No code generation):
1. Repository Queries: Guide me in writing parameterized SQL read queries in `scheduleRepository.js` and `standingsRepository.js`.
2. Service Integration: Guide me in wiring service methods that try the repository and fall back to `GetOrFetch`.
3. Route Parameters: Guide me in extracting query params in presentation routes and calling the service.
4. Composition Root: Guide me to verify DI wiring in `container.js`.
5. Unit Tests: Guide me in adding route and repository test cases in `api/src/test/`.

Validation Criteria:
- cd api && pnpm test passes.
- All SQL uses parameter binding ($1, $2) to prevent injection.
- Response payloads match established contract shapes[cite: 1].
```
## 2.15 Replace the Python AI subprocess with the Anthropic Node SDK

- [ ] **Owner:** Either | **Depends on:** 2.12

Replace the Python subprocess execution (hockey-ai.py) with direct calls to @anthropic-ai/sdk in Node.js, removing Python and venv dependencies from production

**Implementation prompt:**
```text
Role: Senior Staff Engineer acting as an interactive mentor.
Teaching Protocol:
- DO NOT write implementation code, classes, components, or complete functions.
- Walk me through the SDK client setup, error wrapping, and process cleanup conceptually. Let me write the code.
- Review my implementation for correct timeout configuration and error mapping.
- Execute ONE step at a time. Pause for my input before continuing.

Context:
- Refer to @docs/architecture.md.
- Primary Source Files:
  - Backend: #slices/aiSummaries/aiSummaryService.js, #composition/container.js
  - Target files to delete: api/src/platform/hockey-ai.py, api/src/platform/aiRunner.js

Invariants:
- Contract Preservation: HTTP contracts, cache keys, and validator behavior from 2.12 remain 100% identical.
- Explicit Timeouts: Set a 30-second timeout on the SDK call.
- Clean Removal: Eliminate child_process execution, python3 references, and venv prerequisites.
- Anti-Overengineering: Direct client.messages.create() call. No agent frameworks or streaming wrappers.

Scope Boundaries:
- In Scope: Integrating @anthropic-ai/sdk into aiSummaryService.js, removing Python files, updating DI container.
- Out of Scope: Prompt tuning, changing Claude model parameters, UI changes.

Steps (Guide me through ONE at a time. No code generation):
1. SDK Dependency: Guide me in adding @anthropic-ai/sdk to `api/package.json`.
2. Client Adapter: Guide me in creating a focused client wrapper handling timeout and authentication.
3. Service Integration: Guide me in swapping `aiRunner.js` for the SDK caller while preserving validation and caching.
4. Container Cleanup: Guide me in removing Python references from `container.js` and deleting legacy scripts.
5. Testing: Guide me in updating test mocks in `routes.test.js` to simulate the SDK client.

Validation Criteria:
- cd api && pnpm test passes with mocked SDK tests.
- Express backend boots and runs with zero Python / venv dependencies.
```