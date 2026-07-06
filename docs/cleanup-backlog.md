# Cleanup Backlog

Refinements, consistency fixes, and dead-code removal found during a full codebase review on 2026-07-01. These are intentionally separate from [phase-2-backlog.md](./phase-2-backlog.md): none add features, and each is small enough to land independently between feature tickets.

Ordering is by risk: C1/C2 are pure deletion/hygiene, C3/C4 are mechanical refactors, C5 changes runtime behavior and deserves the most care. C6/C7 are security and resilience hardening from a follow-up standards review (also 2026-07-01); C6 items 1–2 are the highest-value tickets in this file. Where an item overlaps a Phase 2 ticket, the note says so — do not duplicate that work here.

Each ticket's **implementation prompt** is self-contained and meant to be pasted verbatim into a fresh Claude Code session (Sonnet/Opus acting as the senior dev, pairing with a junior dev who writes the code).

## C1 Remove Express-generator scaffolding

- [ ] **Owner:** Either

**Update 2026-07-06:** most of this ticket landed in PR #46 — `api/routes/index.js` + the `indexRouter` mount, the `views/` folder + view-engine lines, the `jade` dependency, `api/public/`, and the committed `api/.idea/` are all gone. Two items remain:

- `cookie-parser` and `app.use(cookieParser())` in `api/app.js` — nothing in the codebase reads or sets cookies; the dependency is still in `api/package.json`
- The top-level `api/schedule-cache/` folder is a legacy cache location left on disk (the cache manager writes to `api/cache/schedule-cache/` now); it is already gitignored, so just delete it locally

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain what each piece was for before we delete it; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/. Most express-generator leftovers were already removed in PR #46; this ticket finishes the last two items.

READ FIRST: docs/cleanup-backlog.md section C1, api/app.js, api/package.json.

STEPS (pause after each):
1. Remove the cookieParser require and app.use(cookieParser()) from api/app.js (grep first to confirm nothing reads req.cookies); remove cookie-parser from api/package.json and pnpm install.
2. Delete the legacy top-level api/schedule-cache/ folder from disk. CAUTION: the live cache is api/cache/schedule-cache/ — do NOT touch anything under api/cache/.

DONE WHEN:
- cd api && pnpm install && pnpm test passes (54+ tests).
- pnpm start boots cleanly; GET /standings responds.
- This box is ticked.
```

## C2 Dependency and package metadata hygiene

- [ ] **Owner:** Either

**Update 2026-07-06:** PR #46 already handled part of this ticket — the CRA leftovers (`src/App.test.js`, `src/setupTests.js`, `src/reportWebVitals.js`, the `web-vitals` dependency, the inert `eslintConfig` block) are deleted, the vestigial root `package.json` is cleaned up, and the repo is standardized on pnpm with the stray lockfiles and the placeholder `pnpm-workspace.yaml` removed. What remains:

- `api/package.json` lists `sequelize` and `pg-hstore`, but no code imports either — the DB layer uses raw `pg`. Remove both.
- `express` is pinned at `~4.16.4` (2018). Upgrade to the latest 4.x for accumulated security/bug fixes; the API surface used here (routers, middleware, `res.json`) is stable across 4.x.
- The `browserslist` block in `react/package.json` is unused by Vite's default esbuild targets; remove or knowingly keep.
- `api` and `react` package versions still say `2.3.0` even though ticket 2.4 shipped; bump to `2.4.0` (the `/health` endpoint reports this version).

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain why each dependency is or isn't needed before touching it; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/, Vite React frontend in react/, both on pnpm.

READ FIRST: docs/cleanup-backlog.md section C2, api/package.json, react/package.json.

STEPS (pause after each):
1. api: confirm sequelize and pg-hstore are unused (grep -rn "sequelize\|pg-hstore" api --include='*.js' excluding node_modules/venv should return nothing — the DB layer uses raw pg). Remove both from package.json, pnpm install, pnpm test.
2. api: upgrade express from ~4.16.4 to the latest 4.x. Stay on 4.x — express 5 changes middleware/router semantics and is its own ticket. pnpm install && pnpm test, then boot the server and hit /standings and /health (with the diagnostics key) manually.
3. react: remove the browserslist block (unused by Vite's default esbuild targets) — or tell me why we should knowingly keep it. Note in the commit message that real lint/test tooling arrives in Phase 2 ticket 2.13.
4. Bump version to 2.4.0 in api/package.json and react/package.json (shipped ticket 2.4). CAUTION: GET /health reports the api version — check it afterwards.

DONE WHEN:
- cd api && pnpm install && pnpm test passes; server boots and both smoke routes respond.
- cd react && pnpm install && npx tsc --noEmit && pnpm build all pass; pnpm start renders the landing page.
- /health shows version 2.4.0.
- No file anywhere still imports sequelize or pg-hstore; this box is ticked.
```

