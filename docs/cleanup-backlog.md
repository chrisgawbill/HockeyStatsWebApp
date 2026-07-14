# Cleanup Backlog

Refinements, consistency fixes, and dead-code removal found during a full codebase review on 2026-07-01. These are intentionally separate from [phase-2-backlog.md](./phase-2-backlog.md): none add features, and each is small enough to land independently between feature tickets.

Ordering is by risk: C1/C2 are pure deletion/hygiene, C3/C4 are mechanical refactors, C5 changes runtime behavior and deserves the most care. C6/C7 are security and resilience hardening from a follow-up standards review (also 2026-07-01); C6 items 1–2 are the highest-value tickets in this file. C8 (added 2026-07-07) is an active runtime bug — background persistence is silently failing under lock contention — and ranks alongside C6 items 1–2 in priority. Where an item overlaps a Phase 2 ticket, the note says so — do not duplicate that work here.

**Status 2026-07-14:** C1–C8 are all complete — the `maintenance-cleanup` branch merged to `main` in PR #50 (2026-07-13). A post-merge review found two small leftovers, tracked as C9 below. The C6 `pg` v9 `sslmode` follow-up remains open (see the note inside C6) and stays parked until someone bumps `pg`.

Each ticket's **implementation prompt** is self-contained and meant to be pasted verbatim into a fresh Claude Code session (Sonnet/Opus acting as the senior dev, pairing with a junior dev who writes the code).

## C1 Remove Express-generator scaffolding

- [x] **Owner:** Either

**Update 2026-07-07:** complete. The two remaining items landed on the `maintenance-cleanup` branch — `cookie-parser` (require, middleware, and dependency) is removed, and the legacy `api/schedule-cache/` folder is deleted from disk.

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

- [x] **Owner:** Either

**Update 2026-07-07:** complete. The remaining four items landed on the `maintenance-cleanup` branch — `sequelize`/`pg-hstore` removed, `express` upgraded to `^4.22.2` (latest 4.x), the `browserslist` block removed, and both packages bumped to `2.4.0`.

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

- [x] **Owner:** Either

**Update 2026-07-07:** complete — all seven steps landed on the `maintenance-cleanup` branch. Notes on where the implementation deviated from or refined the plan:

- Step 3 (team-stats consolidation): `GET /team/stats` had zero frontend callers, so it was deleted outright rather than aliased. `GET /team/:teamId?` (no id) is now the only league-wide team-summary route.
- Step 4: shared config lives in `api/db/connectionConfig.js` (`getDatabaseUrl` + `getSslConfig`), consumed by both `db/pool.js` and `utils/cacheManager.js`; the two pools stay separate.
- Step 5: scheduler lives in `api/services/refreshScheduler.js`, started from `bin/www`'s `onListening`. Importing `app.js` is now side-effect free.
- Step 7 deviation: `ANTHROPIC_MODEL` is **required** with no in-code default (the ticket suggested defaulting to the old hardcoded value). Every environment must set it — `api/.env.example` documents this. **Deploy note: set `ANTHROPIC_MODEL` in production before shipping this branch or the AI endpoint fails.**
- Step 2 caveat as predicted: `goalie_summary_*` cache entries fetched with the old `limit=10` serve truncated data until the 24h TTL expires.

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

- [x] **Owner:** Either

**Update 2026-07-07:** complete — landed on the `maintenance-cleanup` branch. Types moved to `react/src/Data/Models/teamPageTypes.ts` (`MockTeam` → `TeamOverview`, `MockStatItem` → `StatItem`), both dead LocalData files and `GetListOfTeams` deleted, `apiHandler.ts` collapsed onto one `get<T>()` helper, and `ScheduleContext`/`ListOfTeamsContext` are now typed with null-checked hooks. C7 step 3 (`noUnusedLocals`/`noUnusedParameters`) is now unblocked.

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

- [x] **Owner:** Either

**Update 2026-07-07:** complete — all three items landed on the `maintenance-cleanup` branch and were verified in the browser. Notes on where the implementation deviated from or refined the plan:

