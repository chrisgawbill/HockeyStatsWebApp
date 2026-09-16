# Agent Ticket Index

Short human-controlled execution queue for agent-driven development.

See `docs/agent-development.md` before dispatching any agent.

## PM selection protocol

When no ticket is `READY` or `ACTIVE`, the PM must:
1. Inspect this index plus only the source sections for plausible next tickets.
2. Present the human with **2–3 candidates maximum**.
3. For each candidate give exactly: `ID — outcome — model tier — why now`.
4. Do not rank them as objectively best; explain tradeoffs when useful.
5. Wait for the human to select one.
6. Only the selected ticket becomes `READY`.
7. Create the compact execution contract below, then mark it `ACTIVE` when dispatched.
8. After QA PASS, mark `DONE`. Do not automatically start another ticket.

The PM may suggest splitting a ticket if it is too large, but the human approves the split.

## Queue rules

- The human decides what becomes `READY`.
- One `ACTIVE` ticket at a time by default.
- Detailed legacy prompts are reference material, not runtime prompts.
- Use the compact contracts in this file when present.
- `docs/architecture.md` wins over stale paths in historical backlog text.
- Model routing follows `docs/agent-development.md`.

## Prepared candidates

### DONE D1 — Portable Aero/MD3 visual foundation
**Source:** `docs/design-feature-backlog.md`  
**Route:** GPT-5.4 Mini  
**Goal:** Establish a small reusable Aero/MD3 design language that HockeyStats consumes but that can be carried into future projects without HockeyStats-specific code.

**Architecture intent**
```text
Portable Aero/MD3 core
        ↓
HockeyStats theme/config
        ↓
HockeyStats components/pages
```
The core owns generic visual language; HockeyStats owns hockey semantics.

**Scope**
- Inspect existing tokens/global styles and representative pages before changing structure.
- Create a clearly bounded portable style-language layer inside the repo rather than scattering new primitives through HockeyStats page CSS.
- Put generic semantic tokens in the portable core: color roles, typography, spacing, radius, elevation, borders, interactive/focus states, surfaces, and restrained glass/Aero treatment.
- Keep project branding/configuration separate where practical so another project can supply its own seed/colors without rewriting the core.
- Provide a minimal documented import/entry point or equivalent boundary showing how another React project could consume the core.
- Apply the portable foundation through the HockeyStats theme/config to one existing page as proof.
- Document what belongs in the reusable core versus the HockeyStats layer.

**Constraints**
- Build an extractable design-language foundation, **not** a published npm package in D1.
- No component/CSS framework and no new dependency unless the human explicitly approves it.
- Do not build a giant component library. Generic components such as Button/Card/Chip can be future tickets.
- No hockey-specific names, team colors, score states, rivalry states, schedule concepts, or data behavior inside the portable core.
- Do not prematurely abstract every existing HockeyStats style. Only new/foundation primitives need the clean boundary now.
- No app-wide redesign.
- Dense statistics remain on solid readable surfaces.
- Preserve light/dark themes, keyboard focus, accessibility, and responsive behavior.
- Prefer CSS/custom properties and simple project-agnostic primitives over runtime machinery.

**Acceptance**
- The reusable core has no HockeyStats/domain-specific dependencies or naming.
- HockeyStats consumes the core through an obvious project-level theme/configuration boundary.
- A developer could move the core to another React project without bringing HockeyStats components/data with it; document the minimal files/entry point needed.
- One representative HockeyStats page uses the foundation coherently.
- Light/dark/mobile/focus states remain readable.
- Build/typecheck pass.
- A short portability note documents: core contents, HockeyStats-specific layer, how to reuse it elsewhere, and what is intentionally deferred.

**Verify:** smallest relevant frontend typecheck/build + targeted manual visual checks + inspect the portable core for HockeyStats/domain imports/names.  
**Out of scope:** publishing/versioning an npm package, monorepo/package extraction, full component library, full MD3 migration, animation, navigation redesign, migrating every existing style.

---