## C3 Backend consistency refinements

- [ ] **Owner:** Either

Small inconsistencies that make the backend harder to reason about than it needs to be:

- `api/routes/team.js` `GET /team/:teamId?` builds its `cayenneExp` with hand-written `%3D`/`%20` escapes, while `player.js` writes the plain expression and runs it through `encodeURIComponent`. Use the `player.js` style in both places.
- `GET /player/goalie/summary` requests `limit=10` while the skater summary uses `limit=100`. For a single team that's fine (2–3 goalies), but the same route serves the no-`teamId` league-wide scope, where 10 silently truncates. Align the limits or document why they differ.
- `GET /team/stats` and `GET /team/:teamId?` (with no id) fetch the same NHL team-summary payload with different sort/cache keys. Consolidate to one handler, or document why both exist. (Full normalization of team stats into a contract is already noted in architecture.md as future mapper work.)
- Postgres connection config is duplicated: `cacheManager.js` builds its own `Pool` + SSL logic and `db/pool.js` builds another. Extract one shared connection/SSL config so a future change (e.g. proper CA verification instead of `rejectUnauthorized: false`) happens in one place.
- `app.js` starts the schedule-refresh timer (`scheduleNextRefresh()`) as a module-import side effect, which is why tests must load routers individually instead of the app. Move the call into `bin/www` so importing the app stays side-effect free.
- `queueAiSummaryPersistence` in `app.js` infers the team triCode from the AI cache key (`cacheKey === 'default' ? null : cacheKey`). That's an implicit contract with the frontend. Have the frontend send an explicit `triCode` field in the `/python-service` body instead.
- `api/routes/hockey-ai.py` hardcodes the model name (`claude-sonnet-4-6`). Read it from an env var with that value as the default, so a model upgrade doesn't require a code change. (Schema validation, prompt/cache versioning, and fallback states remain Phase 2 ticket 2.12 — don't pull that work in here.)

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the inconsistency and the intended end state before each change; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/. Seven small consistency fixes; each step is independently commitable.

READ FIRST: docs/cleanup-backlog.md section C3, docs/architecture.md sections "Backend Caching" and "Developer Conventions", api/routes/team.js, api/routes/player.js, api/app.js, api/bin/www, api/utils/cacheManager.js, api/db/pool.js, api/routes/hockey-ai.py, react/src/Services/genAIHandler.ts, react/src/Pages/TeamPage.tsx (fetchStaticInfo — the /python-service caller), api/test/routes.test.js.

