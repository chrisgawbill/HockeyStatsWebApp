# Phase 2 Backlog

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

## 2.5 Schedule filters, team calendar, and global search

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.4

Upgrade the existing season-aware schedule page into a practical discovery tool, and add app-wide search for teams and games in the same pass. The schedule page already loads a full season through `ScheduleContext`, supports `?season=`, `?date=`, and `?view=day|week|month`, and renders day cards plus week/month calendar chips. This ticket should add filters and team-focused schedule views on top of that client-side data instead of creating new fetches for every filter change.

This ticket absorbs the former ticket 2.11 (global search): schedule filtering and global search share the same patterns (URL-backed state, memoized indexes over already-loaded context data), and `TeamList` already implements team search locally. Player search results are deferred to ticket 2.8, which owns player pages and player linking.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Frontend Architecture", "Season Selection", "Developer Conventions"
2. docs/phase-2-progress.md — section 2.3 (how the schedule views were built and why)
3. react/src/Pages/SchedulePage.tsx and react/src/Data/Context/ScheduleContext.tsx
4. react/src/Data/Helpers/ScheduleHelper.ts and react/src/Data/Helpers/GameStatusHelper.ts
5. react/src/Components/SchedulePage/ (ScheduleCard, ScheduleCalendar, GameChip, DatePicker)
6. react/src/Components/PageHeader.tsx and react/src/Pages/TeamList.tsx (existing search/filter UI to stay stylistically consistent with)
7. react/src/Data/LocalData/TeamListData.ts and react/src/Data/Models/ScheduledGame.ts

TASK: Add client-side schedule filters, a team-focused calendar shortcut, and a global team/game search entry point. Zero new backend endpoints; zero new fetches on filter change — everything is a projection of the season array ScheduleContext already loads.

STEPS (pause after each):
1. Design the filter state with me: team (triCode), game status (upcoming / final), game type (regular vs playoff via ScheduledGame.isPlayoff), and date range. Each filter is a URL query param on /schedule (e.g. ?team=COL&status=final), living alongside the existing season/date/view params.
2. Write a pure helper (new file, e.g. react/src/Data/Helpers/ScheduleFilterHelper.ts) that takes ScheduledGame[] + a filter object and returns the filtered array. No React imports — it must be unit-testable in isolation (ticket 2.13 will test it).
3. Wire filter controls into SchedulePage above the existing views. Day, week, and month views must all render projections of the SAME filtered array.
4. Team shortcut: selecting a team filters the calendar to that team's games and is deep-linkable via ?team=.
5. Global search entry point in PageHeader (desktop + mobile). Index teams from localTeamList (match city, name, fullName, triCode; case-insensitive) and games from the loaded season (match by team abbrev/matchup and date string). Build indexes with useMemo over context data — never call the backend per keystroke.
6. Keyboard-friendly results (arrow keys + Enter) linking to /team/:triCode and /game/:gameId. Game links only for completed games (gameState "OFF" or "FINAL" — see isGameCompleted in SchedulePage.tsx).
7. Empty states via the shared EmptyState component, distinguishing "no games match this filter" from "season has no games". Search shows "still loading" messaging while ScheduleContext is loading.

INVARIANTS (do not violate — these are established project rules):
- Only ?season= triggers a re-fetch. date, view, filters, and search are all client-side.
- Parse date strings with parseLocalDate and format with formatDateParam from ScheduleHelper.ts. Never new Date("YYYY-MM-DD") — it parses as UTC and shifts a day locally.
- When setting one query param, preserve the rest: use the setSearchParams(prev => ...) pattern already used in SchedulePage.tsx.
- Navigation to /game/:gameId passes route-state fields sourcePath, fallbackPath, activeNavPath (copy goToGameDetails in SchedulePage.tsx).
- Styling: CSS modules under react/src/style/; reuse EmptyState, SeasonSelector, SlidingToggle, GameChip before inventing new components.

OUT OF SCOPE: player search (ticket 2.8 extends this search), backend query endpoints (ticket 2.14), any change under api/.