### DONE D1B — Condense CSS
**Source:** `docs/design-feature-backlog.md`  
**Depends on:** D1  
**Route:** GPT-5.6 Luna if changes are purely mechanical; GPT-5.4 Mini otherwise.  
**Goal:** Reduce CSS duplication without changing intentional design.

**Scope**
- CSS touched by D1 plus shared/global CSS.
- Remove clearly unused rules.
- Consolidate truly duplicate rules/values.
- Reuse existing tokens where appropriate.

**Constraints**
- Zero intentional visual/behavior change.
- Do not merge intentionally different states/components.
- No new CSS framework or abstraction solely to reduce line count.

**Acceptance**
- CSS is measurably smaller or less duplicated.
- Light/dark/mobile/focus behavior is preserved.
- Build/typecheck/tests pass.

**Verify:** frontend checks + targeted before/after visual comparison.  
**Out of scope:** redesign or unrelated CSS cleanup.

---

### DONE D2 — Home → Game → Team consistency
**Source:** `docs/design-feature-backlog.md`  
**Depends on:** D1  
**Route:** GPT-5.4 Mini  
**Goal:** Apply the D1 visual language to Home, Game Detail, and Team without redesigning the app.

**Scope**
- Improve hierarchy on the three pages.
- Reuse D1 tokens/states.
- Aero only for focal areas.
- Preserve readable data-heavy surfaces.

**Constraints**
- No navigation redesign.
- No new API calls.
- No unnecessary component rebuilds.
- Do not begin signature features.

**Acceptance**
- Three pages clearly share the same visual language.
- Existing data/navigation still work.
- Mobile/focus/light/dark states work.
- Build/typecheck pass.

**Verify:** frontend checks + manual checks on all three pages.  
**Out of scope:** sitewide migration, Game Story, Team DNA, Playoff What-If.

---

### DONE F1 — Game Story
**Source:** `docs/design-feature-backlog.md`  
**Depends on:** D1; D2 preferred  
**Route:** GPT-5.4 Mini for both implementation phases; GPT-5.6 Luna QA after each phase; escalate to GPT-5.6 Sol only for genuinely ambiguous game-data reasoning.  
**Goal:** Let a fan understand a completed game quickly from a factual visual narrative.

**Execution shape**
F1 remains one human-approved ticket, but the PM must run it as two bounded implementation phases. Do not combine data derivation and presentation into one worker pass.

### Phase A — factual derivation
**Scope**
- Inspect the actual existing game-detail contracts/models and representative payloads first; never assume a field exists.
- Add or extend pure, unit-testable helpers for only facts supported by the data.
- Derive ordered scoring events, tie states, lead changes, first lead, and largest lead where the source data makes them deterministic.
- Identify 2–4 candidate turning-point facts using explicit deterministic rules, not subjective narrative scoring.
- Use special-teams/period/overtime context only when the existing contract exposes enough information reliably.

**Constraints**
- No UI work in Phase A beyond what is strictly required to compile.
- No invented events, statistics, motives, momentum, or causal claims.
- No new API/backend work without human approval.
- If a desired fact is ambiguous or unsupported, omit it and report the data gap.
- Do not create increasingly complex heuristics just to satisfy the feature list.

**Phase A acceptance**
- Derivation logic is pure and separated from React presentation.
- Representative helper cases cover ties, lead changes, and edge/missing data where relevant.
- Derived facts for at least one real completed game can be reconciled with source game data.
- Relevant tests/typecheck pass.

**Phase A QA gate**
GPT-5.6 Luna verifies the derivation acceptance criteria before Phase B starts. On FAIL, repair Phase A first. Do not begin presentation while factual derivation is unverified.

### Phase B — presentation
**Scope**
- Render the verified Phase A facts as a fast-scanning Game Story on the existing Game Detail experience.
- Show scoring events in order, lead/tie changes, and 2–4 verified factual turning points.
- Add supporting stats only when they materially clarify the story.
- Make the timeline readable on mobile and accessible without relying on color/visual position alone.
- Reuse D1's portable design language and the HockeyStats theme/config boundary.