STEPS (pause after each):
1. cayenneExp encoding: in api/routes/team.js GET /team/:teamId?, replace the hand-escaped expression (%3D/%20 literals) with the player.js style — build the plain expression string, then encodeURIComponent(exp) at the call site. The final URL must be byte-identical to before; prove it by logging both once. Cache keys don't change here.
2. Goalie summary limit: api/routes/player.js GET /player/goalie/summary uses limit=10 while the skater route uses limit=100. For the no-teamId league-wide scope, 10 truncates. Raise to 100 to match. CAUTION: the cached raw entries for goalie_summary_* keep the old truncated data until TTL (24h) expires — acceptable; note it.
3. Team-stats route consolidation: GET /team/stats and GET /team/:teamId? (with no id) fetch the same NHL team-summary payload with different sort/cache keys. Check react/src/Services/apiHandler.ts for which the frontend actually calls, consolidate to one handler, and keep a thin alias only if both are called. Changed cache keys cold-start those entries — fine.
4. Shared Postgres config: extract the connection-string + SSL logic duplicated between api/utils/cacheManager.js (getCachePool) and api/db/pool.js (getSslConfig) into one module (e.g. api/db/connectionConfig.js) consumed by both. Behavior must be identical, including the CACHE_DATABASE_SSL='false'/'true'/NODE_ENV rules. Keep the two pools separate — only the config unifies.
5. Refresh timer side effect: app.js currently calls scheduleNextRefresh() at module import, which is why tests can't import the app. Move the REFRESH_HOURS_UTC constant + scheduler into a new module (e.g. api/services/scheduleRefreshScheduler.js) and invoke it from api/bin/www after the server starts. Importing app.js must become side-effect free.
6. Explicit triCode: POST /python-service currently infers the team from cacheKey (queueAiSummaryPersistence: cacheKey === 'default' ? null : cacheKey). Have the frontend send an explicit triCode field in the body (react/src/Services/genAIHandler.ts + the TeamPage caller), and make the backend prefer req.body.triCode with the old cacheKey inference kept as fallback for one release.
7. Python model name: in api/routes/hockey-ai.py, read the model from os.environ.get("ANTHROPIC_MODEL", "<current hardcoded value>") so upgrades are config-only. Document the new env var in docs/architecture.md's AI Integration section.

INVARIANTS:
- No response contract changes — the frontend must not need edits except step 6's added field.
- Full AI hardening (schema validation, versioned cache keys) is Phase 2 ticket 2.12 — do not pull it in.
- One commit per step, no formatting churn mixed in.

DONE WHEN:
- cd api && pnpm test passes after every step (update tests that asserted old cache keys or route shapes as part of the relevant step).
- Manual: /team/stats-equivalent, /team/:teamId, /player/goalie/summary, and the team page's AI history section all still work; requiring app.js in a node REPL starts no timers.
- docs/architecture.md is updated where behavior it documents changed (team routes list, AI env var); this box is ticked.
```

## C4 Frontend dead code removal

- [ ] **Owner:** Either

- `react/src/Data/LocalData/teamPageMockData.ts` (441 lines) is misnamed: it holds the real TypeScript types used by `TeamPage` and six of its components (`MockTeam`, `MockStatItem`, `Position`, `RosterPlayer`, `PlayerStatLine`) plus ~380 lines of `MOCK_*` constants that nothing imports. Move the types into `react/src/Data/Models/` (dropping the `Mock` prefixes, e.g. `MockTeam` → `TeamOverview`), update the seven importers, and delete the file. Note ticket 2.7 will touch these same components — land this first or fold it into 2.7.
- `react/src/Data/LocalData/landingPageLocalData.ts` has no importers; delete it.
- `apiHandler.ts` exports `GetListOfTeams()` (no callers — `ListOfTeamsContext` uses `GetTeamStatsById("")`). Delete it. (The empty `GetDraft()` stub this ticket originally also covered was already removed on main.)
- `apiHandler.ts` repeats the same try/catch → `console.error` → rethrow wrapper 15 times. Extract one small `get(path, params?, config?)` helper so each endpoint is one line.
- `ScheduleContext` and `ListOfTeamsContext` create their contexts as `createContext<any>(null)`. Give them typed value interfaces like the other contexts already have.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain what each piece of dead code was and how you proved it's dead before we remove it; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Vite React frontend in react/. This ticket removes dead code and relocates misplaced types; no behavior changes.

READ FIRST: docs/cleanup-backlog.md section C4, react/src/Data/LocalData/teamPageMockData.ts (441 lines — real types at the top, unused MOCK_* constants below), react/src/Pages/TeamPage.tsx, react/src/Components/TeamPage/ (all files), react/src/Data/LocalData/landingPageLocalData.ts, react/src/Services/apiHandler.ts, react/src/Data/Context/ScheduleContext.tsx, react/src/Data/Context/ListOfTeamsContext.tsx.

STEPS (pause after each):
1. Verify deadness yourself first (do not trust this doc): grep the repo for each MOCK_* constant, for landingPageLocalData, and for GetListOfTeams imports. Show me the grep results.
2. Create react/src/Data/Models/teamPageTypes.ts holding the REAL types currently in teamPageMockData.ts, renamed without the Mock prefix: MockTeam → TeamOverview, MockStatItem → StatItem; keep Position, RosterPlayer, PlayerStatLine as-is. Update all importers (TeamPage.tsx plus six components under Components/TeamPage/). Then delete teamPageMockData.ts entirely, including MockScheduleGame and every MOCK_* constant.
3. Delete react/src/Data/LocalData/landingPageLocalData.ts (zero importers).
4. In apiHandler.ts delete GetListOfTeams (zero callers — ListOfTeamsContext uses GetTeamStatsById("")).
5. Still in apiHandler.ts, extract the repeated wrapper into one helper: async function get<T>(path: string, params?: Record<string, string|undefined>, config?: AxiosRequestConfig) that applies withParams, logs, and rethrows. Each exported function becomes a one-liner. Public function names and signatures MUST NOT change — callers are untouched.
6. Type the two any contexts: give ScheduleContext and ListOfTeamsContext explicit value interfaces (mirror how StandingsContext/SeasonContext do it), and keep the existing null-check pattern in their hooks.

INVARIANTS:
- Zero behavior change; this is relocation + deletion only.
- No formatting churn in untouched regions; one commit per step.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- grep confirms no references remain to teamPageMockData, MOCK_, landingPageLocalData, or GetListOfTeams.
- Manual smoke: landing page, schedule page (all three views), team list, and a team page all render as before.
- docs/architecture.md's GetDraft note is updated; this box is ticked.
```

