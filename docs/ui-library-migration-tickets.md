# Aero/MD3 UI Library Migration Tickets

PM handoff for coordinated work across:

- `aero-md3-core` — `/home/chris/programming-projects/aero-md3-core`
- `HockeyStatsWebApp` — `/home/chris/programming-projects/HockeyStatsWebApp`

## Operating contract

- The PM coordinates only; subagents write code, tests, docs, and manifests.
- Use fresh, narrow subagent context. Do not give an agent the whole repository.
- A subagent may work in only one repository per ticket unless a ticket explicitly names both.
- The PM may run read-only checks and delegate implementation, but must not edit application code.
- Parallel work is allowed only when the dependency below says `parallel`.
- Stop and ask the human when a decision changes public API, visual language, accessibility semantics, browser support, or user-visible behavior.
- Do not add a runtime dependency to `aero-md3-core`.
- Preserve HockeyStats functionality and routes throughout the migration.

## Dependency graph

```text
AERO-01 ─> AERO-02 ─> AERO-03 ─┐
HSW-01 ─> HSW-02 ──────────────┼─> HSW-03 ─> HSW-04 ─> HSW-05
                               ┘
```

`AERO-01` and `HSW-01` are parallel. `AERO-02` starts after both the design contract and the HockeyStats inventory; `HSW-02` can proceed after the inventory in parallel with AERO-02. The PM should publish a library version before `HSW-03` starts.

## AERO-01 — Define the cross-project design-system contract

**Repository:** `aero-md3-core`

**Goal:** Establish the smallest stable Aero/MD3 public API before adding components.

**Read:** `README.md`, `package.json`, `src/core.css`.

**Subagent instructions:** Inventory existing `--ds-*` tokens and `.ds-*` classes. Propose a compact contract for color roles, typography, spacing, shape, elevation, motion, focus, disabled, hover, pressed, selected, and error states. Do not redesign existing values without a documented reason. Update the README with usage and compatibility policy. Add a dependency-free check that rejects domain-specific names and verifies every public token/class listed in the README.

**Done when:** The README and stylesheet agree; the package still has zero runtime dependencies; `pnpm check` passes; unresolved visual decisions are reported to the PM rather than guessed.

## AERO-02 — Add CSS-first layout and control primitives

**Repository:** `aero-md3-core`

**Goal:** Replace the Bootstrap capabilities HockeyStats actually uses with reusable, semantic CSS primitives.

**Read:** AERO-01 output, `src/core.css`, HockeyStats usage inventory from HSW-01.

**Subagent instructions:** Add only primitives justified by the inventory: page/container shell, responsive stack/cluster/grid, button variants, field/input states, surface/card, divider, focus ring, and modal/backdrop styling hooks. Prefer classes and custom properties over framework-like selectors. Do not ship React components, JavaScript, icon assets, reset rules, or domain names. Include reduced-motion and keyboard-focus behavior.

**Done when:** The public CSS API is documented with minimal HTML examples; a small fixture or static test covers responsive layout and control states; `pnpm check` passes; no runtime dependencies are added.

## AERO-03 — Release and compatibility verification

**Repository:** `aero-md3-core`

**Goal:** Publish a migration-safe library release for the consumer app.

**Subagent instructions:** Review the public API for accidental breaking changes, update the version using the repository’s normal release process, and document migration notes. Keep old tokens/classes unless the human explicitly approves removal. Verify the package tarball contains only intended files and that a clean consumer can import `@chrisgawbill/aero-md3-core/core.css`.

**Done when:** `pnpm check` passes from a clean install; the PM has the exact version and migration notes; no consumer-specific code is added.

## HSW-01 — Inventory Bootstrap and candidate replacements

**Repository:** `HockeyStatsWebApp`

**Goal:** Produce a precise migration map without changing behavior.

**Read:** `react/package.json`, `react/src/app/index.tsx`, all files importing `react-bootstrap`, `react/src/styles/*.css`, and the app routes.

**Subagent instructions:** Record each Bootstrap/react-bootstrap use with file, component, semantic purpose, required states, responsive behavior, and proposed Aero primitive. Separately identify unused packages (`react-horizontal-scrolling-menu`, stale root dependencies, and type packages incorrectly placed in runtime dependencies). Do not edit source. Flag any behavior that cannot be preserved with CSS-first primitives.

**Done when:** The inventory is a compact table checked into the ticket or returned to the PM; it distinguishes safe deletion from migration work; no visual/API decisions are silently made.

## HSW-02 — Remove proven dead dependencies and correct manifest categories