**Portable-design rule**
- Do not create new generic visual primitives inside Game Story CSS if D1 already provides the concept.
- If F1 reveals a genuinely reusable generic primitive (for example a Timeline/Card/Chip pattern), keep the F1 implementation minimal and flag the reusable primitive as a follow-up candidate rather than expanding D1 or building a component library inside this ticket.
- Hockey/game-specific presentation stays in HockeyStats; generic design-language primitives stay domain-free.

**Phase B constraints**
- No AI/generated commentary.
- No generic chart/timeline framework.
- No Game Detail rewrite.
- No new dependency without human approval.
- Preserve existing navigation/data behavior.
- Aero/glass remains a focal treatment; dense supporting stats stay readable.

**Phase B acceptance**
- A real completed game renders a clear factual story that can be understood quickly.
- Every narrative statement shown is traceable to verified derivation/source data.
- Missing/partial data degrades gracefully.
- One real completed game is cross-checked against its official/source record.
- Mobile, keyboard accessibility, light/dark mode work.
- Relevant build/typecheck/tests pass.

**Complexity escalation**
- Mechanical/local failures stay with GPT-5.4 Mini.
- Escalate to GPT-5.6 Sol only when the existing data creates a genuinely ambiguous hockey-logic problem that cannot be resolved from contracts/source examples.
- Before inventing a heuristic, changing a data contract, adding an endpoint, or expanding scope, stop and return the decision to the human.
- A stronger model may reason about the existing scope; it may not broaden it.

**Verify:** Phase A helper tests/typecheck + source-data reconciliation; then Phase B frontend checks + one real completed-game comparison + targeted mobile/theme/accessibility checks.  
**Out of scope:** generated commentary, subjective momentum claims, new data acquisition, backend/API expansion, generic visualization framework, Game Detail rewrite, reusable component-library expansion.
---

### DONE E2 — Team form and momentum
**Source:** `docs/exciting-features-backlog.md`  
**Route:** GPT-5.4 Mini. Default execution is single-agent; add GPT-5.6 Luna QA only if helper/domain logic cannot be covered adequately by deterministic checks.  
**Goal:** Derive useful recent-form visuals from schedule data already loaded by the app.

**Scope**
- Inspect the existing schedule model/context and completed-game/status helpers first.
- Add one pure team-form helper for only the calculations the UI needs.
- Last-N form strip.
- Rolling points-percentage sparkline.
- Home/road and goal-differential summaries.
- Mount on Team page.
- Treat standings-row integration as a follow-up unless it is trivial and clearly within the existing layout.

**Constraints**
- Zero new fetches, backend work, or dependencies.
- Pure calculations outside React; components render derived values.
- Inline SVG; no chart library or generic visualization framework.
- Reuse D1 portable design tokens/primitives; keep hockey semantics in HockeyStats.
- Do not duplicate an existing helper merely to match the legacy ticket wording.
- Do not over-generalize the helper for hypothetical future sports/features.
- If OT/SO loss detection or another hockey rule is not represented reliably by existing data, omit/flag that submetric instead of guessing.

**Efficiency / verification**
- Prefer one GPT-5.4 Mini worker session for implementation + targeted deterministic checks.
- Add focused helper tests for non-obvious calculations/edge cases where the repo's current test structure makes that cheap.
- Do not spawn a separate QA agent just to rerun typecheck/build.
- Use Luna QA only when an independent check adds information: e.g. hockey-result interpretation, derived-value correctness not covered by tests, or a meaningful acceptance criterion the worker cannot deterministically prove.
- Keep manual verification to one representative team plus mobile/theme sanity checks.

**Acceptance**
- Derived values match source schedule data for one checked team.
- Calculations handle empty/short result sets and current/past seasons without crashing.
- No network request is introduced by the feature.
- Mobile and both themes remain legible.
- Relevant tests (if added), typecheck, and build pass.
- Any unsupported metric/data assumption is explicitly omitted or documented rather than inferred.