DONE WHEN:
- cd react && npx tsc --noEmit passes and pnpm build succeeds.
- Manual checks pass: filters survive refresh and back/forward; changing a filter fires no network request (devtools Network tab); day/week/month agree on the same filtered data; search finds a team by "Avalanche", "Colorado", and "COL", and a game by date; empty states appear for an impossible filter combo.
- I have updated docs/phase-2-progress.md section 2.5 and ticked this box in docs/phase-2-backlog.md.
```

## 2.6 Enhanced game detail pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.5

Make game detail pages useful before, during, and after games by separating preview, live, and final states. The current backend still passes game landing and boxscore responses through raw, while schedule list data is normalized. This ticket should either keep detail-specific raw handling isolated in the page or introduce backend mappers for repeated detail shapes if the UI starts depending on them heavily.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Backend Route Modules" (the two gamecenter passthrough routes), "Backend Response Contracts", "Page Responsibilities"
2. react/src/Pages/GameDetailPage.tsx (note getPeriodScores and computeTeamTotals defined at the top) and react/src/Data/Models/GameDetail.ts
3. react/src/Components/GameDetail/ (HeroScoreboard, PeriodScoresTable, ScoringSummary, TeamComparison, ThreeStars, PlayerStatsSelection)
4. react/src/Services/ApiHandler.ts (GetGameDetails, GetGameLanding) and api/routes/schedule.js (both gamecenter routes are raw passthroughs with a 5-minute cache TTL)
5. react/src/Data/Helpers/GameStatusHelper.ts

TASK: Make /game/:gameId state-aware — a matchup preview for future games, a live view for in-progress games, and the existing (hardened) detail view for finals.

STEPS (pause after each):
1. Map gameState values to the three UI states with me before coding. Known: FUT/PRE = future (the page already checks these), OFF/FINAL = complete; everything else (LIVE, CRIT, ...) = live. Verify by curling the backend for a real future game and a real final game (GET http://localhost:9000/schedule/:gameID) and reading the actual payloads.
2. Create ONE helper, react/src/Data/Helpers/GameDetailHelper.ts, that owns all raw landing/boxscore field access and returns per-state view models. Move getPeriodScores and computeTeamTotals into it. After this step no component touches raw NHL optional-field chains.
3. Preview state: matchup, venue, start time converted to local (see GameStatusHelper), links to both team pages (with route-state), season records if the landing payload carries them, and a "stats available after puck drop" notice replacing boxscore-only sections.
4. Live state: current period + clock, score by period so far, partial-data handling for stats that fill in as the game runs. Refresh conservatively: one setInterval of at least 60 seconds that re-fetches both payloads and is cleared on unmount. Do not poll faster — the backend caches these payloads for 5 minutes anyway.
5. Final state: keep existing sections; add per-section fallbacks so one missing block (e.g. no threeStars in an old season) never blanks the page.
6. Keep the page-level loading/error states; add section-level "unavailable" states.

INVARIANTS:
- All raw NHL field knowledge lives in GameDetailHelper.ts (or a backend mapper if we agree a shape is reused elsewhere). If we add a backend mapper, map AFTER GetOrFetch — the cache always stores raw payloads.
- /game/:gameId routing and route-state back-navigation (sourcePath/fallbackPath/activeNavPath) unchanged.
- Date/time parsing stays local-time aware.

OUT OF SCOPE: schedule page changes, player profile links (ticket 2.8), any backend change beyond an explicitly agreed game-detail mapper.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass; if api/ was touched, cd api && npm test passes.
- Verified in the browser against a real future game and a real final game. For the live view: verify against a live game if one exists during the session; otherwise verify with a hand-mocked payload and record that in the progress log.
- I have updated docs/phase-2-progress.md section 2.6 and ticked this box.
```

## 2.7 Team page depth: roster, schedule, leaders, and history

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.3, 2.5

Turn team pages into richer hubs that combine season-aware roster, schedule, standings context, stat leaders, and cached team background data. Team routes already accept `?season=`, roster and schedule responses are normalized, and `TeamPage` still owns some display shaping inline. This ticket should extract repeated display transforms while keeping official NHL data visibly separate from AI-generated history.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Page Responsibilities", "Backend Response Contracts", "AI Integration", "Current Maintenance Notes"
2. react/src/Pages/TeamPage.tsx — the whole file; note transformRoster, transformPlayerStats, transformTeamStats, and the two useEffect fetches
3. react/src/Components/TeamPage/ (all components) and react/src/style/TeamPage/TeamPage.module.css
4. react/src/Data/Context/StandingsContext.tsx, ScheduleContext.tsx, SeasonContext.tsx
5. api/routes/team.js and api/routes/player.js — the team-scoped endpoints and which return contracts vs raw passthrough
6. react/src/Services/GenAIHandler.ts
7. docs/cleanup-backlog.md — sections C4 and C5 (both touch TeamPage; see step 0)

TASK: Rebuild TeamPage into a tabbed team hub: Overview, Roster, Schedule, Skaters, Goalies, History.

