# Test fixtures and coverage

`fixtures/` is the home for reusable mock data, domain builders, and API doubles.
Related fixtures share a domain module (players, teams, reports, feed, standings,
matchup, and board-game state). Use a builder with explicit scenario overrides;
keep boundary inputs and expected outputs beside the assertion. Builders return
fresh objects so tests can safely change their own state. Exported scenario
constants are read-only by convention: clone them before mutation.

Mock lifecycle (resetting spies, stubbing globals, fake timers) belongs in the
test. `account.mjs` also serves the Spotter sign-in spec without requiring a
TypeScript loader. Browser and service-worker harness behavior stays with its
own tests.

Run from `react/`:

- `pnpm test` — unit suite.
- `pnpm test:coverage` — V8 coverage, with fixtures excluded, written to `coverage/`.
- `pnpm tsc`, `pnpm build`, `pnpm format:check` — repository checks.

## Consolidation evidence (2026-10-28)

The suite decreased from **262 to 257 tests**, with all 60 test files retained.
The removed cases repeated parser ordering/limits, sorting setup, and string
length boundary setup. Their checks remain in normalization, stable-sort and
text/emoji boundary scenarios. The stable-sort scenario now checks the entire
original list for mutation; trimmed emoji boundaries are also checked.

Every measured production file has identical before/after statement, branch,
function, and line coverage. Coverage measures modules imported by the unit
suite, not the entire application or browser journeys:

| Metric | Before | After |
| --- | --- | --- |
| Statements | 2111/2438 (86.58%) | 2111/2438 (86.58%) |
| Branches | 1356/1705 (79.53%) | 1356/1705 (79.53%) |
| Functions | 569/640 (88.90%) | 569/640 (88.90%) |
| Lines | 1874/2140 (87.57%) | 1874/2140 (87.57%) |

The original raw report included `player-compare/utils/testPlayers.ts` as
production code (six covered statements, functions, and lines). The comparison
above excludes that fixture from the baseline, matching its new home under
`src/test/`; no production files were excluded to obtain this result.

Unit tests, coverage, typecheck, build, and format check passed. The changed
Spotter spec and its shared fixture passed Node syntax checks; browser execution
remains Spotter's responsibility and was not run for this test-only refactor.