**Verify:** targeted helper tests/checks → frontend typecheck/build → one-team source-data comparison → brief mobile/light/dark check.  
**Out of scope:** player form, xG/shot data, backend work, standings-row integration unless trivial, reusable chart framework, generalized multi-sport analytics engine.

### DONE F2 — Team DNA
**Source:** `docs/design-feature-backlog.md`  
**Depends on:** D1, D2; reuse E2 helpers/data if available  
**Route:** GPT-5.4 Mini; default single-agent. Add Luna QA only for normalized/derived metric correctness that targeted tests do not cover.  
**Goal:** Give each team a compact, understandable visual fingerprint from measurable season tendencies.

**Scope**
- Inspect E2 outputs plus existing standings/team/season data; reuse rather than recalculate.
- Select 4–6 metrics that are both available and meaningfully different (for example goal differential, scoring environment, home/road performance, recent form).
- Keep calculations in pure helpers; keep raw values visible.
- Normalize only when comparison requires it, with a documented scale/baseline.
- Build one clear Team DNA presentation on the Team page using D1 primitives.

**Constraints**
- Zero new API/backend work by default.
- No ML, clustering, speculative labels, or invented “team personality.”
- Prefer understandable bars/scales/profile rows over a radar chart.
- Do not duplicate E2 calculations or build a generalized analytics engine.
- Unsupported metrics are omitted, not approximated.

**Acceptance**
- A fan can identify 4–6 measurable team tendencies and see the underlying values.
- Any normalization is deterministic, documented, and testable.
- Strong/average/struggling sample teams produce plausibly different profiles from source data.
- Season context is visible; empty/partial seasons degrade gracefully.
- Mobile/light/dark/accessibility and build/typecheck pass.

**Verify:** targeted helper tests → compare 3 representative teams to source standings/form data → frontend checks.  
**Out of scope:** historical comparisons, ML/clustering, new data acquisition, generic chart framework.

---

### DONE E1 — Playoff race command center
**Source:** `docs/exciting-features-backlog.md`  
**Route:** GPT-5.4 Mini in two bounded phases; Luna QA gate for playoff math; GPT-5.6 Sol only for unresolved rule/data ambiguity.  
**Goal:** Show a transparent, simplified playoff-race view from standings and schedule data already loaded by the app.

**Execution shape**
Phase A verifies pure playoff-race derivation before any substantial UI work. Phase B renders only verified outputs.

**Phase A — derivation**
- Inspect current standings/schedule models and reuse existing wildcard/playoff helpers if present.
- Pure helper(s) for remaining games, max possible points, projected cutline/required pace, and simplified magic/tragic values only where formulas are defensible from available data.
- Explicitly document assumptions and NHL tiebreaker limitations.
- Handle zero remaining games, early season, and past seasons deterministically.

**Phase A QA gate**
- Targeted tests cover representative in-position/chasing/eliminated/season-over cases.
- Luna independently checks formulas/assumptions when deterministic tests alone cannot establish hockey-rule correctness.
- Do not begin Phase B if the math is unresolved.

**Phase B — presentation**
- Add a compact per-conference playoff-race view to the existing standings experience when practical; avoid a new route unless current structure makes it cleaner.
- Show only useful verified values: points, remaining, max points, cutline/pace, and simplified clinch/elimination indicators.
- Clearly label simplified calculations and ignored tiebreakers.
- Use D1 tokens and preserve existing season/query-param behavior.

**Constraints**
- Zero new fetches/endpoints.
- Pure math outside React.
- No Monte Carlo odds or exact NHL clinch/tiebreaker engine.
- Never present simplified math as official NHL clinch status.
- Stop for human decision before adding data/contracts or complex heuristics.

**Acceptance**
- Spot-checked team calculations reconcile with helper inputs/formulas.
- Current, early, and completed seasons render without divide-by-zero or misleading states.
- Changing/opening the view introduces no new data fetch beyond existing season behavior.
- Mobile/light/dark/accessibility and build/typecheck/tests pass.

