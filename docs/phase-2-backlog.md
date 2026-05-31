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

- [ ] **Owner:** Either | **Depends on:** 2.1

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

- [ ] **Owner:** Either | **Depends on:** 2.2

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

## 2.4 Schedule search, filters, and team calendar

- [ ] **Owner:** Either | **Depends on:** 2.3

Upgrade the schedule page from a date picker into a practical browsing tool with team, status, game type, and date range filters.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp schedule features. Read SchedulePage, ScheduleContext, ApiHandler, and api/routes/schedule.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Improve schedule discovery and add a team-focused calendar experience.

Things to implement:
- Add filters for team, game state, date range, and regular season/playoffs where data exists
- Support direct links to filtered schedules through URL query params
- Add grouped schedule sections by date
- Add compact game cards with team logos, scores, start time, venue if available, and game status
- Keep completed games linked to /game/:gameId
- Reuse cached backend schedule data instead of refetching per filter change
```

## 2.5 Enhanced game detail pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.4

Make game detail pages useful before, during, and after games by separating preview, live, and final states.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp game details. Read GameDetailPage and api/routes/schedule.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add state-aware game detail views for preview, live, and final games.

Things to implement:
- Detect game state from NHL landing and boxscore responses
- For future games, show matchup preview, probable metadata if available, season records, and team links
- For live games, show current period/time, score by period, and refresh behavior that is conservative with the NHL API
- For final games, show scoring summary, team totals, goalie results, and top skaters if available
- Add loading, error, and partial-data states for each section
- Avoid assuming every game has the same boxscore fields
```

## 2.6 Team page depth: roster, schedule, leaders, and history

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.3, 2.4

Turn team pages into richer hubs that combine roster, schedule, standings context, stat leaders, and cached team background data.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp team pages. Read TeamPage, team routes, Team models, and GenAIHandler.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Expand TeamPage into a complete team hub.

Things to implement:
- Add tabbed sections for Overview, Roster, Schedule, Skaters, Goalies, and History
- Show team record, division/conference rank, recent games, and next games on the overview
- Add roster grouping by forwards, defensemen, and goalies if position data supports it
- Add sortable skater and goalie stat tables scoped to the selected team and season
- Keep AI-generated history clearly separated from official NHL stats data
- Cache and reuse team-level calls already available from global contexts where possible
```

## 2.7 Player profile pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.6

Add dedicated player pages so stat leader, roster, and game-detail names can link to one place for season stats and player context.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp player data. Read api/routes/player.js and current player stat models.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add /player/:playerId pages and supporting backend/frontend calls.

Things to implement:
- Add React route for player profile pages
- Add backend route for player landing or summary data if a suitable NHL endpoint exists
- Link player names from stat leaders, team rosters, and game detail sections
- Show current team, position, sweater number, season stat summary, and recent game log if available
- Support skater and goalie layouts separately
- Add robust missing-data states because player endpoint coverage may vary
```

## 2.8 Favorites and personalized dashboard

- [ ] **Owner:** Either | **Depends on:** 2.4, 2.6, 2.7

Let users mark favorite teams and players, then make the landing page reflect the games, standings, and leaders they care about most.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp personalization. Keep this local-first; no auth or database yet.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add local favorites for teams and players and surface them on the landing page.

Things to implement:
- Store favorite team triCodes and player IDs in localStorage
- Add favorite toggles on TeamPage and PlayerProfilePage
- Add a personalized landing page section for favorite team next games, recent results, standings position, and favorite player stat snippets
- Keep default landing page useful when no favorites exist
- Add clear empty and unavailable-data states
- Avoid introducing user accounts until a later phase
```

## 2.9 Advanced standings and playoff race views

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.8

Expand standings beyond conference/division tables with wildcard, points percentage, streaks, clinching context, and favorite-team highlighting.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp standings. Read StandingsPage, StandingsContext, and api/routes/standings.js.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add deeper standings views for playoff race analysis.

Things to implement:
- Add wildcard and league-wide table modes if the NHL standings response has enough data
- Add sorting by points, points percentage, wins, regulation wins, goal differential, and streak
- Highlight favorite teams from local favorites
- Show clinching indicators with normalized labels from the backend
- Add explanatory tooltips only where abbreviations are unclear
- Preserve the existing conference and division views
```

## 2.10 Search across teams, players, and games

- [ ] **Owner:** Either | **Depends on:** 2.6, 2.7

Add global search so users can jump directly to teams, players, and recent or upcoming games.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp navigation. Read app routing, team local data, player summaries, and schedule context.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add global search to the app shell.

Things to implement:
- Search teams by city, name, abbreviation, and triCode
- Search players from loaded stat leader, roster, and summary data
- Search games by team matchup and date where schedule data is loaded
- Add keyboard-friendly results with links to /team/:teamId, /player/:playerId, and /game/:gameId
- Keep search fast by indexing data already loaded in contexts
- Add fallback messaging when a result type has not been loaded yet
```

## 2.11 AI history hardening and source separation

- [ ] **Owner:** Either | **Depends on:** 2.6

Make the AI-backed team history feature safer, more predictable, and visibly separate from official NHL API data.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp AI integration. Read GenAIHandler, TeamPage, POST /python-service in api/app.js, and api/routes/hockey-ai.py.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Harden the AI-backed team history workflow.

Things to implement:
- Validate AI JSON against an expected schema before rendering
- Add graceful fallback content when ANTHROPIC_API_KEY is missing or the AI response is malformed
- Store AI cache keys by team and requested schema version
- Add a visible label that team history is AI-generated and may need verification
- Keep official stats, standings, rosters, and schedule data separate from AI-generated content
- Consider replacing highly factual fields with local verified data if available
```

## 2.12 Test coverage and release readiness

- [ ] **Owner:** Either | **Depends on:** 2.1 through 2.11

Add targeted automated checks around the highest-risk data flows before expanding the app further.

**Implementation prompt:**

```text
Working on HockeyStatsWebApp quality and release readiness. Inspect frontend and backend package.json files first.

Working style: junior dev learning. Walk me through it conceptually first. I'll write the code.

Task: Add focused tests and release checks for Phase 2 features.

Things to implement:
- Backend route tests for health, schedule, standings, team, and player routes with mocked NHL API clients
- Unit tests for seasonHelper and cacheManager behavior
- Frontend tests for key helpers that normalize NHL API responses into app models
- Smoke tests for LandingPage, SchedulePage, TeamPage, PlayerProfilePage, and GameDetailPage
- Add npm scripts for backend test, frontend test, lint, and a combined verification command if missing
- Document the local verification workflow in README.md or docs
```