## C5 Frontend behavior refinements

- [ ] **Owner:** Either

**Update 2026-07-06:** the serial score backfill item originally listed here landed in PR #47 (`updatePastGames` now fetches with `Promise.all`). The remaining items change runtime behavior, so verify each in the browser:

- **TeamPage standings race.** `fetchMain` reads `easternStandingsData`/`westernStandingsData` from `StandingsContext`, but the effect only depends on `[teamId, triCode, season]`. If the team page loads before standings resolve (e.g. direct deep link), record/ranks render as 0 and never correct themselves. Either include the standings data (or `loadingStandingsData`) in the effect's dependencies, or derive the standings-based fields at render time instead of inside the fetch. Also: `triCode` is derived from `teamId`, so listing both as dependencies is redundant. (Ticket 2.7 rebuilds TeamPage — if 2.7 is close, fix it there instead.)
- **Stale team-list cache.** `ListOfTeamsContext` caches team stats in `localStorage` under `listOfTeams-key` with no TTL and no season in the key — the only invalidation is a shape check (`hasValidGoalsPerGame`). Stats can stay frozen for months. Add a timestamp-based TTL (a day is plenty) and consider keying by season.
- **Twin stat-leader contexts.** `SkaterStatLeadersContext` and `GoalieStatLeadersContext` are near-identical wrappers over `useStatLeaders`. Collapse them into one provider that exposes both leader maps (or a single generic provider parameterized by type) so a stat-category change only touches one file.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). These three items change runtime behavior, so for each one: explain the current behavior, the failure mode, and the fix BEFORE any code, then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Vite React frontend in react/. Three behavior refinements; each step is independently commitable and independently verifiable in the browser.

READ FIRST: docs/cleanup-backlog.md section C5, react/src/Pages/TeamPage.tsx (the fetchMain effect), react/src/Data/Context/StandingsContext.tsx, ListOfTeamsContext.tsx, SkaterStatLeadersContext.tsx, GoalieStatLeadersContext.tsx, react/src/Data/Hooks/useStatLeaders.ts, react/src/Pages/LandingPage.tsx (consumes both leader contexts). Also check docs/phase-2-backlog.md ticket 2.7 status — if 2.7 is about to start, hand it step 1 instead of doing it here (2.7 step 0 covers it).

