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

## [ ] UI-01 — Global navigation, mobile nav, and season selector

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

## [ ] UI-02 — One page-shell and spacing system

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

## [ ] UI-03 — Landing hierarchy and game-card readability

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

## [ ] UI-04 — Consolidate duplicated Aero design recipes

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

## [ ] UI-05 — Data surfaces, chips, and controls

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

## [ ] UI-06 — Accessibility and motion polish

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

## [ ] UI-07 — Cross-page visual QA and final cleanup

**Depends on:** UI-01 through UI-06.

**Goal:** Find and fix only high-confidence residual visual/accessibility defects; do not reopen design direction.

**PM QA scope:** landing, standings, schedule/month, teams, team detail, matchup, stat leaders, draft lottery, dialogs, and other main stats routes. RinkQuest is checked only for global-chrome regressions.

**Verify:** ~1440, 1024, 768, 390, and 320px; light/dark; keyboard-only; reduced motion.

**PM workflow:** Delegate browser QA first. QA agent returns only defect records: route/state/viewport, observed defect, screenshot/evidence, severity. PM filters out subjective preferences, groups concrete defects, then dispatches exact fixes to coding agents.

**Fix only:** spacing drift, clipping, overflow, inconsistent radius/elevation, unreadable text, broken focus, awkward alignment, or states inconsistent with the approved Aero system.

**Do not:** add features or redesign approved components.

**PASS:** No high-confidence visual/accessibility defects remain in scope. Subjective future ideas are not implemented here. PM records PASS and stops.
