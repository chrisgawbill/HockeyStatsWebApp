# Phase 2 Backlog

Future feature roadmap for the HockeyStatsWebApp. Items are ordered so shared backend/frontend foundations come before user-facing workflows that depend on them.

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

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.3

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

## 2.5 Schedule search, filters, and team calendar

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.4

Upgrade the existing season-aware schedule page into a practical discovery tool. The page already loads a full season through `ScheduleContext`, supports `?season=`, `?date=`, and `?view=day|week|month`, and renders day cards plus week/month calendar chips. This ticket should add filters and team-focused schedule views on top of that client-side data instead of creating new fetches for every filter change.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp schedule features. Read docs/architecture.md, docs/phase-2-progress.md section 2.3, SchedulePage, ScheduleContext, ScheduleHelper, GameStatusHelper, ScheduleCalendar, GameChip, ApiHandler, and api/routes/schedule.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add schedule filters and team-focused calendar browsing without changing the season-fetch model.

Things to implement:
- Add filters for team, game status, game type, venue text if available, and date range over the already-loaded season games
- Encode filter state in URL query params while preserving existing season/date/view params
- Keep day/week/month as projections of the same filtered game array; do not add API calls for filter changes
- Add a team-focused calendar mode or team filter shortcut that can deep-link to one team's schedule for the selected season
- Reuse existing ScheduleCard, ScheduleCalendar, GameChip, EmptyState, SeasonSelector, and GameStatusHelper where they fit
- Keep completed games linked to /game/:gameId and preserve route-state fields used for navigation context
- Add empty states that distinguish "no games for this filter" from "season has no games"
- Verify date parsing stays local-time aware and filter params survive refresh/back/forward navigation
```

## 2.6 Enhanced game detail pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.5

Make game detail pages useful before, during, and after games by separating preview, live, and final states. The current backend still passes game landing and boxscore responses through raw, while schedule list data is normalized. This ticket should either keep detail-specific raw handling isolated in the page or introduce backend mappers for repeated detail shapes if the UI starts depending on them heavily.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp game details. Read docs/architecture.md, GameDetailPage, HeroScoreboard, existing game-detail components, ScheduleContext navigation behavior, ApiHandler, api/routes/schedule.js, and api/services/mappers/scheduleMapper.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add state-aware game detail views for preview, live, and final games.

Things to implement:
- Detect preview/live/final states using NHL landing/boxscore fields plus the normalized schedule contract where available
- For future games, show matchup preview, venue/start time, team links, season records if available, and a useful "data not yet available" state for boxscore-only sections
- For live games, show current period/time, score by period, conservative refresh behavior, and clear partial-data handling
- For final games, show scoring summary, period/team totals, goalie results, and top skaters when the NHL response includes them
- Keep all raw NHL detail parsing in one helper or mapper layer; do not scatter optional-field chains across multiple components
- Preserve existing /game/:gameId routing and route-state back-navigation behavior from schedule/team contexts
- Add loading, error, and section-level unavailable states so one missing block does not blank the whole page
- Verify with examples for future, live/in-progress if available, and final games from the selected season
```

## 2.7 Team page depth: roster, schedule, leaders, and history

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.3, 2.5

Turn team pages into richer hubs that combine season-aware roster, schedule, standings context, stat leaders, and cached team background data. Team routes already accept `?season=`, roster and schedule responses are normalized, and `TeamPage` still owns some display shaping inline. This ticket should extract repeated display transforms while keeping official NHL data visibly separate from AI-generated history.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp team pages. Read docs/architecture.md, TeamPage, team routes, player routes, SeasonContext, StandingsContext, ScheduleContext, Team models, roster/player mappers, GenAIHandler, and the AI Integration section of the docs.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Expand TeamPage into a complete team hub.

Things to implement:
- Add tabbed sections for Overview, Roster, Schedule, Skaters, Goalies, and History while preserving the existing SeasonSelector behavior
- Show record, division/conference rank, recent games, next games, and links back into filtered schedule views for the selected season
- Move repeated TeamPage-only display transforms into helpers when that makes the page easier to read
- Group roster by forwards, defensemen, and goalies using the normalized roster contract position code
- Add sortable skater and goalie stat tables scoped to the selected team and season; merge Corsi by playerId only where that raw endpoint already supports it
- Reuse StandingsContext/ScheduleContext data when already loaded instead of duplicating requests
- Keep AI-generated history in a clearly labeled History tab/section, separate from official stats, standings, roster, and schedule data
- Add empty/error states for teams or seasons where roster, stats, schedule, or AI history are unavailable
```

## 2.8 Player profile pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.7

Add dedicated player pages so stat leader, roster, team stats, and game-detail names can link to one place for season stats and player context. Existing skater/goalie summaries and stat leaders are normalized, but player landing/profile endpoints may need new backend support and careful missing-data handling.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp player data. Read docs/architecture.md, api/routes/player.js, playerMapper, ApiHandler, App routing, current player stat models, TeamPage stat/roster rendering, stat leader components, and GameDetailPage.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add /player/:playerId pages and supporting backend/frontend calls.

Things to implement:
- Add a HashRouter route for /player/:playerId and a PlayerProfilePage that reads the shared selected season
- Add backend route(s) for player landing/profile/game-log data only after identifying stable NHL endpoints; apply validateSeason where the response varies by season
- Normalize any new repeated player response shape in api/services/mappers instead of parsing raw NHL objects in several React components
- Link player names from stat leaders, team rosters, team skater/goalie tables, and game detail sections
- Show current team, position, sweater number, season stat summary, recent game log if available, and links back to team/game pages
- Support skater and goalie layouts separately and avoid showing skater-only fields for goalies
- Add robust loading, not-found, and partial-data states because player endpoint coverage varies by era and player type
- Preserve route-state navigation context when linking from schedule, team, standings, or game detail views
```