- Step 1 (TeamPage standings race): fixed with option (b). `fetchMain` now parks the raw team-stats response in state and a `useMemo` derives record/ranks/playoff-line delta from the live `StandingsContext` at render, so a deep-linked visit self-corrects once standings resolve instead of freezing at 0. The redundant `triCode` dep was dropped from the fetch effect (`teamId` already implies it). This satisfies ticket 2.7 step 0 — do not redo the standings-race fix there.
- Step 2 (stale team-list cache): **deviated from the written plan.** Instead of adding a `{timestamp, data}` TTL, the `localStorage` team-list cache was removed entirely — freshness is now owned by the backend DB cache. Rationale: `ListOfTeamsContext` was the only client-side *data* cache (every other context already relies on the server cache), so it was a redundant second cache layer, and the one without a TTL. `hasValidGoalsPerGame` and the `listOfTeams-key` **read** are gone; `ThemeContext`'s `localStorage` use (a user preference, not fetched data) is untouched. *Correction 2026-07-14: the `localStorage.setItem('listOfTeams-key', ...)` **write** survived the merge — it's a dead write nothing reads; removal is tracked in C9.* Ticket 2.9's READ-FIRST list, which cited `ListOfTeamsContext` as the `localStorage` example, was updated 2026-07-14 to point at `ThemeContext` instead.
- Step 3 (twin leader contexts): merged into one `StatLeadersProvider` in `StatLeadersContext.tsx` that calls `useStatLeaders` twice (skater + goalie). `useSkaterLeaderData`/`useGoalieLeaderData` keep their names and return shapes, so only `LandingPage`'s import path and `App.tsx`'s provider nesting changed. The old `SkaterStatLeadersContext.tsx` and `GoalieStatLeadersContext.tsx` are deleted.

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

- [X] **Owner:** Either

Findings from the standards review that no existing ticket covers. Items are independent; each is its own commit.

- **`POST /python-service` is an unauthenticated LLM proxy.** Anyone with the URL can POST arbitrary `content` and spend Anthropic credits — CORS only restricts browsers, not `curl`. Phase 2 ticket 2.12 fixes the root cause (prompt ownership moves to the backend, clients send only a `triCode`), but nothing anywhere adds rate limiting. Add `express-rate-limit` on this route now as a stopgap, and validate `cacheKey` against the known NHL tricode format so garbage keys can't multiply cache entries.
- **Postgres TLS uses `rejectUnauthorized: false` in production** (`api/db/pool.js` `getSslConfig`, duplicated in `api/utils/cacheManager.js`). Certificate verification is disabled, so the DB connection is MITM-able. C3 step 4 consolidates the duplicated config; this item does the actual fix — verify against the provider's CA cert supplied via env var.
- **`bin/www`'s `uncaughtException` handler logs and keeps running.** Node docs say the process is in an undefined state after an uncaught exception — log, then `process.exit(1)` and let the host restart it. Also add graceful shutdown: on SIGTERM/SIGINT, `server.close()`, then close both pg pools.
- **No security headers.** Add `helmet()` — low stakes for a JSON API, but it's two lines.
- **Outbound NHL requests have no timeout** (`api/services/nhlApiClient.js` — four axios instances, none set `timeout`). A hung upstream call hangs the API request and the user's spinner indefinitely.

**Follow-up found during C6 step 2 (not yet fixed):** the `CACHE_DATABASE_URL` connection string carries an `sslmode=` param (e.g. `require`). Current `pg` (v8) treats `require`/`prefer`/`verify-ca` as `verify-full`, and the explicit `ssl: { ca, rejectUnauthorized: true }` from `getSslConfig()` enforces verification regardless — so it is safe today. But `pg` prints a deprecation warning: in `pg` v9 / `pg-connection-string` v3 those modes adopt weaker libpq semantics (`sslmode=require` = encrypt but do **not** verify), which would silently re-open the MITM hole C6.2 closed. `pg` is pinned at `^8.21.0`, so no automatic upgrade — but whoever bumps `pg` to v9 must make `sslmode=verify-full` explicit in the connection string (or otherwise assert verification) as part of that upgrade. One-line fix; tracked here so it is not lost.

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

- [X] **Owner:** Either

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

## C8 Domain persistence lock contention — `Query read timeout` on background writes

- [X] **Owner:** Either

**High priority.** Found 2026-07-07 from local API logs: `Domain service task failed for goalie leaders shutouts 20252026: Error: Query read timeout` (and the same for `skater leaders goals`, `season schedule 20252026`, `season schedule 20222023`). The site works — these are fire-and-forget write-through tasks and the response was already served from the NHL payload — but the failing tasks mean stat leaders, schedules, and player stats are **silently not being persisted** to Postgres for the large payloads.

**Update 2026-07-07 (environment facts — these amplify the diagnosis below):**