STEPS (pause after each):
0. Check whether cleanup tickets C4 (moving the real types out of TeamPageMockData.ts) and C5's TeamPage item are already done. If not, do those two things first inside this ticket. The C5 bug matters here: fetchMain reads easternStandingsData/westernStandingsData from StandingsContext, but its effect depends only on [teamId, triCode, season] — a deep-linked visit that lands before standings resolve renders record/ranks as 0 forever. Fix by depending on the standings data (or deriving standings-based fields at render time). More standings UI in this ticket makes that race worse, so it must be fixed first.
1. Add the tab structure, URL-backed (?tab=overview|roster|schedule|skaters|goalies|history) and preserving the season/other params via the setSearchParams(prev => ...) pattern. Default tab: overview.
2. Overview tab: record, division/conference rank, playoff-line delta (logic already in TeamPage), last 5 results + next 5 games, and links into the filtered schedule view from ticket 2.5 (/schedule?team=<triCode>&season=<season>).
3. Roster tab: group by Forwards / Defensemen / Goalies from the RosterContract position codes (POS_MAP already exists). Move the grouping and TOI-formatting helpers out of TeamPage.tsx into react/src/Data/Helpers/TeamPageHelper.ts.
4. Skaters and Goalies tabs: sortable stat tables scoped to the selected team + season, using the existing GetSkaterSummary/GetGoalieSummary/GetSkaterCorsi calls. Merge Corsi by playerId exactly as transformPlayerStats does today; Corsi is intentionally not part of the skater contract.
5. History tab: the AI-fetched content, with a visible "AI-generated — may require verification" label, in its own component, structurally separate from official data. Keep the existing behavior that the AI fetch is per-team, not per-season.
6. Reuse StandingsContext/ScheduleContext data that is already loaded; do not add a duplicate fetch for data a context already holds.
7. Per-tab empty/error states (missing roster for an old season, no AI key configured, etc.). One failed section must never blank the page.

INVARIANTS:
- SeasonSelector behavior unchanged; every season-varying fetch keys off useSeason().
- Official NHL data and AI-generated content never visually or structurally intermixed.
- Outbound links preserve route-state fields (sourcePath, fallbackPath, activeNavPath).
- The frontend consumes backend contracts only. If a new raw NHL field is needed, add it to the backend mapper + contract (mapping AFTER GetOrFetch), then consume it — never parse raw NHL JSON in a component.

OUT OF SCOPE: player profile pages and player-name links (ticket 2.8), AI schema/versioning hardening (ticket 2.12).

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass; cd api && npm test passes if api/ was touched.
- Deep-link test passes: open /#/team/COL?season=<a past season> in a fresh tab (no prior navigation) — every tab renders correct data and ranks are non-zero once standings load (this is the C5 regression check).
- Tab, season, and other URL params survive refresh and back/forward together.
- I have updated docs/phase-2-progress.md section 2.7 and ticked this box.
```

## 2.8 Player profile pages

- [ ] **Owner:** Either | **Depends on:** 2.2, 2.7

Add dedicated player pages so stat leader, roster, team stats, and game-detail names can link to one place for season stats and player context. Existing skater/goalie summaries and stat leaders are normalized, but player landing/profile endpoints may need new backend support and careful missing-data handling.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Backend Route Modules", "Backend Response Contracts", "Backend Caching", "Season Selection", "Developer Conventions"
2. api/routes/player.js, api/services/mappers/playerMapper.js, api/utils/seasonHelper.js (validateSeason), api/utils/cacheManager.js (GetOrFetch)
3. api/test/mappers.test.js and api/test/routes.test.js — the test patterns to copy for any new backend code
4. react/src/App.tsx (route table), react/src/Services/ApiHandler.ts (withParams pattern)
5. react/src/Pages/TeamPage.tsx (player rows to link), react/src/Components/LandingPage/StatLeaderCard.tsx, react/src/Components/Modals/StatsLeaderModal.tsx, react/src/Components/GameDetail/PlayerStatsSelection.tsx

TASK: Add /player/:playerId profile pages, backed by a new normalized backend endpoint, and link player names to them across the app.

STEPS (pause after each):
1. Backend first. The candidate NHL endpoint is GET /player/{playerId}/landing on the existing axiosNhl client (https://api-web.nhle.com/v1). Curl it for one current skater and one current goalie; write down together which fields exist for each and which are .default-wrapped. Do not design the contract before seeing real payloads.
2. Add GET /player/:playerId to api/routes/player.js. Register it AFTER the existing named routes and constrain the param to digits (router.get('/:playerId(\\d+)', ...)) so it can never shadow /skater/... or /goalie/... paths. The landing payload is career-wide, so this route does NOT need validateSeason; cache with GetOrFetch under key player_landing_${playerId}.
3. Add mapPlayerLanding to api/services/mappers/playerMapper.js producing a PlayerProfileContract (document with a JSDoc @typedef like the existing contracts). Guard every .default unwrap; map AFTER GetOrFetch. Include: id, name, current team (id + triCode), position, sweaterNumber, headshot, whether goalie, and the season-by-season or featured stats the payload provides.
4. Optional second endpoint if the payload's stats are too thin: GET /player/{playerId}/game-log/{season}/2 — this one IS season-varying, so apply validateSeason and put ${seasonId} in the cache key.
5. Backend tests before frontend work: a mapper unit test with a trimmed fixture (skater + goalie + missing-fields cases) and a route test with a mocked NHL client asserting the cache key, copying the patterns in api/test/. Run cd api && npm test.
6. Frontend: add the route in react/src/App.tsx, create PlayerProfilePage, add an ApiHandler function. Skater and goalie layouts are separate — never show skater-only fields (plusMinus, faceoffs) for a goalie.
7. States: loading, not-found (bad id or NHL 404), and partial-data (older players have sparse payloads). The page must render sensibly with only the fields from step 3's contract guaranteed.
8. Link player names from stat leaders, team roster cards, team skater/goalie tables, and game-detail player stats to /player/:playerId, preserving route-state fields.
9. Extend the ticket-2.5 global search with player results: index loaded stat leaders, rosters, and summaries; deduplicate by playerId.

INVARIANTS:
- All NHL-field knowledge in the mapper; the frontend consumes the contract only.
- Cache keys include every response-changing input; map after GetOrFetch.
- New route follows the thin-handler pattern: validate inputs, GetOrFetch, map, res.send, next(e) on error.
- Route-state navigation fields preserved on every new link.

OUT OF SCOPE: favorites (ticket 2.9), AI content on player pages, historical/era-specific player research features.

DONE WHEN:
- cd api && npm test passes (including the new tests); cd react && npx tsc --noEmit and pnpm build pass.
- Manual checks: a skater page, a goalie page, a garbage id (/#/player/999999999 shows not-found, not a crash), and player links work from at least the team page and a stat leader card with back-navigation intact.
- I have updated docs/phase-2-progress.md section 2.8 and ticked this box. If architecture.md's route list is now stale, update it.
```