## 2.9 Favorites and personalized dashboard

- [ ] **Owner:** Either | **Depends on:** 2.5, 2.7, 2.8

Let users mark favorite teams and players, then make the landing page reflect the games, standings, and leaders they care about most for the selected season. This remains local-first with no accounts or database; it should compose with existing global contexts and the season-aware landing page instead of adding a separate data pipeline.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp personalization. Read docs/architecture.md, LandingPage, TeamPage, PlayerProfilePage from ticket 2.8, SeasonContext, ScheduleContext, StandingsContext, stat leader hooks, and local team data. Keep this local-first; no auth or database yet.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add local favorites for teams and players and surface them on the landing page.

Things to implement:
- Add a FavoritesContext or small hook backed by localStorage for favorite team triCodes/team IDs and player IDs
- Add accessible favorite toggles on TeamPage and PlayerProfilePage, plus optional compact toggles where teams/players appear repeatedly
- Add a personalized landing section for favorite team next games, recent results, standings position, and favorite player stat snippets for the selected season
- Derive favorites dashboard data from ScheduleContext, StandingsContext, stat leader hooks, and loaded player/team data where possible
- Keep the default landing page useful when no favorites exist
- Add clear empty, unavailable, and "data not loaded for this season" states
- Avoid introducing user accounts, backend persistence, or new database dependencies in this phase
- Verify favorites survive refresh and do not break if a saved team/player is no longer present in loaded data
```

## 2.10 Advanced standings and playoff race views

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.9

Expand standings beyond conference/division tables with wildcard, league-wide, points percentage, streaks, clinching context, and favorite-team highlighting. Standings are already season-aware through `StandingsContext`, and the backend mapper normalizes `clinchingIndicator`, so this ticket should focus on derived views and presentation rather than raw NHL field parsing.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp standings. Read docs/architecture.md, StandingsPage, StandingsContext, LeagueStandingsHelper, standingsMapper, SeasonContext, FavoritesContext from ticket 2.9, and api/routes/standings.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add deeper standings views for playoff race analysis.

Things to implement:
- Add wildcard and league-wide table modes using the existing normalized StandingsTeam data
- Add sorting by points, points percentage, wins, regulation wins, goal differential, games played/remaining if available, and streak
- Highlight favorite teams from local favorites without changing the underlying standings sort
- Show clinching indicators with normalized labels from the backend; add frontend label mapping only for presentation
- Preserve existing conference and division views and keep the SeasonSelector behavior unchanged
- Add explanatory tooltips only where abbreviations or playoff rules are unclear
- Keep draft-lottery odds logic in LeagueStandingsHelper unless a backend contract is intentionally added later
- Add empty states for seasons where standings data is unavailable or the selected view cannot be derived
```

## 2.11 Search across teams, players, and games

- [ ] **Owner:** Either | **Depends on:** 2.7, 2.8

Add global search so users can jump directly to teams, players, and recent or upcoming games. Search should index data already loaded by contexts and pages wherever possible, respect the selected season for game/player results, and use the existing HashRouter routes.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp navigation. Read docs/architecture.md, App routing, PageHeader, team local data, SeasonContext, ScheduleContext, StandingsContext, player summaries/stat leader hooks, TeamPage, PlayerProfilePage, and route-state navigation conventions.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add global search to the app shell.