- The database is **not local**. `api/.env` sets no `DATABASE_URL`, so `connectionConfig.js` falls back to `CACHE_DATABASE_URL`, which points at a **Neon Postgres in us-east-1**. Both the cache pool and the domain pool write to Neon over the internet; the logged timeouts were against Neon, and production (Render) uses the same database.
- **Latency amplification.** The diagnosis below says the transaction lock is "held for seconds" — that assumed sub-millisecond local round trips. Against Neon each round trip is ~20–100ms, so a ~4,000-query schedule transaction holds the `seasons` row lock for **minutes**, and a colliding same-season task blowing the 5s `query_timeout` is near-guaranteed, not bad luck. Batching is therefore doubly the right fix: it shortens the lock hold (the contention bug) *and* collapses the network round trips (the latency cost).
- **Neon free-tier autosuspend.** Neon scales compute to zero after idle; the first query after wake-up pays a cold start that can take a few seconds and may trip the 5s timeout **even after this fix**. A one-off timeout right after a long idle period is that transient, not this bug — do not chase it, and do not raise the timeout for it.
- **This ticket is also the "data survives Render restarts" fix.** Render's free-tier disk is ephemeral, but the raw NHL cache already persists in Neon's `app_cache`; it is exactly these failing domain writes that are not persisting. Once this lands, remaining work is just deploy verification (explicit `DATABASE_URL` or documented fallback, Render env vars, migrations run against Neon, `/health/cache-usage` check) — small enough to fold into this ticket's step 5 rather than a separate ticket.

**Diagnosis (verified in code, not just from the stack trace):**

- All five domain persist services (`statLeaderService`, `scheduleService`, `playerStatsService`, `teamService`, `rosterService` in `api/services/domain/`) share one pattern: open a transaction, call `seasonsRepository.upsertSeason(...)` **first**, then loop over the payload doing sequential single-row upserts.
- In Postgres, that first upsert takes a row-level lock on the `seasons` row **held until COMMIT**. A season schedule is ~1,300 games × 3 queries (2 team upserts + 1 game upsert) ≈ 4,000 sequential round trips, so the transaction — and the lock — is held for seconds.
- `runServiceTask` dedupes by label only, so a single page load fires several of these concurrently for the *same season*. The second task's very first query (`upsertSeason` on the same row) blocks on the first task's lock, exceeds the pool's `query_timeout: 5000` (`api/db/pool.js`), and dies with `Query read timeout`. The two schedule tasks additionally collide with each other on the shared `teams` rows.
- Raising the timeout would only hide the contention; the fix is to make the transactions short.

**Fix, in order of leverage:**

- **Batch the per-row upserts** into multi-row `INSERT ... VALUES (...), (...) ON CONFLICT ... DO UPDATE` statements (chunked), collapsing thousands of round trips into a handful of queries. This is the real fix — the transaction drops from seconds to milliseconds.
- **Move `upsertSeason` to the end of each transaction** so the one row every same-season task touches is locked last and briefly.
- **Serialize the background tasks** (concurrency-1 queue in `runServiceTask`) as a cheap structural guard — none of these tasks are latency-sensitive.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). This is a concurrency bug, so before any code: explain row-level locks, why ON CONFLICT upserts take them until COMMIT, and how the current code deadlocks itself into timeouts. Then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/. Background domain-persistence tasks time out under lock contention; this ticket batches their writes and serializes the task runner.

READ FIRST: docs/cleanup-backlog.md section C8 INCLUDING the environment-facts update (the DB is a remote Neon instance, not local — it changes the latency math and adds an autosuspend caveat), api/db/connectionConfig.js (the DATABASE_URL → CACHE_DATABASE_URL fallback), api/db/pool.js (the 5s query_timeout), api/services/domain/runServiceTask.js, all five persist services in api/services/domain/ (statLeaderService, scheduleService, playerStatsService, teamService, rosterService — same transaction-then-loop pattern), and the repositories they call in api/db/repositories/ (seasonsRepository, playersRepository, statLeadersRepository, teamsRepository, scheduleGamesRepository, playerStatsRepository, rostersRepository).