## 2.9 Favorites and personalized dashboard

- [ ] **Owner:** Either | **Depends on:** 2.5, 2.7, 2.8

Let users mark favorite teams and players, then make the landing page reflect the games, standings, and leaders they care about most for the selected season. This remains local-first with no accounts or database; it should compose with existing global contexts and the season-aware landing page instead of adding a separate data pipeline.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Global Providers" (the index.tsx vs App.tsx provider split and why it exists), "Data Layer"
2. react/src/index.tsx and react/src/App.tsx — where providers live and the rule for which file gets which provider
3. react/src/Data/Context/ — every provider, especially ListOfTeamsContext.tsx (an existing localStorage example, including its pitfalls noted in docs/cleanup-backlog.md C5)
4. react/src/Pages/LandingPage.tsx, TeamPage.tsx, and PlayerProfilePage (from ticket 2.8)
5. react/src/Data/LocalData/TeamListData.ts

TASK: Local-first favorites for teams and players, surfaced as a personalized landing-page section. No accounts, no backend, no new dependencies.

STEPS (pause after each):
1. Create FavoritesContext backed by localStorage under ONE key with a versioned shape: {version: 1, teams: ["COL", ...], players: [{id, name}, ...]}. Storing player name alongside id lets the dashboard label a favorite even when no loaded dataset contains that player. Guard JSON.parse failures and unknown versions by falling back to the empty shape.
2. Decide placement with me: FavoritesContext depends on neither routing nor season, so per the provider-split rule it belongs in index.tsx (with ThemeProvider/ListOfTeamsDataProvider), not App.tsx. Confirm, then wire it.
3. Expose useFavorites() returning { teams, players, toggleTeam, togglePlayer, isFavoriteTeam, isFavoritePlayer }. Write-through to localStorage on every change.
4. Accessible toggle component: a real <button> with aria-pressed and a visible label/tooltip — not a bare clickable icon. Place it on TeamPage (hero area) and PlayerProfilePage.
5. Landing section "My Teams & Players": favorite teams' next game + last result (from ScheduleContext), standings position (from StandingsContext), and favorite player stat snippets from already-loaded leader/summary data. All derivation in useMemo over context data — no new fetch pipeline.
6. States: default landing unchanged when no favorites exist; "no data for this season" per item when the selected season lacks it; a favorite missing from all loaded data renders name-only with a link, never a crash.

INVARIANTS:
- No new dependencies, no api/ changes, no accounts.
- Respect the provider-split rule (routing/season-agnostic providers in index.tsx).
- Season-varying favorite data (next games, standings) must react to useSeason() changes because the underlying contexts re-fetch.
- Styling via CSS modules; reuse EmptyState.