**Verify:** helper tests + manual formula spot-check for representative teams + frontend checks.  
**Out of scope:** official tiebreaker-exact clinch logic, Monte Carlo playoff odds, backend/API changes.

---

### DONE E3 — Head-to-head matchup explorer
**Source:** `docs/exciting-features-backlog.md`  
**Depends on:** E2 preferred for reusable form display  
**Route:** GPT-5.4 Mini; default single-agent with deterministic helper verification.  
**Goal:** Let a fan compare any two teams' season series using the already-loaded season schedule.

**Scope**
- Reuse existing schedule data and E2 form component/helper if available.
- Add a pure season-series helper returning played/upcoming meetings and a compact summary.
- Add a deep-linkable matchup view with two team selectors and selected season.
- Show series results, aggregate goals, upcoming meetings, and team form when already available.
- Add a minimal pre-filled entry point from Game Detail; other entry points are follow-ups unless trivial.

**Constraints**
- No new endpoint; team-selector changes are client-side projections.
- Preserve existing URL/search-param and route-state conventions.
- Do not duplicate schedule/game-card components when an existing compact presentation fits.
- Same-team/no-meeting/loading states must be explicit.
- No multi-season/all-time aggregation.

**Acceptance**
- One known divisional series matches source schedule results.
- A fresh deep link restores both teams and season.
- Changing either team with the season loaded causes no network request.
- Game Detail entry opens the matchup pre-filled.
- Empty/same-team states, mobile/themes/accessibility, build/typecheck pass.

**Verify:** targeted helper tests → one season-series source comparison → deep-link/no-refetch/manual UI checks.  
**Out of scope:** all-time history, player-vs-team splits, backend changes, extra entry-point proliferation.

---

### DONE F4 — Signature interaction polish
**Source:** `docs/design-feature-backlog.md`  
**Depends on:** D1 + at least one completed signature feature (F1/F2/F3)  
**Route:** GPT-5.6 Luna for clearly mechanical CSS-only polish; GPT-5.4 Mini when state/React behavior is involved. Default single-agent.  
**Goal:** Add a tiny, reusable-feeling motion polish pass to one completed signature feature without turning the app into an animation project.

**Scope**
- Select exactly one completed signature feature.
- Identify at most three meaningful moments: feature entry, state/value change, secondary reveal.
- Prefer CSS transitions and D1 motion/design primitives where they already exist.
- Respect `prefers-reduced-motion` and preserve keyboard/mobile behavior.
- If a motion value is genuinely generic, add it to the portable D1 layer only when that is a tiny domain-free change; otherwise flag a follow-up.

**Constraints**
- No animation library, parallax, animated backgrounds, or page-wide motion.
- No decorative motion without interaction/information value.
- Do not redesign the underlying feature.
- Remove motion rather than engineering around layout instability.
- Keep generic motion primitives domain-free.

**Acceptance**
- No more than three purposeful interactions are polished.
- Reduced-motion users receive an equivalent, stable experience.
- No distracting layout shifts or impaired keyboard/mobile behavior.
- Both themes remain coherent and build/typecheck pass.
- Any reusable primitive added to D1 is documented briefly.

**Verify:** targeted interaction checks with normal + reduced motion → keyboard/mobile/theme sanity → frontend checks.  
**Out of scope:** animation framework, global motion redesign, unrelated feature changes.

---

### READY D3 — Product-level polish and motion
**Source:** agent ticket index  
**Depends on:** D1, D2; ideally after core signature features stabilize  
**Route:** GPT-5.4 Mini. Use phased, page-cluster execution rather than a single repo-wide edit. Luna QA may verify performance/accessibility criteria; GPT-5.6 Sol only for evidence-backed rendering/performance problems.  
**Goal:** Raise HockeyStats to the fit-and-finish standard associated with highly polished consumer products while preserving its own Aero + MD3 visual identity.

**Product principle**
“Apple-level polished” means quality of execution, not copying Apple’s visual language. Keep HockeyStats recognizably Aero/MD3: translucent focal surfaces, MD3 state/semantic structure, existing typography/color personality, and the portable D1 foundation. Borrow the qualities of premium product design: restraint, consistency, immediate feedback, smooth state changes, excellent spacing, strong hierarchy, perceived speed, and obsessive edge-case handling.

