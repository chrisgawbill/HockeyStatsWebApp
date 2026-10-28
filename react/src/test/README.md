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

## Spotter integration

After updating to `origin/main` (`32bbc7e1`), the combined suite has 305 tests.
The coverage thresholds in `vite.config.ts` use that measured baseline:
87.84% statements, 80.60% branches, 90.54% functions, and 88.86% lines.
These still measure imported production modules; they are not whole-app or
browser coverage. `pnpm test:coverage` fails when a metric drops below its floor.

Spotter owns the machine-local project configuration. Apply these entries to
`Spotter/projects/hockeystats-webapp.yml`, retaining the other checks and web
settings:

```yaml
checks:
  - name: unit-tests
    run: pnpm exec vitest run --coverage --reporter=json --outputFile={output}
    repro: pnpm test:coverage
    parser: vitest
coverage:
  required: [typecheck, unit-tests, format, specs]
  minSpecs: 106
web:
  specs:
    files: ['qa/*.spec.mjs', 'qa/*.journey.mjs']
    workers: 2
```

The globs discover all seven current spec files (106 tests in one browser),
including the weekly-report spec that exists on current main. They avoid
stale explicit lists when another spec is added. Update `minSpecs` when
intentionally consolidating or adding browser scenarios. Spotter's low level
uses its `@critical` selection and intentionally drops the full-suite minimum.

Home-loading already tests recovery of skaters, goalies, and standings, so
there is no additional duplicate recovery journey. The skater case is now
critical and checks that Retry is enabled, loading clears, content returns,
and no uncaught page errors occur. Normal runs still execute all six home
loading cases. Unit tests retain retry timing and error-classification details;
browser tests verify the user can recover through the rendered controls.

To run from Spotter after the branch is pushed:

```sh
bin/spotter run hockeystats-webapp --ref feature/spotter-test-integration
```

Spotter reports a nonzero Vitest coverage exit as a failed check even if every
test passed. This was verified by temporarily overriding the line threshold to
100% in the command (without changing the committed configuration).

### Verification after updating main (2026-10-28)

- Unit coverage, typecheck, build, and format passed (305 unit tests).
- Focused Spotter run `qa-test-integration/20261028-033312-working-tree-7c5d7f6c`
  passed all 106 browser specs and both home/team desktop visits, with the
  minimum of 106 enforced. Accessibility, keyboard sweep, generic fault visits,
  rules, and baseline comparison were outside that focused run.
- The real `hockeystats-webapp` low run
  `20261028-033430-working-tree-b84b1670` completed both critical specs and
  home/matchup phone visits. It passed with one advisory keyboard finding;
  low intentionally excludes the full browser matrix and full-suite minimum.
- Initial browser verification exposed two missing recordings introduced by
  newer main: `GET /player/stats/version` and `GET /team/schedule/TOR`. Both
  were captured from the local API and added to Spotter's machine-local fixture
  map without changing existing responses or its frozen clock. The second run
  passed; do not suppress missing-response assertions when updating fixtures.