STEPS (pause after each):
1. Reproduce and confirm the diagnosis: load the site landing + schedule pages, watch the API logs for "Query read timeout", and explain to me which two tasks collided and on which row. Remember the DB is Neon over the internet (~20–100ms per round trip), so a schedule transaction holds its locks for minutes — reproduction should be easy. CAUTION: a single timeout on the very first query after the app has been idle is likely Neon autosuspend cold start, not this bug; distinguish the two for me.
2. Add multi-row upsert functions to the repositories the loops call: upsertTeams, upsertPlayers, upsertStatLeaders, upsertScheduleGames, upsertPlayerSeasonStats, upsertRosterEntries. Each builds one INSERT ... VALUES (...),(...) ON CONFLICT ... DO UPDATE with the same column/COALESCE semantics as its single-row sibling. Two hard requirements you must explain to me: (a) DEDUPE rows by conflict key first — a multi-row upsert that touches the same key twice throws "cannot affect row a second time" (schedule payloads repeat the same ~32 teams ~80x each); (b) CHUNK the VALUES list (e.g. 200–500 rows per statement) to stay far below pg's 65,535 bind-parameter limit. Keep the single-row functions if anything else still uses them; delete them if not.
3. Convert the five persist services to use the batch functions: collect the mapped rows into arrays, dedupe, then a handful of batched statements per transaction. Move upsertSeason to the END of the transaction in all five, so the hottest shared row is locked last and held for milliseconds. Keep the returned counts ({playersUpserted, leadersUpserted, ...}) meaning what they meant (unique rows written).
4. Serialize the runner: in runServiceTask.js, keep the by-label dedupe but chain tasks through a single promise queue (concurrency 1) instead of letting them all run at once. These are background write-through tasks — throughput doesn't matter, contention does. The function's signature and fire-and-forget contract must not change for callers.
5. Verify: restart the API, hard-load the landing page, schedule page (multiple seasons), and a team page. Logs must show zero "Query read timeout" / "Domain service task failed" lines (one transient timeout immediately after a long idle = Neon cold start; rerun before worrying), and spot-check the DB: SELECT count(*) FROM schedule_games WHERE season_id='20252026'; and the stat_leaders rows for the current season should be populated. Then the deploy half: confirm Render's env vars point at the same Neon DB (set an explicit DATABASE_URL or document the CACHE_DATABASE_URL fallback in docs/architecture.md), confirm migrations have been run against Neon, redeploy, and check /health/cache-usage reports Postgres mode plus the same DB spot-checks — this is what makes domain data survive Render's ephemeral-disk restarts.

INVARIANTS:
- Same rows end up in the DB as the single-row version would have written — batching changes performance, not semantics (COALESCE update rules included).
- No API response contract changes; these tasks stay fire-and-forget.
- Do NOT raise DATABASE_TIMEOUT_MS / query_timeout as the fix — if 5s still trips after batching (other than the known one-off Neon cold-start transient after idle), something is wrong; find it.
- One commit per step (steps 2–3 may be one commit per table/service pair if that reviews easier).

DONE WHEN:
- cd api && pnpm test passes (add/adjust unit tests for the dedupe + chunking helpers).
- The step-5 manual check shows clean logs and populated tables for a fresh season load, locally AND on the Render deployment after a restart.
- docs/architecture.md's domain persistence section notes the batched-write + serialized-runner design and which env var production uses for the domain pool; this box is ticked.
```

## C9 Post-merge leftovers from the C1–C8 cleanup

- [ ] **Owner:** Either

Found 2026-07-14 in a post-merge review of PR #50. Two small stragglers; both are pure deletions with zero behavior change.

- **`react-error-boundary` is listed in `api/package.json` dependencies.** It's a React library — the C7 error-boundary work added it to the correct place (`react/package.json`), but a copy landed in the backend package too. Nothing in `api/` imports it; remove it.
- **`ListOfTeamsContext` still has a dead `localStorage` write.** C5 step 2 removed the `listOfTeams-key` *read* (freshness is now owned by the backend cache), but `localStorage.setItem('listOfTeams-key', JSON.stringify(finalTeamData))` in `GetTeams` survived. Nothing reads the key anymore — every load overwrites it and it just accumulates stale bytes in users' browsers. Delete the line (optionally `localStorage.removeItem('listOfTeams-key')` once, but a leftover key is harmless enough that a plain delete is fine).

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain how each leftover got left behind before we delete it; then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — Express backend in api/, Vite React frontend in react/. Two pure deletions left over from the C1–C8 cleanup merge (PR #50).

READ FIRST: docs/cleanup-backlog.md section C9, api/package.json, react/src/Data/Context/ListOfTeamsContext.tsx.

STEPS (pause after each):
1. Verify then remove react-error-boundary from api/package.json dependencies (grep -rn "react-error-boundary" api --include='*.js' excluding node_modules must return nothing — the real usage is react/src/App.tsx, which keeps its own copy in react/package.json). Then cd api && pnpm install && pnpm test.
2. Delete the localStorage.setItem('listOfTeams-key', ...) line from GetTeams in react/src/Data/Context/ListOfTeamsContext.tsx (grep first to confirm nothing reads 'listOfTeams-key'). cd react && npx tsc --noEmit && pnpm build.

DONE WHEN:
- cd api && pnpm test passes; cd react && npx tsc --noEmit and pnpm build pass.
- Manual smoke: team list page still renders team stats; landing page unaffected.
- grep confirms no reference to listOfTeams-key remains, and react-error-boundary appears only in react/package.json; this box is ticked.
```
