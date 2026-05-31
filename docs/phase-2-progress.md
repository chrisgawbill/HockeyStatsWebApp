# Phase 2 Progress Log

A working journal for the Phase 2 roadmap (see [phase-2-backlog.md](./phase-2-backlog.md)).
Each task has two sections to fill in as it gets worked:

- **What I have done** — the concrete changes that shipped (files, endpoints, components).
- **What I have learned** — the concepts, gotchas, and decisions worth remembering later.

Status legend: ☐ not started · ◐ in progress · ☑ done

---

## ☑ 2.1 — API health, diagnostics, and environment visibility

**Completed:** 2026-05-31

### What I have done

- Added `GET /health` and `GET /health/cache-usage` in a dedicated route module `api/routes/health.js`, mounted at `/health` in `api/app.js`.
- `/health` returns: `status`, `version` (from `api/package.json`), `environment`, `currentSeason` (from `seasonHelper.getCurrentSeasonId()`), `cacheWritable`, `anthropicKeyConfigured`, `uptime`, and `currentTime`.
- `/health/cache-usage` reports per-section cache sizes in bytes, the largest section, and the total.
- Added cache helpers `isCacheWritable()` and `getCacheUsage()` (with a `dirSize()` helper) to `api/utils/cacheManager.js`.
- Added passphrase auth in `api/utils/auth.js`: `matchesPassphrase` (SHA-256 + `crypto.timingSafeEqual`, fails closed if `DIAGNOSTICS_PASSPHRASE` is unset) and an `authCheck` middleware applied via `router.use(authCheck)`.
- Allowed the `x-diagnostics-key` header in CORS `allowedHeaders` in `api/app.js` so browser preflight succeeds.
- Added frontend service functions `GetHealth(passphrase)` and `GetCacheReport(passphrase)` in `react/src/Services/ApiHandler.ts`, passing the passphrase in the `x-diagnostics-key` header.
- Added an unlinked `DiagnosticsPage` (`react/src/Pages/DiagnosticsPage.tsx`) at the `/diagnostics` route, with a passphrase gate, status grid, and cache-usage table. Styled in `react/src/style/DiagnosticsPage.module.css`.
- Passphrase is kept in `sessionStorage` so a refresh stays authenticated within the tab; wrong passphrase (401) and unreachable API are caught and surfaced without crashing the app.
- `DIAGNOSTICS_PASSPHRASE` stored only in `api/.env` (gitignored).
- Documented the whole layer in `docs/architecture.md` (Diagnostics Layer section).

### What I have learned

- **The backend is the only real gate.** A static SPA ships its source to the browser, and the Express endpoints are publicly reachable, so any "development-only" or hidden check in React is bypassable. Enforcement has to live in server middleware (`authCheck`), not the UI. The unlinked `/diagnostics` route is "hidden" only by obscurity — acceptable *because* the server enforces access.
- **Pass secrets in a header, not a query string.** Query strings leak into request logs and browser history; the `x-diagnostics-key` header avoids that. Custom headers also require listing in CORS `allowedHeaders` or the browser preflight fails.
- **Constant-time comparison matters for secrets.** Hashing both sides with SHA-256 first gives equal-length buffers for `timingSafeEqual` and avoids leaking length or short-circuiting early on the first differing byte.
- **Fail closed.** If `DIAGNOSTICS_PASSPHRASE` is unset, auth returns false rather than allowing access.
- **Report status, never raw secrets.** The Anthropic key is exposed only as `anthropicKeyConfigured: Boolean(...)`.
- **Keep formatting churn out of feature diffs.** This change carried a lot of Prettier/tabs reformatting mixed with the real edits, which makes review harder — formatting-only changes belong in a separate commit.

---

## ☑ 2.2 — Normalize API response contracts

**Completed:** 2026-05-31

### What I have done

