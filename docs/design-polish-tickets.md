# HockeyStats Design Polish Tickets

Run one ticket per fresh PM session, in order. After PASS: commit, mark complete, stop. Chris clears context before the next ticket.

## Agent protocol — applies to every ticket

**PM = brain. Coding agents = hands.**

PM responsibilities:
- Read the ticket and inspect only enough code to determine the correct implementation.
- Own architecture, scope, tradeoffs, sequencing, acceptance criteria, and defect diagnosis.
- Give coding agents exact execution contracts: files/scope, required edits, invariants, and verification commands.
- Review diffs/results and decide PASS/FAIL. On failure, send only the concrete defect + required correction back to a coding agent.
- PM writes no application code.

Coding-agent contract:
- **Do not plan, redesign, explore alternatives, explain architecture, or critique the ticket.** The PM already made those decisions.
- Read only the files needed for the assigned execution task. Make the requested edits directly.
- No unrelated cleanup, refactors, dependencies, or scope expansion.
- Run only the checks requested by the PM.
- Return compactly: `DONE` or `BLOCKED`; changed files; checks + result; blocker if any. No narrative unless asked.

Loop: `PM inspect/decide → coder execute → PM review → targeted coder fix if needed → PASS`.
Maximum 3 defect cycles; then PM stops and escalates the unresolved defect to Chris. On PASS, PM gives at most 3 sentences and does not start another ticket.

Global constraints: preserve routes, data behavior, keyboard behavior, dark mode, and features. Prefer small changes. Reusable Aero/MD3 design-system rules belong in `aero-md3-core`; HockeyStats layout/domain styling stays local. Visual tickets require rendered browser QA. Accessibility includes visible focus, readable contrast, >=44px mobile targets where appropriate, reduced motion, semantic structure, and non-hover equivalents.

---

## [x] UI-01 — Global navigation, mobile nav, and season selector

**Goal:** Full-width intentional desktop chrome and uncluttered, safe-area-aware mobile navigation.

**PM inspect:** `PageHeader`, `SeasonSelector`, app shell/page-bottom spacing, their CSS modules, and relevant `aero-md3-core` primitives. Decide the smallest fix; use/add a shared primitive only if genuinely reusable.

**Coder execution requirements:**
- Desktop chrome spans viewport independently of constrained page content; remove Bootstrap-gutter/negative-margin sizing hacks.
- Rebalance brand/search/season/nav/utility spacing.
- Mobile bottom nav is full-width and safe-area aware with five equal stable slots, no wrapping at 320px, >=44px targets, and active styling that does not move neighbors.
- Season selector is structurally separate secondary chrome, not an absolute pill requiring magic nav padding; menu stays in viewport and normally opens upward.
- Search/back cannot collide with or shrink primary nav.
- Reserve real fixed-chrome height so final page content scrolls above it.

**Do not:** add nav dependencies, change routes, use a hamburger for primary destinations, shrink targets, or patch layout with arbitrary z-index/padding hacks.

**PASS:** Browser QA desktop + 320/375/390/430px, including season menu open. No overlap/overflow; five stable destinations; safe area works; final content clears chrome; keyboard focus and active states work in light/dark.

---

## [x] UI-02 — One page-shell and spacing system

**Goal:** Consistent content width, gutters, and vertical rhythm without accidental empty zones.

**PM inspect:** shared/global styles, landing CSS, representative page-level modules, and Aero spacing/layout tokens. Identify the smallest shared page-shell/spacing contract and exact consumers to migrate.

**Coder execution requirements:**
- Establish one content width, horizontal gutter, section gap, and page top/bottom spacing scheme.
- Replace only ad-hoc spacing that conflicts with that scheme.
- Use `--ds-space-*` directly or thin HockeyStats semantic aliases; do not maintain a competing spacing scale.
- Tighten accidental hero/introduction-to-content gaps.
- Compress spacing appropriately on mobile while retaining edge gutters.

**Do not:** change content order or mass-format unrelated CSS.

**PASS:** Landing, standings, schedule, teams, team detail, matchup, and primary stats pages show consistent desktop/mobile rhythm with no new overflow or content-order changes.

---

## [X] UI-03 — Landing hierarchy and game-card readability

**Goal:** Make page title → section → matchup → status/meta obvious at a glance, especially on mobile.

**PM inspect:** landing/schedule components, game cards, rivalry treatment, and shared surface primitives. Decide which visual rules are shared versus hockey-specific.

**Coder execution requirements:**
- Reduce dead space between intro and first meaningful section.
- Distinguish section headings from card titles through hierarchy, not indiscriminate font growth.
- Prioritize matchup/team/score-or-time information; secondary metadata next; badges/status last.
- Keep teams, logos, score/time, rivalry/preseason/status readable on phone widths.
- Use restrained semantic rivalry styling and shared Aero surfaces where appropriate.
- Avoid nested decorative boxes, excessive shadows, and per-element gradients.