Things to implement:
- Add a search entry point in the app shell/PageHeader that works on desktop and mobile
- Search teams by city, name, abbreviation, triCode, and common display names from local team data
- Search players from loaded stat leaders, team rosters/stat tables, and player summary data; deduplicate by playerId
- Search games by team matchup, team abbreviation/name, date, gameId, and venue where the selected season schedule is loaded
- Add keyboard-friendly results with links to /team/:teamId, /player/:playerId, and /game/:gameId
- Preserve route-state fields when linking so back-navigation context remains useful
- Keep search fast by indexing loaded context data with memoized helpers instead of calling the backend on every keystroke
- Add fallback messaging when a result type has not been loaded yet or no results match
```

## 2.12 AI history hardening and source separation

- [ ] **Owner:** Either | **Depends on:** 2.7

Make the AI-backed team history feature safer, more predictable, and visibly separate from official NHL API data. The current flow goes `TeamPage -> GenAIHandler -> POST /python-service -> hockey-ai.py -> Anthropic`, caches long-lived responses, and expects parseable JSON. This ticket should reduce the chance of malformed or stale AI content being presented as official data.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp AI integration. Read docs/architecture.md AI Integration and Diagnostics sections, GenAIHandler, TeamPage History UI from ticket 2.7, POST /python-service in api/app.js, api/routes/hockey-ai.py, cacheManager, and health diagnostics.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Harden the AI-backed team history workflow.

Things to implement:
- Define an explicit team-history schema version and validate AI JSON against that expected shape before rendering
- Make the prompt request only the fields the UI renders, with strict JSON instructions and no markdown wrapper
- Add graceful frontend and backend fallback states when ANTHROPIC_API_KEY is missing, Python fails, the provider errors, or the AI response is malformed
- Store AI cache keys by team, schema version, and prompt version so bad old responses can be bypassed without clearing all AI cache
- Add a visible label that team history is AI-generated and may require verification
- Keep official stats, standings, rosters, and schedule data visually and structurally separate from AI-generated content
- Move highly factual static fields to local verified data when available; leave generated prose/history in the AI section
- Ensure diagnostics continue to report only whether the key is configured, never the key value
```

## 2.13 Frontend coverage and release readiness

- [ ] **Owner:** Either | **Depends on:** 2.1 through 2.12

Add frontend-focused automated checks and release verification after the Phase 2 feature work has settled. Backend contract and season coverage starts in 2.4; this ticket should fill the remaining gaps around URL-backed frontend state, page smoke coverage, and the local release workflow.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp frontend quality and release readiness. Read docs/architecture.md, docs/phase-2-progress.md, frontend/backend package.json files, ApiHandler, SeasonContext, SchedulePage, TeamPage, PlayerProfilePage, GameDetailPage, DiagnosticsPage, and the backend tests added in ticket 2.4.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add frontend smoke/helper tests and final release checks for Phase 2 features.

Things to implement:
- Frontend tests for URL-backed SeasonContext behavior, ApiHandler withParams query construction, ScheduleHelper/GameStatusHelper, and EmptyState usage
- Smoke tests for LandingPage, SchedulePage day/week/month views with filters, TeamPage, PlayerProfilePage, GameDetailPage, and DiagnosticsPage passphrase flow
- Confirm backend tests from 2.4 are wired into the combined verification workflow
- Add or refine npm scripts for frontend test, backend test, lint/typecheck, and a combined verification command if missing
- Document the local verification workflow in README.md or docs, including required env vars and what can run without NHL/API/AI network access
- Keep tests focused on contracts and user-visible behavior; avoid brittle snapshots of large NHL payloads
```

## 2.14 Query-backed frontend data flows

- [ ] **Owner:** Either | **Depends on:** 2.4, 2.5, 2.7, 2.10

Move high-volume frontend filtering and slicing onto backend query endpoints once the normalized Postgres tables are populated reliably. The frontend should still own presentation-only projections, but season/team/date/status/stat filters that can be answered directly by SQL should not require downloading broad datasets and manually filtering them in React.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp query-backed data flows. Read docs/architecture.md, api/db/repositories, api/services/domain, api/routes, ScheduleContext, StandingsContext, TeamPage, TeamList, SchedulePage, and the frontend helpers that filter loaded season data.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Convert frontend workflows that manually filter broad cached datasets into backend query-backed API calls over the normalized database tables.

Things to implement:
- Identify the frontend filters that currently slice large season/team datasets in React, especially schedule filters, team list filters, standings views, and team-page stat/roster tables
- Add focused read repositories and route endpoints that query normalized tables with parameterized SQL for season, team, date range, game status/type, standings scope, stat category, and pagination/limit inputs
- Keep existing raw-cache/NHL fetch paths as fallback behavior when the database is unavailable or not yet populated
- Update ApiHandler and the relevant contexts/hooks to call query endpoints when filters change instead of fetching a broad season payload and manually filtering it
- Preserve URL-backed state for season, date, view, and filter params; view/layout choices should remain frontend presentation state
- Keep app-only display calculations on the frontend unless they are needed for efficient filtering or sorting
- Add backend tests for query parameter validation and SQL result mapping, plus frontend tests for query construction and fallback behavior
- Document which workflows are DB-query-backed and which still intentionally use client-side projections
```