**Repository:** `HockeyStatsWebApp`

**Goal:** Reduce dependency noise with zero application behavior change.

**Read:** HSW-01 inventory, `package.json`, `react/package.json`, lockfiles.

**Subagent instructions:** Remove `react-horizontal-scrolling-menu` only after repository-wide usage is confirmed absent. Remove stale root `20` and `node` dependencies if the root remains metadata-only. Move `@types/node`, `@types/react`, and `@types/react-dom` to `devDependencies`. Do not remove `@emotion/react`; the table library declares it as a peer dependency. Regenerate only the relevant lockfile with pnpm. Do not replace Bootstrap in this ticket.

**Done when:** `cd react && pnpm install --frozen-lockfile && pnpm tsc && pnpm build && pnpm test` pass; the removed packages have no source references; the manifest has no accidental runtime type dependencies.

## HSW-03 — Migrate layout and simple controls to Aero

**Repository:** `HockeyStatsWebApp`

**Depends on:** AERO-03 and HSW-02.

**Goal:** Migrate grid, container, row/column, button, button-group, and simple form usage while preserving rendered behavior.

**Read:** HSW-01 inventory, AERO-03 migration notes, affected `react/src` files and CSS Modules.

**Subagent instructions:** Replace React-Bootstrap layout/control components with semantic HTML plus Aero classes and local CSS Modules where feature-specific. Preserve labels, focus order, disabled/pressed states, links, responsive breakpoints, and route behavior. Avoid broad formatting changes. Keep modal and table migration for later tickets.

**Done when:** No migrated file imports `react-bootstrap`; typecheck, tests, and build pass; browser smoke checks cover landing, standings, schedule, team list, team, matchup, and board-game routes at desktop/mobile widths.

## HSW-04 — Migrate dialogs and remaining Bootstrap styling

**Repository:** `HockeyStatsWebApp`

**Depends on:** HSW-03.

**Goal:** Replace React-Bootstrap Modal usage and remove the Bootstrap stylesheet without changing interaction behavior.

**Subagent instructions:** Implement or compose an app-local semantic dialog using Aero hooks/classes. Preserve escape-to-close, backdrop behavior, focus handling, close buttons, scroll behavior, and accessible labeling. Migrate `TeamListModal` and `StatsLeaderModal`, then remove the Bootstrap CSS import and any now-unused Bootstrap imports. Do not introduce a dialog dependency.

**Done when:** Modal keyboard and screen-reader semantics are verified; all existing modal flows work; `bootstrap` and `react-bootstrap` are absent from `react/package.json`; build/tests/typecheck pass; selected browser screenshots show no material regression.

## HSW-05 — Add the Aero table primitive and migrate the table surface

**Repositories:** `aero-md3-core`, `HockeyStatsWebApp`

**Depends on:** HSW-04.

**Goal:** Make Aero/MD3 the cross-project table language, then remove the remaining table-library dependency when HockeyStats behavior is preserved.

**Subagent instructions:** In `aero-md3-core`, add the smallest additive, domain-neutral CSS contract for a semantic table: table surface, header/cell spacing, row dividers, alternating rows, focus treatment, sortable-header button styling, and horizontal overflow. Document the new classes in the README and keep the package CSS-only. In `HockeyStatsWebApp`, replace `CompactTable` with semantic native `<table>` markup using the Aero classes; keep NHL-specific sorting rules, row navigation, clinch/status cells, fixed layout, responsive overflow, theming, and accessible labels in the app. Migrate the stat-leader modal table and remove the unused game-detail theme import. Only remove `@table-library/react-table-library` and `@emotion/react` after build, typecheck, tests, and rendered browser checks pass. Do not change existing Aero token names or values, add a dialog/table runtime dependency, or refactor unrelated tables.

**Done when:** Aero documents and ships the additive table classes; HockeyStats uses native tables with equivalent behavior; the table library and `@emotion/react` are absent from the frontend manifest/lockfile; dependency/build/lockfile checks pass; selected desktop/mobile rendered checks show no material regression. If the replacement cannot preserve behavior without substantial app-specific framework code, stop and document keeping the library instead.

## PM verification and human escalation

The PM should request human input before approving any of these decisions:

- changing token names or existing token values;
- choosing exact breakpoints, typography, motion, contrast, or component interaction rules;
- changing dialog focus semantics or table behavior;
- removing a public library class/token for compatibility reasons;
- accepting a screenshot regression as intentional.

For each completed ticket, report only: changed repository/files, checks run, dependency count before/after where relevant, and open decisions. Do not paste successful command logs.