**PASS:** Desktop + phone browser QA shows the intended hierarchy immediately, with readable mobile cards and no clutter/overflow in light/dark.

---

## [X] UI-04 — Consolidate duplicated Aero design recipes

**Goal:** Remove HockeyStats' duplicate mini design system while preserving domain styling.

**PM inspect:** global/theme/shared CSS, repeated component recipes, and `aero-md3-core/src/core.css`. Inventory duplicates and decide exactly which belong in Aero versus HockeyStats before dispatching edits.

**Coder execution requirements:**
- Consolidate reusable spacing, typography, radii, elevation, surfaces, focus, hover/pressed motion, and glass recipes into existing or minimal additive Aero tokens/classes.
- Keep rink/team/gameplay/rivalry domain tokens local where domain-specific.
- Replace duplicate local recipes with Aero primitives or thin semantic wrappers.
- Remove aliases only after all consumers are migrated.
- Keep `aero-md3-core` CSS-first; no React components.

**PASS:** Shared visual rules have one source of truth; HockeyStats CSS is primarily layout/domain styling; visual parity and light/dark/focus states are verified in browser QA.

---

## [x] UI-05 — Data surfaces, chips, and controls

**Goal:** Make dense hockey data easier to scan while keeping the UI light.

**PM inspect:** representative standings/stat-leader/team tables, chips/badges, filters/season controls, and Aero table/control primitives. Define one treatment before dispatch.

**Coder execution requirements:**
- Normalize row height, headers, numeric alignment, spacing, dividers, selected/sort/focus states.
- Keep desktop compact/readable; mobile uses controlled overflow or deliberate prioritization, never tiny text.
- Standardize status chips/badges (preseason, rivalry, clinched, live/final, etc.) through semantic roles.
- Align form/filter controls with Aero/MD3 interaction states.
- Sortable headers and row navigation must be clear to pointer and keyboard users.

**PASS:** Representative data pages are consistent in light/dark; primary mobile information is readable without zoom; keyboard/focus/sort states are obvious.

---

## [x] UI-06 — Accessibility and motion polish

**Goal:** Fix concrete accessibility gaps using platform semantics/CSS without overengineering.

**PM inspect:** global styles, header, dialogs, interactive cards, tables/forms, and reduced-motion rules. Diagnose concrete gaps first, then give coders targeted fixes; do not dispatch a vague repo-wide rewrite.

**Coder execution requirements:**
- Ensure visible focus on all major interactions against glass/surface backgrounds.
- Fix text/icon contrast issues in both themes.
- Give icon-only controls accessible names.
- Correct heading/landmark structure where needed.
- Respect `prefers-reduced-motion` for non-essential transforms, scrolling, and transitions.
- Keep mobile targets usable; provide focus/pressed/selected equivalents for hover behavior.

**Do not:** add an accessibility framework unless PM identifies a concrete unsolved need and escalates it first.

**PASS:** Keyboard-only traversal works across major routes; focus remains visible; reduced-motion removes non-essential movement; identified light/dark contrast and semantics defects are fixed.

---

## [x] UI-07 — Cross-page visual QA and final cleanup

**Depends on:** UI-01 through UI-06.

**Goal:** Find and fix only high-confidence residual visual/accessibility defects; do not reopen design direction.

**PM QA scope:** landing, standings, schedule/month, teams, team detail, matchup, stat leaders, draft lottery, dialogs, and other main stats routes. RinkQuest is checked only for global-chrome regressions.

**Verify:** ~1440, 1024, 768, 390, and 320px; light/dark; keyboard-only; reduced motion.

**PM workflow:** Delegate browser QA first. QA agent returns only defect records: route/state/viewport, observed defect, screenshot/evidence, severity. PM filters out subjective preferences, groups concrete defects, then dispatches exact fixes to coding agents.

**Fix only:** spacing drift, clipping, overflow, inconsistent radius/elevation, unreadable text, broken focus, awkward alignment, or states inconsistent with the approved Aero system.

**Do not:** add features or redesign approved components.

**PASS:** No high-confidence visual/accessibility defects remain in scope. Subjective future ideas are not implemented here. PM records PASS and stops.

---

## [ ] UI-08 — Residual QA defects: mini-standings tablet widths and team data display

**Depends on:** UI-07 (escalated after 3 defect cycles; data defects found during UI-07 QA but out of its visual scope).

**Goal:** Team identity stays readable in the landing mini-standings between 768px and ~1023px without breaking wider or phone layouts, and team detail / team list show the team name and record data they already fetch.

### Part A — Landing mini-standings team names at tablet widths