**Execution shape**
Run as a sequence of bounded polish passes. The PM should inspect first, select the highest-impact page/interaction cluster, complete and verify it, then return to the human before broadening to another cluster. Do not “polish the whole repo” in one worker context.

### Phase A — polish audit
- Inspect representative desktop/mobile flows: navigation, Home, Team, Game Detail, Standings, Schedule, and one signature feature.
- Identify only observable polish gaps: inconsistent spacing/radii/elevation, abrupt state changes, layout shift, weak loading/empty/error transitions, unclear pressed/focus states, janky scrolling/rendering, visual inconsistency, or unnecessarily slow-feeling interactions.
- Reuse browser/performance evidence when available; do not speculate about optimization.
- Produce a short prioritized set of page/interaction clusters. Human approves the first implementation cluster.

### Phase B — motion language
- Add a small domain-free motion vocabulary to the portable D1 design language: duration tiers, easing roles, and reduced-motion behavior.
- Prefer CSS transitions/animations and browser-native behavior.
- Use motion to communicate state, hierarchy, continuity, or direct manipulation—not decoration.
- Appropriate examples: subtle surface/selection transitions, content reveal, tab/view changes, button press feedback, expandable areas, loading-to-content transitions, and small data-value changes.
- Keep most micro-interactions short and responsive; longer transitions require a clear continuity reason.
- No animation should delay access to information.

### Phase C — interaction and visual refinement
For the approved cluster only:
- Normalize spacing, alignment, hit targets, state layers, border/elevation behavior, and responsive rhythm using D1 tokens.
- Give interactive elements coherent hover/pressed/focus/selected/disabled feedback.
- Smooth abrupt but meaningful UI state changes without animating everything.
- Refine loading, empty, error, skeleton, and content-arrival states to reduce perceived roughness.
- Prevent content jumps where dimensions can be known/reserved.
- Preserve dense-stat readability; glass remains selective rather than becoming a universal surface.

### Phase D — perceived and actual performance
- Measure before changing performance-sensitive code.
- Look for unnecessary React rerenders, expensive repeated derivations, oversized work on interaction paths, layout thrashing, and avoidable image/content shifts only where evidence points.
- Prefer memoization/code changes only when they solve an observed issue; do not blanket-add memo/useMemo/useCallback.
- Keep interactions responsive during loading and avoid blocking UI work where practical.
- Do not trade correctness, accessibility, or maintainability for tiny synthetic gains.

**Portable-design rule**
Generic motion tokens, state behavior, and reusable surface/interaction primitives belong in the D1 portable core only when they remain project/domain agnostic. Hockey-specific animation or semantics stay in HockeyStats. Document any new portable primitives so the polish language can travel to future projects.

**Constraints**
- Do not imitate Apple UI, macOS/iOS components, fonts, icons, or branding.
- Preserve Aero + MD3 rather than replacing it with minimal white/black “Apple-like” styling.
- No animation library/new dependency without human approval.
- No page-wide gratuitous animation, parallax, animated backgrounds, spring-everything behavior, or motion that competes with stats.
- Respect `prefers-reduced-motion`; functionality and hierarchy must remain clear with motion disabled.
- Do not hide performance problems behind longer animations.
- Do not perform unrelated feature work or architecture rewrites.
- Do not optimize without evidence.

**Acceptance**
- The approved page/interaction cluster feels visually and behaviorally consistent with D1/D2 and has no obvious abrupt/janky transitions in normal use.
- Interactive states are consistent across mouse, touch, and keyboard.
- Loading/content transitions avoid preventable layout shifts and communicate progress cleanly.
- Motion uses the shared vocabulary and reduced-motion produces an equivalent stable experience.
- Any performance code change has a documented observed problem and a before/after verification.
- Mobile and desktop, light/dark, keyboard/focus, and common empty/loading/error states are checked.
- Build/typecheck/relevant tests pass.
- Portable motion/polish primitives are documented briefly for reuse in future projects.