OUT OF SCOPE: backend persistence of favorites, favorite-team highlighting in standings tables (that lands in ticket 2.10), notifications.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual checks: toggle two teams and one player, refresh — they persist; switch to a past season — dashboard shows sensible per-item empty states; hand-edit the localStorage value to garbage ("not json") and reload — the app renders with zero favorites and no crash; keyboard-only toggling works (tab + enter, aria-pressed flips).
- I have updated docs/phase-2-progress.md section 2.9 and ticked this box.
```

## 2.10 Advanced standings and playoff race views

- [ ] **Owner:** Either | **Depends on:** 2.3, 2.9

Expand standings beyond conference/division tables with wildcard, league-wide, points percentage, streaks, clinching context, and favorite-team highlighting. Standings are already season-aware through `StandingsContext`, and the backend mapper normalizes `clinchingIndicator`, so this ticket should focus on derived views and presentation rather than raw NHL field parsing.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "Backend Response Contracts" (standingsMapper scope rules), "Season Selection"
2. api/services/mappers/standingsMapper.js — the exact StandingsTeamContract field list (it already includes wildcardSequence)
3. react/src/Data/Helpers/LeagueStandingsHelper.ts and react/src/Data/Models/StandingsTeam.ts — what the frontend model keeps vs drops
4. react/src/Pages/StandingsPage.tsx and react/src/Components/LandingPage/LandingPageStandings/ (tables, SlidingToggle, ClinchStatus.ts, StandingsClinchLegend)
5. react/src/Data/Context/StandingsContext.tsx (how standings are pre-split by conference/division)
6. FavoritesContext from ticket 2.9

TASK: Add wildcard and league-wide standings views, sortable columns, and favorite-team highlighting for playoff-race analysis.

STEPS (pause after each):
1. Gap analysis first: list which sort columns the current contract/model can already serve (points, pointPctg, wins) and which need new fields (regulation wins, goal differential, streak, games played — check a raw NHL /standings/now response for the actual field names, e.g. via curl). Present me the list before any code.
2. For each missing field we agree to add: extend StandingsTeamContract in api/services/mappers/standingsMapper.js (shape extraction only, defensive fallbacks), add a mapper unit test in api/test/mappers.test.js, then thread the field through StandingsTeam.ts. Remember: mapping happens AFTER GetOrFetch, so no cache clearing is needed.
3. Add view modes to StandingsPage via SlidingToggle + a URL param (?mode=conference|division|wildcard|league), preserving season and other params. Conference and division views must remain pixel-identical to today.
4. Wildcard view: derive from divisionSequence (top 3 per division qualify) plus wildcardSequence for the rest, per conference. Put the derivation in a helper file (LeagueStandingsHelper.ts or a sibling), not in the component, so 2.13 can unit test it.
5. Sortable column headers: stable sort, a visible active-column + direction indicator, default sort preserved per view. Sorting is display-only state (not URL-backed unless we decide otherwise together).
6. Favorite-team highlighting from useFavorites(): a CSS-module class on the row. It must never reorder or filter rows.
7. Clinch indicators: use the backend-normalized clinchingIndicator with the existing ClinchStatus.ts labels; add tooltips only where an abbreviation is genuinely unclear (x/y/p/z).
8. Empty states for seasons with no standings data and for views that cannot be derived from the available fields.

INVARIANTS:
- Shape extraction backend, derivation/display frontend — draft-lottery odds stay in LeagueStandingsHelper.ts.
- SeasonSelector behavior and the existing conference/division views unchanged.
- URL param changes preserve the other params (setSearchParams(prev => ...) pattern).

OUT OF SCOPE: playoff bracket/simulation features, changes to the landing-page standings widget beyond what falls out of shared components, backend query endpoints.

DONE WHEN:
- cd api && npm test passes (with the new mapper tests); cd react && npx tsc --noEmit and pnpm build pass.
- Manual checks: all four modes render for the current season and a past season; sorting is stable and correct against nhl.com for one column; a favorited team is highlighted in every mode; mode survives refresh/back/forward alongside season.
- I have updated docs/phase-2-progress.md section 2.10 and ticked this box. Update architecture.md's StandingsTeamContract notes if fields were added.
```

## 2.11 Search across teams, players, and games