**Defect evidence (browser QA):**
- Landing mini-standings at 768px: table is 374px wide inside a 368px `.standings-table-shell`, and every team-name span has width 0 (only logos/badges show).
- 800–900px: names truncate to fragments ("Hurrica…", "Canadie…").
- Cause: `.standings-table td:nth-child(2) { max-width: 0 }` inside the `min-width: 768px` query in `react/src/features/standings/components/LandingPageStandings.module.css`, combined with the fixed width taken by the #/record/PTS/P% columns (~49+87+57+67px) in the narrow landing column.
- Unaffected and must stay passing: `/standings` at 768/1024/1440 (table width == shell width, all headers visible, names ≥123px); landing at 1024/1440 (640/640, 496/496); phones 390/320 (table 42rem, scrolls inside shell, no page overflow); header/value right edges aligned within 4px; `aria-sort` on sorted `<th>`.

**PM inspect:** `LandingPageStandings.module.css`, `LandingPageStandingsTable.tsx`, the landing layout that sets the mini-standings column width at 768–1023px, and whether `StandingsTeam` (or the source standings data) exposes a short name/abbreviation. Decide one approach before dispatch:
- (a) Scope the `max-width: 0` truncation rule to landing ≥1024px and let 768–1023px use the existing phone treatment (42rem min-width, scroll inside shell), or
- (b) Show a short team name/abbreviation in the team column at 768–1023px when the data provides one (no new API calls), or
- (c) Give the landing mini-standings a wider column at 768–1023px if the landing grid is the real constraint.

**Coder execution requirements:**
- Landing mini-standings at 768, 820, 900, and 1000px: table width ≤ shell clientWidth OR scrolls intentionally inside the shell (never page overflow); every row shows a readable team identifier (full name, short name, or abbreviation — not an empty or 1–3 letter fragment).
- No changes to `/standings` page layout at ≥768px, landing at ≥1024px, or phone behavior.
- Keep numeric alignment, sort buttons, `aria-sort`, row keyboard navigation, and focus styles unchanged.
- No new dependencies, API calls, or z-index/magic-number hacks.

**Do not:** redesign the standings table, change sort logic, or touch unrelated standings/landing CSS.

### Part B — Team detail page shows empty team name

**Defect evidence (browser QA, `?season=20252026`):** On `/team/:triCode` at all widths, the TeamHero `<h1>`, breadcrumb label, and team logo `alt` are empty. The team page code reads `raw.name`, but the teams API response uses `teamFullName` (see the `teamFullName: string` field in `react/src/features/teams/api/teamsApi.ts`; `teamHelpers.ts` already matches on `teamFullName`).

**PM inspect:** `TeamPage.tsx`, `TeamHero.tsx`, `teamPageHelper.ts`/`teamPageTypes.ts` (wherever `raw.name` is mapped), and the teams API types. Confirm the actual API field name from the typed contract before dispatch.

**Coder execution requirements:**
- Map the team display name from the correct API field (`teamFullName`) wherever the team page builds its name; don't add any fallback aliases unless the contract really has both fields.
- H1, breadcrumb, document/aria labels, and logo `alt` show the full team name.
- Add or update a unit test for the mapping helper if one exists for that function.

### Part C — Team list cards show "—" for every record

**Defect evidence (browser QA):** On `/teamList` every card shows "—" for its record. `ListOfTeamsContext.tsx` calls `GetTeamStatsById('')` with no season, so the API returns `{"data":[]}` and no stats merge onto the team list.

**PM inspect:** `react/src/features/teams/hooks/ListOfTeamsContext.tsx`, `GetTeamStatsById` overloads in `teamsApi.ts`, how `TeamPage.tsx` passes `season` (`GetTeamStatsById(String(numericId), season)`), and the app's current season source (season selector / `?season=` param).

**Coder execution requirements:**
- Pass the currently selected season to the team stats request, and refetch when the season changes.
- Cards show real record/points for a season with data (e.g. 20252026); a season with no data keeps the existing "—" / empty state, with no errors.
- Keep the existing loading, error, and "Try again" behaviour.

### Part D — Out of scope (do not dispatch)

These were found during UI-07 verification, so they're listed here for tracking only:
- `src/lib/apiClient.test.ts` fails locally only because the git-ignored `react/.env` sets `VITE_API_URL` to the onrender API instead of the `.env.example` value (`localhost:9000`). It's an environment issue, not a code defect.
- Prettier `format:check` reports 27 files that were already unformatted before the design-polish work. Handle that in a separate formatting-only commit if wanted.

**PASS:**
- Part A: browser QA of landing at 768/820/900/1000/1024/1440 and `/standings` at 768/1024/1440, light and dark. No clipped or empty team names, no page overflow, headers aligned with values, and sorting plus `aria-sort` still work. Phone widths 390/320 unchanged.
- Part B: `/team/:triCode` for several teams shows the full team name in the h1, breadcrumb and logo alt, at 1440 and 390.
- Part C: `/teamList?season=20252026` shows real records on the cards; switching season refetches; an empty season shows "—" without errors.
- `tsc --noEmit`, `vitest run` (apart from the known env-only apiClient failure) and `vite build` pass.