- Added a backend normalization layer (anti-corruption layer) in `api/services/mappers/`: `scheduleMapper.js`, `standingsMapper.js`, `rosterMapper.js`, and `playerMapper.js`. Each shape is documented with a JSDoc `@typedef`.
- Normalized six shapes: `ScheduleGameContract` (+ `GameBroadcastContract`), `StandingsTeamContract`, `RosterPlayerContract`/`RosterContract`, `SkaterSummaryContract`, `GoalieSummaryContract`, and `StatLeaderContract`.
- `scheduleMapper.mapGame(rawGame, { date, dayAbbrev })` serves both schedule sources (weekly `/schedule/` and club `/team/schedule/:triCode`), which supply the date differently. Playoff round/series logic and broadcast mapping that were duplicated in `ScheduleHelper.ts` and `TeamPage.tsx` now live here once.
- Wired the routes to map **after** `GetOrFetch` so the cache keeps storing raw NHL data: `standings.js`, `schedule.js`, `team.js` (roster + schedule), and `player.js` (skater/goalie summary + skater/goalie stat leaders).
- Updated frontend callers and deleted the duplicated transforms: `ScheduleHelper.ts` (now wraps contracts), `ScheduleContext.tsx`, `LeagueStandingsHelper.ts`, `PlayerStatLeaderConverter.ts`, `useStatLeaders.ts`, and `TeamPage.tsx` (removed `transformSchedule`, `convertBroadcasts`, `getDayOfWeek`; simplified `transformRoster`/`transformPlayerStats`).
- Added defensive fallbacks throughout (guarded `.default` unwraps, `venue?.default ?? ""`, `faceoffWinPct > 0 ? value : null`). The guarded `.default` unwrap in `mapStatLeaders` fixed a latent crash where a missing player/team name would throw and silently empty a stat category.
- Documented the layer in `docs/architecture.md` (new "Backend Response Contracts" section, plus route/helper/convention updates).
- Verified: all backend route modules `require()` cleanly and `tsc --noEmit` passes with no errors.

### What I have learned

- **Push the anti-corruption layer to the boundary.** Raw NHL JSON was leaking all the way into React, so the same field-extraction lived in multiple places and drifted. Normalizing once at the backend boundary means an NHL field rename is a one-mapper fix.
- **Separate shape translation from app logic.** Only raw-field extraction moved to the backend. App/derived/display logic (draft-lottery odds, TOI formatting, `pointsPctg` rounding) stayed on the frontend — the mapper should not own those.
- **Map after `GetOrFetch`, not inside it.** Caching raw and mapping on the way out means mapper changes never require a cache clear and old cache entries stay compatible. Mapping is cheap; correctness/flexibility wins.
- **Watch shape changes that ripple into logic.** Emitting `homeScore: null` (instead of the raw `undefined`) broke a `=== undefined` check in `ScheduleContext.doesGameNeedToUpdate`; fixed by comparing with `== null`.
- **Field-name bugs are silent.** `teams.home.team.abbrev` vs `homeTeam.abbrev`, `gameId` vs `id`, `ticketLink` vs `ticketsLink` all return blank instead of throwing — the existing frontend helpers are the source of truth for verifying these.
- **Flag unverified assumptions.** The goalie summary stat field names (`savePct`, etc.) weren't exercised by the old frontend, so they're best-guesses left with a `NOTE` and `?? null` guards — worth confirming against a live response.

---

## ☐ 2.3 — Season and date range controls

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.4 — Schedule search, filters, and team calendar

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.5 — Enhanced game detail pages

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.6 — Team page depth: roster, schedule, leaders, and history

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.7 — Player profile pages

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.8 — Favorites and personalized dashboard

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.9 — Advanced standings and playoff race views

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.10 — Search across teams, players, and games

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.11 — AI history hardening and source separation

### What I have done

_TODO_

### What I have learned

_TODO_

---

## ☐ 2.12 — Test coverage and release readiness

### What I have done

_TODO_

### What I have learned

_TODO_