STEPS (pause after each):
1. TeamPage standings race. Current bug: fetchMain reads easternStandingsData/westernStandingsData from StandingsContext, but its useEffect depends only on [teamId, triCode, season]. Deep-linking to a team page before standings resolve renders wins/losses/ranks as 0 with no self-correction. Fix options — discuss trade-offs with me, then pick: (a) add loadingStandingsData + the two arrays to the effect deps and skip the standings-derived state until loaded, or (b) (cleaner) stop storing standings-derived fields in fetchMain's state and derive them at render time with useMemo over the context. Also drop the redundant dep: triCode derives from teamId, so listing both is noise. Regression test by hand: hard-refresh directly on /#/team/COL — record and ranks must populate once standings arrive.
2. Team-list cache TTL. ListOfTeamsContext caches under localStorage key 'listOfTeams-key' with no timestamp — only a shape check (hasValidGoalsPerGame) ever invalidates it, so stats freeze indefinitely. Change the stored shape to {timestamp, data}, treat entries older than 24h as misses, and keep the shape check for corrupt entries. Migration: an old-format entry (a bare array) must be treated as a miss, not a crash — guard the parse.
3. Merge the twin leader contexts. SkaterStatLeadersContext and GoalieStatLeadersContext are structurally identical wrappers over useStatLeaders(type, season). Replace with ONE StatLeadersProvider that calls the hook twice (skater + goalie) and exposes both maps; keep the existing useSkaterLeaderData/useGoalieLeaderData hook names and return shapes so consumers (LandingPage, PlayerStatLeaderRow, modals) need only an import-path change. Update the provider nesting in react/src/App.tsx.

INVARIANTS:
- Consumer-visible hook APIs keep their names and shapes (step 3).
- No new fetches introduced; the fixes reorganize when/how existing data flows.
- One commit per step.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Browser checks, one per step: (1) hard refresh directly on a team page URL in a fresh tab — record/ranks populate; (2) with devtools Application tab, confirm the new {timestamp, data} shape, then set timestamp to 0 and reload — a network fetch replaces it; also pre-seed the old bare-array format and reload — no crash, fresh fetch; (3) landing page still renders all eight leader cards (4 skater + 4 goalie) and season switching still reloads them.
- This box is ticked; if 2.7 already fixed step 1, record that here instead of re-doing it.
```

## C6 Backend security and reliability hardening

- [ ] **Owner:** Either

Findings from the standards review that no existing ticket covers. Items are independent; each is its own commit.

- **`POST /python-service` is an unauthenticated LLM proxy.** Anyone with the URL can POST arbitrary `content` and spend Anthropic credits — CORS only restricts browsers, not `curl`. Phase 2 ticket 2.12 fixes the root cause (prompt ownership moves to the backend, clients send only a `triCode`), but nothing anywhere adds rate limiting. Add `express-rate-limit` on this route now as a stopgap, and validate `cacheKey` against the known NHL tricode format so garbage keys can't multiply cache entries.
- **Postgres TLS uses `rejectUnauthorized: false` in production** (`api/db/pool.js` `getSslConfig`, duplicated in `api/utils/cacheManager.js`). Certificate verification is disabled, so the DB connection is MITM-able. C3 step 4 consolidates the duplicated config; this item does the actual fix — verify against the provider's CA cert supplied via env var.
- **`bin/www`'s `uncaughtException` handler logs and keeps running.** Node docs say the process is in an undefined state after an uncaught exception — log, then `process.exit(1)` and let the host restart it. Also add graceful shutdown: on SIGTERM/SIGINT, `server.close()`, then close both pg pools.
- **No security headers.** Add `helmet()` — low stakes for a JSON API, but it's two lines.
- **Outbound NHL requests have no timeout** (`api/services/nhlApiClient.js` — four axios instances, none set `timeout`). A hung upstream call hangs the API request and the user's spinner indefinitely.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). These are security fixes, so before each change explain the attack or failure it prevents; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/. Five independent hardening items; one commit per step.

READ FIRST: docs/cleanup-backlog.md section C6, api/app.js (the /python-service route and middleware stack), api/bin/www, api/db/pool.js (getSslConfig), api/utils/cacheManager.js (its duplicate pool/SSL logic), api/services/nhlApiClient.js, docs/phase-2-backlog.md ticket 2.12 (the real /python-service fix — do not pull it in), docs/cleanup-backlog.md C3 step 4 (shared Postgres config — if done, edit the shared module instead of two files).

STEPS (pause after each):
1. Rate-limit the AI route: pnpm add express-rate-limit; apply a strict limiter to POST /python-service only (e.g. 10 requests / 15 min / IP — cached responses make legitimate use rare). Return a JSON error body consistent with the shared error handler. Also reject bodies where cacheKey is present but not a plausible tricode (/^[A-Z]{2,3}$/) or 'default'. CAUTION: if the host sits behind a proxy (Render/Heroku-style), set app.set('trust proxy', 1) or the limiter keys every request to the proxy's IP.
2. Postgres CA verification: replace ssl: { rejectUnauthorized: false } with real verification — read a CA cert from env (e.g. DATABASE_CA_CERT, the PEM itself or a path) and pass ssl: { ca }. Keep CACHE_DATABASE_SSL='false' working for local dev. If C3 step 4 has landed, change the one shared module; otherwise change both pool.js and cacheManager.js identically and note the duplication for C3. CAUTION: get the provider's CA cert and test against the real database BEFORE deploying — a wrong cert takes down every DB feature; the cache layer's fetch-through fallback keeps reads alive, but persistence stops.
3. Crash on uncaughtException: in bin/www, after logging, process.exit(1) (keep unhandledRejection log-only for now — note it should also exit once the codebase is clean). Add SIGTERM/SIGINT handlers: server.close(), then close both pg pools (closeDbPool from db/pool.js and the cache pool from cacheManager.js — export a close function if it lacks one), then exit 0; force-exit after a 10s timeout.
4. pnpm add helmet; app.use(helmet()) before the routes in app.js. Verify the responses still work from the frontend (helmet's defaults are fine for a JSON API; relax nothing unless something breaks).
5. Add timeout: 10000 to all four axios instances in nhlApiClient.js. Confirm the error path: a timeout must surface as the shared JSON error handler's 500, not an unhandled rejection.

DONE WHEN:
- cd api && pnpm test passes after every step.
- Manual: 11 rapid POSTs to /python-service get a 429 with a JSON body; /standings still responds with helmet on; kill -TERM on the server process exits cleanly within 10s; with DATABASE_CA_CERT set the server boots and /health cache checks pass.
- docs/architecture.md documents the new env var(s) and the rate limit in its AI Integration / deployment notes; this box is ticked.
```