**Verify:** targeted visual/interaction audit → reduced-motion + keyboard/touch checks → relevant performance evidence for any performance edits → mobile/desktop + light/dark sanity → frontend checks.  
**Out of scope:** Apple visual imitation, total redesign, new feature development, animation framework, speculative micro-optimization, whole-site rewrite in one pass.

---

### IDEA D3-QA — Premium polish visual & accessibility QA
**Source:** follow-up to D3  
**Depends on:** D3 implementation pushed to main  
**Route:** Dedicated QA subagent. Prefer GPT-5.4 Mini for browser/visual reasoning; use Luna only for mechanical checklist follow-up. This ticket is audit-only: no application-code edits.  
**Goal:** Independently inspect the finished site on desktop and mobile, capture evidence, and identify the smallest set of real gaps preventing HockeyStats from reaching a premium consumer-product level of polish while preserving its Aero + MD3 identity.

**Quality bar**
“Apple-level” is a fit-and-finish benchmark, not a request to copy Apple UI. Judge restraint, consistency, clarity, responsiveness, smoothness, accessibility, state quality, spacing, hierarchy, and attention to edge cases. The game experience in particular should feel intentionally designed for the device rather than a responsive desktop compromise. Do not recommend replacing Aero/MD3 with Apple styling.

**Execution shape**
Use one fresh QA subagent so the review is independent from the D3 implementation context. Start from the running site, not a speculative code review. Inspect code only to confirm the cause of an observed issue or verify accessibility behavior. Do not spawn additional subagents unless a concrete blocker requires a separate accessibility/performance check.

### A — Desktop visual QA
At a representative desktop viewport, inspect:
- global navigation and page transitions
- Home
- Team + Team DNA/form
- Game Detail + Game Story
- Standings + playoff race
- Schedule
- Matchup explorer
- any other signature surface changed by D3

Capture screenshots of representative pages/states. Do not screenshot every route/state.

Look for observable gaps only:
- spacing/alignment/rhythm inconsistencies
- weak hierarchy or crowded/empty composition
- inconsistent radii, borders, elevation, glass, typography, icons, hit areas, or states
- abrupt/janky state changes or unnecessary motion
- layout shift/loading roughness
- clipped/overflowing content
- interactions that feel visually unfinished
- game cards that do not present the result/status/team hierarchy with premium clarity
- the rink/ice visualization feeling like a desktop surface merely shrunk onto mobile rather than intentionally composed for the viewport
- inconsistent application of the portable Aero/MD3 language

### B — Mobile visual QA
Repeat the representative journey at a common narrow mobile viewport. Capture screenshots sufficient to show real findings.

Specifically check:
- bottom/top navigation ergonomics and safe spacing
- touch target size/separation
- horizontal overflow and dense statistics
- wrapping/truncation
- sticky/fixed UI collisions
- viewport-height issues
- modal/popover/selector usability
- content hierarchy at narrow widths
- **game-card readability:** team/score/status hierarchy, truncation/wrapping, spacing, touch targets, scanability, and whether secondary metadata competes with the game result
- **rink/game surface:** treat the rink/ice visualization as a first-class mobile surface; verify it fits the viewport, remains legible, preserves useful proportions, avoids tiny labels/controls, and does not require awkward horizontal scrolling or zooming for the primary experience
- when the rink contains interaction/overlays, verify touch targets, selected/focus states, labels, and information density work at phone size
- scroll smoothness and whether animations remain useful rather than distracting

Do not treat desktop/mobile visual differences as bugs when they are intentional responsive design.

### C — Accessibility & user-preference QA
Check the experience with the same seriousness expected from a polished consumer product, using current web semantics rather than imitating platform-specific Apple APIs.