- **Merged** — team and game search moved into [2.5](#25-schedule-filters-team-calendar-and-global-search) (they share URL-backed state and memoized client-side indexing with the schedule filters, and team search already exists on `TeamList`); player search results moved into [2.8](#28-player-profile-pages), which owns player pages and player linking. The number is kept so existing references stay valid.

## 2.12 AI history hardening and source separation

- [ ] **Owner:** Either | **Depends on:** 2.7

Make the AI-backed team history feature safer, more predictable, and visibly separate from official NHL API data. The current flow goes `TeamPage -> GenAIHandler -> POST /python-service -> hockey-ai.py -> Anthropic`, caches long-lived responses, and expects parseable JSON. This ticket should reduce the chance of malformed or stale AI content being presented as official data.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — sections "AI Integration" and "Diagnostics Layer"
2. api/app.js — POST /python-service, runAIPythonScript, and queueAiSummaryPersistence (note: it currently infers the triCode from the cache key)
3. api/routes/hockey-ai.py and api/services/domain/aiSummaryService.js
4. react/src/Services/GenAIHandler.ts and the TeamPage History section (fetchStaticInfo in react/src/Pages/TeamPage.tsx, or its 2.7 successor) — note the prompt currently lives on the FRONTEND
5. api/utils/cacheManager.js — CACHE_TYPES.AI has a 365-day TTL
6. docs/cleanup-backlog.md section C3 — the explicit-triCode and configurable-model items overlap; if C3 isn't done, fold those two items in here

TASK: Make the AI team-history flow schema-validated, versioned, and gracefully degradable, so malformed or stale AI output can never render as official data.

STEPS (pause after each):
1. Architecture decision first, together: move prompt ownership from TeamPage to the backend. The backend then owns prompt text, schema version, prompt version, and cache key in one place, and the frontend just asks for "team history for COL". Agree on this (or argue me out of it) before coding.
2. Define the contract once on each side: TEAM_HISTORY_SCHEMA_VERSION = 1 with fields arena (string), founded (number), stanleyCups (number), conferenceChampionships (number), hallOfFamers (number). Backend: a pure validator module (api/utils/ or api/services/) that returns {valid, errors}. Frontend: a TS type + a runtime guard. No zod/ajv — hand-rolled checks are fine at this size.
3. Backend flow: run Python → JSON.parse → validate. Only VALID responses are cached (invalid responses must never poison a 365-day cache entry). On failure return a typed error body, e.g. {error: "ai_malformed"} with an appropriate status.
4. Distinct failure modes, each with its own typed error the frontend can map to a message: key_missing (ANTHROPIC_API_KEY unset — check before spawning), python_failed (spawn/exit error), provider_error, ai_malformed (parse or schema failure).
5. Cache key becomes ${triCode}_s${schemaVersion}_p${promptVersion} under CACHE_TYPES.AI. Bumping either version constant bypasses every stale entry; old keys age out via TTL. Update queueAiSummaryPersistence to receive the triCode explicitly instead of parsing the cache key.
6. Python script: parameterize the model name via env var (default to the current hardcoded value). Prompt instructs: return ONLY a raw JSON object with exactly the schema fields, no markdown fences, no commentary.
7. Frontend: the History section renders a clearly-labeled "AI-generated — may require verification" block on success, and a graceful "history unavailable" card per failure mode. TeamPage must be fully usable with AI off.
8. Verified-fact migration: arena and founded are stable, checkable facts — add them to react/src/Data/LocalData/TeamListData.ts for teams as we verify them; local data wins over AI when present, and the AI block shrinks to whatever local data lacks.

INVARIANTS:
- /health reports anthropicKeyConfigured as a boolean only — never the key, never partial values.
- Official NHL data and AI content stay structurally separate components.
- Invalid AI output is never cached and never rendered.
- Map/validate on the backend; the frontend guard is defense-in-depth, not the primary gate.

OUT OF SCOPE: new AI features (player histories, summaries), swapping the Python subprocess for an SDK call (that is ticket 2.15), streaming.

DONE WHEN:
- cd api && npm test passes, including new validator unit tests (valid payload, each missing/wrong-typed field, non-JSON garbage).
- Manual checks: normal flow renders labeled history; with ANTHROPIC_API_KEY removed from api/.env the team page still renders with the unavailable card; a hand-broken schema version bump causes a fresh fetch (new cache key) rather than serving the old entry.
- I have updated docs/phase-2-progress.md section 2.12 and ticked this box, and updated architecture.md's AI Integration section to describe the new backend-owned prompt + versioned cache keys.
```

## 2.13 Frontend coverage and release readiness

- [ ] **Owner:** Either | **Depends on:** 2.1 through 2.12

Add frontend-focused automated checks and release verification after the Phase 2 feature work has settled. Backend contract and season coverage starts in 2.4; this ticket should fill the remaining gaps around URL-backed frontend state, page smoke coverage, and the local release workflow.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — section "Testing" (what the backend suite already covers)
2. react/package.json — note there is NO test tooling installed yet; this is a Vite app, so Vitest is the natural runner (do not install jest)
3. api/package.json — the existing node --test script that must join the combined workflow
4. react/src/Data/Helpers/ (ScheduleHelper.ts, GameStatusHelper.ts, SeasonHelper.ts, and ScheduleFilterHelper.ts if ticket 2.5 landed), react/src/Services/ApiHandler.ts (withParams), react/src/Data/Context/SeasonContext.tsx
5. The pages to smoke test: react/src/Pages/ (LandingPage, SchedulePage, TeamPage, GameDetailPage, DiagnosticsPage, PlayerProfilePage if 2.8 landed)
6. docs/cleanup-backlog.md section C2 — if the CRA leftovers (src/App.test.js, src/setupTests.js) still exist, delete them in step 1

TASK: Stand up frontend testing (Vitest + Testing Library), cover the URL-backed helpers and page smoke paths, and create one combined verification command documented in README.md.

STEPS (pause after each):
1. Install devDependencies in react/: vitest, @testing-library/react, @testing-library/user-event, jsdom. Configure via vitest.config.ts (or a test block in vite.config) with environment jsdom. Delete src/App.test.js and src/setupTests.js if still present — they are broken CRA leftovers.
2. Pure-helper tests first (fast, no DOM): parseLocalDate/formatDateParam round-trip including the UTC-shift trap date; groupGamesByDate keying; SeasonHelper (isValidSeasonId edge cases, formatSeasonLabel, getRecentSeasonIds); GameStatusHelper; withParams (drops empty values, appends only when set); the 2.5 filter helper if it exists.
3. SeasonContext tests: render the provider inside react-router's MemoryRouter with initialEntries; assert an invalid ?season= falls back to the current season and setSeason preserves unrelated params (?date=, ?view=).
4. Page smoke tests: render each page inside its required providers with the ApiHandler module mocked (vi.mock) returning SMALL inline fixtures shaped like the backend contracts — never paste large real NHL payloads, and no snapshot tests. Assert key landmarks render (header, a known team name, an empty state). DiagnosticsPage: assert the passphrase gate shows first and a mocked 401 surfaces an error message.
5. Scripts: react/package.json gets "test": "vitest run" and "typecheck": "tsc --noEmit". Root package.json gets "verify" that runs, in order: api npm test, react typecheck, react test, react build — failing fast.
6. Documentation: add a "local verification" section to README.md (it already covers setup/env vars — extend it, don't rewrite it): the verify command, the note that tests need no env vars, and the explicit statement that the whole verify pipeline runs offline.

INVARIANTS:
- Tests assert contracts and user-visible behavior, not implementation details or DOM structure minutiae.
- No network in tests: NHL, backend, and AI are always mocked at the ApiHandler/GenAIHandler boundary.
- Fixtures are minimal and inline (or tiny files) shaped like the backend contracts documented in architecture.md.

OUT OF SCOPE: E2E browser automation (Playwright/Cypress), CI pipeline setup (worth a future ticket), lint rule debates beyond getting a basic setup running if we choose to include one.

DONE WHEN:
- npm run verify (root) passes end-to-end on a clean checkout with no network access beyond package installs.
- Deliberately breaking formatSeasonLabel makes the verify command fail (sanity-check that tests actually gate).
- README.md documents the workflow; docs/architecture.md's Testing section is updated to cover the frontend suite.
- I have updated docs/phase-2-progress.md section 2.13 and ticked this box.
```

## 2.14 Query-backed frontend data flows

- [ ] **Owner:** Either | **Depends on:** 2.4, 2.5, 2.7, 2.10

Move high-volume frontend filtering and slicing onto backend query endpoints once the normalized Postgres tables are populated reliably. The frontend should still own presentation-only projections, but season/team/date/status/stat filters that can be answered directly by SQL should not require downloading broad datasets and manually filtering them in React.

**Scope notes (added after the 2.4/PR #42 work landed):**

- The write side already exists: `api/db/migrations/` creates the normalized tables, `api/db/repositories/` + `api/services/domain/` upsert into them best-effort after each raw fetch. This ticket adds the **read** side (query endpoints) only.
- One NHL season is small (~1,300 games, 32 teams), so the client-side projections from 2.5 are not a performance problem by themselves. Only convert a workflow to a query endpoint where there is a measured payload-size or repeated-manual-filtering cost — do not redo 2.5's filters in SQL just because the tables exist. If nothing measures as a problem when this ticket comes up, shrink or close it.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. This ticket's scope notes above — especially: the WRITE side already exists; only convert flows with a MEASURED problem; be willing to shrink or close this ticket.
2. docs/architecture.md — sections "Database Migrations", "Controller, Service, And Repository Layers", "Backend Caching"
3. api/db/repositories/ (the repository pattern to copy), api/services/domain/, api/db/migrations/001_create_hockey_domain_tables.sql (the actual table shapes)
4. react/src/Data/Context/ScheduleContext.tsx and StandingsContext.tsx, react/src/Pages/SchedulePage.tsx and TeamList.tsx — the client-side slicing candidates
5. api/test/routes.test.js and api/test/dbMappers.test.js — test patterns for new query endpoints

TASK: Measure the client-side data flows, and ONLY where a real payload/latency problem exists, replace broad-fetch-then-filter with parameterized SQL query endpoints over the normalized tables. This ticket's first deliverable is the measurement, not code.

STEPS (pause after each):
1. Measure before anything: with the app running and caches warm, record for each flow — full-season /schedule/ payload, /standings, team summary, skater/goalie summaries — the response size (devtools Network) and time. Present me a small table of the numbers. DECISION GATE: if no flow exceeds roughly 1 MB compressed or noticeably degrades a real interaction, we write those findings into the progress log, shrink or close this ticket, and stop here. Do not build query endpoints because the tables exist.
2. For each flow that genuinely qualifies, verify the normalized tables actually contain the needed rows (the persistence is best-effort — query the table row counts first). A flow whose table is sparsely populated needs the population fixed before a read path makes sense.
3. Add a read repository per converted flow in api/db/repositories/ — SQL only, fully parameterized ($1, $2...; never string-interpolated), matching the existing repository style. Inputs: season, team, date range, game status/type, standings scope, stat category, limit — only the ones that flow needs.
4. Add thin routes: validateSeason middleware, validate remaining params, call the repository, map rows to the SAME response contract the raw path returns (the frontend must not know which path served it). On any DB error or empty result set, fall back silently to the existing GetOrFetch raw path.
5. Update ApiHandler + the relevant context/hook to pass filter params to the endpoint instead of filtering a broad payload — for converted flows only. URL-backed state (season, date, view, filters) is unchanged; view/layout stays frontend-only.
6. Tests: backend — param validation (bad season 400s, injection attempt is inert), row-to-contract mapping, and the DB-down fallback (mock the pool to throw); frontend — query construction and fallback behavior for converted calls.
7. Document in architecture.md which flows are DB-query-backed and which intentionally remain client-side projections, and why.

INVARIANTS:
- The raw-cache/NHL fetch path always remains as automatic fallback — the app must work with no database at all.
- Identical response contracts from both paths.
- SQL lives only in repositories; routes stay thin; no SQL in route files.
- Client-side presentation-only projections (day/week/month grouping, sorting for display) stay on the frontend.

OUT OF SCOPE: new user-facing features, schema migrations beyond what an agreed conversion strictly needs, background population jobs (note them for a future ticket if step 2 reveals gaps).

DONE WHEN:
- Either: the measurement table is in docs/phase-2-progress.md section 2.14 with the decision to close/shrink — OR — the converted flows pass: cd api && npm test (new tests included), react verify pipeline green, and killing the database while the app runs degrades silently to the raw path (verified manually).
- architecture.md documents the DB-backed vs client-side split.
- I have updated docs/phase-2-progress.md section 2.14 and ticked (or closed) this box.
```

## 2.15 Replace the Python AI subprocess with the Anthropic Node SDK

- [ ] **Owner:** Either | **Depends on:** 2.12

The AI flow currently spawns a Python process per request (`app.js` `runAIPythonScript` → `routes/hockey-ai.py`) solely to make one Anthropic API call, which drags along a venv, a python3 production dependency, stdout-JSON parsing, and process-exit error handling. Anthropic ships a first-class Node SDK (`@anthropic-ai/sdk`); calling it directly from the existing backend removes that entire seam. 2.12 flagged this as its own ticket — this is that ticket. Do it after 2.12 so the schema validation, typed error modes, and versioned cache keys are already in place and the swap is a pure transport change behind them.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and the plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step so I can implement and ask questions. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md instead of fixing them.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/.

READ FIRST, in this order:
1. docs/architecture.md — "AI Integration" section (as updated by 2.12)
2. api/app.js — the /python-service route and runAIPythonScript
3. api/routes/hockey-ai.py — the system prompt, model env var, max_tokens, and error shape being replaced
4. The 2.12 deliverables: the validator module, the typed failure modes (key_missing, python_failed, provider_error, ai_malformed), and the versioned cache keys — the swap must slot in BEHIND these, not rework them
5. api/test/routes.test.js — where the AI route's tests live

TASK: Replace the spawn-Python transport with a direct @anthropic-ai/sdk call in a new backend service module, preserving the route's contract, cache behavior, and typed error modes exactly.

STEPS (pause after each):
1. npm install @anthropic-ai/sdk in api/. Create api/services/domain/anthropicClient.js (or fold into the 2.12 AI service if one exists): construct the client once at module scope, read the model from the same env var 2.12/C3 introduced, port the system prompt and max_tokens verbatim from hockey-ai.py.
2. Wire the /python-service handler to the new module. Map SDK failures onto the EXISTING typed error modes: missing ANTHROPIC_API_KEY → key_missing (check before calling), API/network errors → provider_error, schema/parse failures → ai_malformed (unchanged, still the validator's job). python_failed becomes unreachable — remove it from the backend map but leave the frontend's handling of it alone (harmless dead branch, note it for cleanup).
3. Delete runAIPythonScript and the child_process import from app.js, then api/routes/hockey-ai.py and the venv/ directory. Search the repo and deploy config (README, architecture.md, any build scripts/Dockerfile/host config) for python references tied to the AI flow and remove them; python must no longer be needed in production.
4. Tests: mock the SDK module (inject or override the client) to cover — happy path returns validated content and caches it; SDK throws → provider_error and NOTHING cached; key absent → key_missing without constructing a request. Port any existing tests that mocked the spawn.
5. Timeout: give the SDK call an explicit timeout consistent with the API's other outbound calls (see cleanup C6 — if C6 set 10s for NHL calls, AI can be longer, e.g. 30s; agree with me first). A timeout maps to provider_error.

INVARIANTS:
- The route's request/response contract, cache keys, and TTL behavior are byte-for-byte unchanged — the frontend must not need any edits.
- Prompt text, model selection, and max_tokens stay identical to the Python version at swap time; tuning them is separate work.
- /health still reports anthropicKeyConfigured as a boolean only.

OUT OF SCOPE: streaming, prompt changes, new AI features, retry logic beyond what the SDK does by default.

DONE WHEN:
- cd api && npm test passes, including the new mocked-SDK tests.
- Manual: team-page history renders identically from a cold cache; with ANTHROPIC_API_KEY unset the key_missing card shows; grep confirms no spawn/python3/hockey-ai.py references remain outside docs history.
- python3 and the venv are no longer required to run the API locally or in production (verified by booting without the venv present).
- I have updated docs/phase-2-progress.md section 2.15 and ticked this box, and updated architecture.md's AI Integration section (transport is now the Node SDK; the Python subprocess description is removed).
```