## C7 Frontend resilience refinements

- [ ] **Owner:** Either

- **No error boundary.** A render-time exception in any component blanks the entire SPA to a white screen. Add one `ErrorBoundary` component wrapping `<Routes>` in `App.tsx` so a broken page degrades to an error card with a "back to home" link instead.
- **`axiosInstance.ts` sets no timeout**, so a hung backend call leaves loading states spinning forever. Add one (e.g. 15s — the AI route is slow on cold cache) so requests resolve to the callers' existing error paths.
- **After C4 lands**, enable `noUnusedLocals` and `noUnusedParameters` in `react/tsconfig.json` so dead code can't silently accumulate again. (Do this after C4, not before — the current dead code would fail the build.)

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain each failure mode in the browser before we fix it; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Vite React frontend in react/. Three small resilience fixes; one commit per step.

READ FIRST: docs/cleanup-backlog.md section C7, react/src/App.tsx, react/src/index.tsx, react/src/Services/axiosInstance.ts, react/src/Components/EmptyState.tsx (reuse its look for the error card), react/tsconfig.json, and check whether cleanup ticket C4 is ticked (step 3 depends on it).

STEPS (pause after each):
1. Error boundary: create react/src/Components/ErrorBoundary.tsx — a small class component (componentDidCatch is class-only; no new dependency needed) that logs the error and renders a friendly card (reuse EmptyState's styling) with a link to '/'. Wrap <Routes> in App.tsx with it. Verify by temporarily throwing inside one page component: that page shows the card, direct navigation to other pages still works, then remove the throw.
2. Axios timeout: add timeout: 15000 to axios.create in axiosInstance.ts. Verify: stop the api server, load the schedule page — the spinner must resolve to the page's existing error/empty state within ~15s instead of spinning forever.
3. ONLY IF C4 is ticked: enable noUnusedLocals and noUnusedParameters in react/tsconfig.json, run npx tsc --noEmit, and fix whatever small residue it flags (prefix genuinely-required unused params with _). If C4 is not done, skip and leave this step's box in the doc unticked with a note.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: the throw-test shows the error card and the app recovers on navigation; the dead-backend test resolves to an error state within the timeout.
- This box is ticked (with a note if step 3 was deferred pending C4).
```