Verify, where applicable:
- keyboard-only navigation and logical focus order
- visible focus indication
- semantic controls/labels and accessible names
- headings/landmarks
- contrast and legibility in light/dark themes
- content and state are not communicated by color alone
- zoom/text enlargement does not break core flows
- touch targets are reasonably usable
- `prefers-reduced-motion: reduce` removes/nonessential motion while preserving meaning
- `prefers-color-scheme`/existing theme behavior remains coherent
- loading, empty, error, selected, expanded, and disabled states remain understandable to assistive technology
- no obvious keyboard traps or focus loss during dynamic UI changes

Use automated accessibility tooling already available in the project/browser when cheap, but manually verify meaningful findings. Do not add a new dependency just to run this audit.

### D — Smoothness/perceived-performance check
Only report performance problems that are observable or measurable:
- visible layout shifts
- delayed interaction feedback
- scroll/animation stutter
- expensive-feeling view changes
- content appearing in a distracting sequence

Do not prescribe memoization, virtualization, lazy loading, or architectural changes without evidence.

**Screenshot evidence**
- Store QA screenshots in a clearly named temporary/report location rather than mixing them into product assets.
- Keep the set small: enough desktop/mobile screenshots to demonstrate findings, not a visual archive.
- Every reported visual gap should reference a screenshot or a reproducible interaction/state when practical.
- Screenshots are QA evidence, not a request to redesign from static images alone.

**Finding severity**
Use only:
- **P0 — blocker:** prevents a core flow or creates a serious accessibility barrier.
- **P1 — polish gap:** clearly undermines premium fit-and-finish or usability and is worth fixing.
- **P2 — optional refinement:** noticeable but low-value; do not automatically create implementation work.

Avoid subjective nitpicks. If a finding cannot explain user impact in one sentence, omit it.

**Constraints**
- AUDIT ONLY. Do not modify application code.
- Do not redesign the product.
- Do not imitate Apple visuals/components/branding.
- Do not recommend a new library/framework unless an observed blocker truly cannot be addressed with the current stack.
- Do not create a giant WCAG compliance project from minor findings.
- Do not chase pixel-perfect differences that have no usability/consistency impact.
- Prefer 5–10 high-confidence findings over dozens of speculative ones.
- Keep context targeted; do not reread every source file.
- Existing D1/D3 portable design language remains the source of truth.

**Acceptance**
- Representative desktop and mobile journeys were actually rendered and inspected.
- Screenshots document the important states/findings.
- Reduced-motion, keyboard/focus, light/dark, responsive layout, and basic semantic accessibility were exercised.
- Findings distinguish genuine gaps from optional refinement.
- Mobile game cards and the rink/game surface receive explicit findings or an explicit “no meaningful gap observed” result.
- Each P0/P1 finding includes: page/state, desktop/mobile/both, observable evidence, user impact, and the smallest plausible fix direction.
- No code was changed.
- Final report is concise enough for the human to choose what becomes a follow-up ticket.

**Return**
```text
QA: PASS | GAPS FOUND
COVERAGE: <desktop pages> | <mobile pages> | <accessibility/preferences checked>
SCREENSHOTS: <paths/names>

P0/P1 FINDINGS:
1. <page/state> — <desktop|mobile|both> — <evidence> — <impact> — <smallest fix direction>

P2 OPTIONAL:
- <only worthwhile refinements>

ACCESSIBILITY:
- <verified behaviors + concrete gaps>

SMOOTHNESS:
- <only observed/measured issues>

RECOMMENDED FOLLOW-UPS:
- <max 3 bounded ticket candidates; do not implement>
EXECUTION: single QA subagent
CONTEXT: targeted | expanded
EXPANSION: none | <reason>
```

**Out of scope:** implementation, visual redesign, exhaustive standards certification, every device/browser combination, new dependency adoption, speculative performance optimization.

---

## Later candidates

| Status | Ticket | Source | Note |
|---|---|---|---|
| IDEA | F3 — Playoff What-If | `docs/design-feature-backlog.md` | Logic-heavy; preferably after playoff helper work. |

## Ready

- D3 — Product-level polish and motion

## Active

None.

## Completed

Use existing progress/backlog completion markers as historical truth; do not duplicate the Phase 2 progress log here.
