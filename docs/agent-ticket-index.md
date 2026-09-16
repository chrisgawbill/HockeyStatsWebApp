# Agent Ticket Index

Compact tickets for agent-driven work. States are `IDEA`, `READY`, `ACTIVE`,
`BLOCKED`, and `DONE`; only the Product Owner promotes an `IDEA` to `READY`.

## DEP-01 — Replace Axios with the native Fetch API

**State:** IDEA

**Goal:** Remove Axios and its transport-specific types without changing API
behavior, error handling, authentication, diagnostics, or the 15-second request
timeout.

**Read:** `docs/architecture.md` (API Boundary and Frontend directory tree),
`react/package.json`, `react/src/lib/apiClient.ts`,
`react/src/lib/genAIHandler.ts`,
`react/src/features/board-game/api/streakSync.ts`,
`react/src/features/board-game/api/streakSync.test.ts`, and the feature API
modules that import `@/lib/apiClient`.

**Change:** Reimplement the existing `get`, `post`, and `put` boundary with
browser-native `fetch`, URL query serialization, JSON request/response handling,
and a 15-second abort timeout. Replace `AxiosRequestConfig` with the smallest
local options type needed by current callers (headers only). Throw a small
status-bearing error for non-2xx responses so `fetchSession` can continue to
map only HTTP 401 to `null`; update its tests to use transport-neutral errors.
Remove `axios` from the manifest and regenerate only the React lockfile.

**Keep:** `VITE_API_URL` behavior and development fallback; omission of null,
undefined, and empty-string query values; caller-supplied headers; JSON payloads;
API failure logging; the AI response fallback parser; all public helper and
feature API return types; existing user-facing error behavior.

**Do not:** Add another HTTP dependency, introduce interceptors/retries, change
endpoints or credentials behavior, broaden the API abstraction, migrate unrelated
callers, remove `react-error-boundary`, or remove `@types/node`.

**Done when:** Focused `apiClient` tests cover base URL/query construction,
headers, object and pre-serialized JSON bodies, successful JSON responses,
non-2xx status errors, and timeout/abort behavior; streak-session tests prove
401 returns `null` and other failures rethrow; no source or test imports Axios;
`axios` and its now-unneeded lockfile entries are gone; from `react`, `pnpm tsc`,
`pnpm test`, `pnpm build`, and `pnpm format:check` pass.

## Dependency audit decisions — no ticket

- `react-error-boundary`: keep. It has one focused app-level use, no runtime
  dependencies beyond React, and its roughly 1.2 KB gzip implementation owns
  error extraction and reset behavior that a local class boundary would need to
  recreate with more application code.
- `@types/node`: keep. `vite.config.ts` imports `node:url`, and both Vite and
  Vitest declare Node types as optional peer tooling. Removing the explicit
  package would weaken config/editor type support without simplifying runtime
  code or the production bundle.
- `@chrisgawbill/aero-md3-core`, React Router, React, and React DOM: keep as
  active design-system, routing, and framework infrastructure.
- Vite, Vitest, the React plugin, TypeScript, Prettier, and React type packages:
  keep. Each is directly exercised by the current scripts, config, compilation,
  or JSX typechecking; transitive packages should continue to be managed through
  normal tool upgrades rather than manual pinning.
