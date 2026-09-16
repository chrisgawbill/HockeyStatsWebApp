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

### DONE D3-QA-SITE — Main site premium polish & accessibility QA
**Source:** follow-up to D3  
**Depends on:** D3 implementation pushed to main  
**Route:** Fresh dedicated GPT-5.4 Mini QA subagent. Audit-only; no application-code edits.  
**Goal:** Independently inspect **every main-site page/route** on desktop and mobile, capture representative screenshots, and identify the smallest set of real gaps preventing HockeyStats from reaching a premium consumer-product level of polish while preserving Aero + MD3.

**Quality bar**
“Apple-level” means fit-and-finish, not Apple imitation: restraint, consistency, hierarchy, spacing, immediate feedback, smooth state changes, perceived speed, accessibility, and excellent edge-case handling. Keep the D1 Aero/MD3 language.

**Scope**
- First enumerate the current user-facing main-site routes/pages from routing/navigation; do not rely on a stale hard-coded page list.
- Exclude RinkQuest from this ticket; it has its own QA ticket.
- Render and inspect **every discovered main-site page** at representative desktop and mobile widths.
- Exercise meaningful page states when cheaply reachable: loaded, loading, empty, error, selected/expanded, and season/team variations where relevant.
- Capture a small screenshot set per problem cluster rather than every possible state.

**Visual/interaction QA**
Check observable gaps in:
- spacing, alignment, responsive rhythm, hierarchy, typography, iconography
- radii, borders, elevation, Aero/glass restraint, MD3 states
- navigation, controls, hover/pressed/focus/selected/disabled feedback
- wrapping, truncation, overflow, dense-data readability
- loading/content transitions, layout shift, abrupt state changes
- mobile touch targets, fixed/sticky collisions, viewport-height issues
- visual consistency across pages and signature features
- smoothness/perceived performance only when observable or measurable

**Accessibility & preferences**
Verify across representative flows:
- keyboard-only navigation, logical focus order, visible focus, no traps
- semantic controls/labels, accessible names, headings/landmarks
- light/dark contrast and legibility; information not conveyed by color alone
- zoom/text enlargement without breaking core flows
- reasonable touch targets
- `prefers-reduced-motion: reduce` preserves meaning and removes nonessential motion
- existing theme/`prefers-color-scheme` behavior remains coherent
- dynamic loading/empty/error/selected/expanded/disabled states remain understandable

Use existing browser/project accessibility tooling when cheap. Do not add a dependency solely for this audit.

**Finding severity**
- **P0:** core-flow failure or serious accessibility barrier.
- **P1:** clear premium-polish/usability/accessibility gap worth fixing.
- **P2:** optional refinement; do not automatically create work.

Prefer 5–12 high-confidence cross-site findings over a long nitpick list. A repeated systemic issue counts as one finding with affected pages listed.

**Constraints**
- AUDIT ONLY; no app-code edits.
- No redesign, Apple visual imitation, new framework/library, speculative optimization, or exhaustive certification exercise.
- Inspect code only to confirm an observed issue/cause.
- Keep context targeted; screenshots and rendered behavior are primary evidence.

**Acceptance**
- Every discovered main-site page is covered on desktop and mobile or explicitly marked blocked with reason.
- Screenshot evidence demonstrates important findings.
- Keyboard/focus, reduced motion, themes, responsive layout, zoom/text sizing, and basic semantic accessibility are exercised.
- Each P0/P1 includes page/state, desktop/mobile/both, evidence, user impact, and smallest fix direction.
- Final report proposes at most 3 bounded follow-up ticket clusters; no fixes are implemented.

**Return**
```text
QA: PASS | GAPS FOUND
ROUTES: <covered | blocked>
COVERAGE: desktop | mobile | accessibility/preferences
SCREENSHOTS: <paths/names>

P0/P1 FINDINGS:
1. <page/state> — <desktop|mobile|both> — <evidence> — <impact> — <smallest fix direction>

P2 OPTIONAL:
- <worthwhile refinements only>

ACCESSIBILITY:
- <verified behaviors + concrete gaps>

SMOOTHNESS:
- <observed/measured issues only>

RECOMMENDED FOLLOW-UPS:
- <max 3 bounded ticket clusters; do not implement>
EXECUTION: single QA subagent
CONTEXT: targeted | expanded
EXPANSION: none | <reason>
```

**Out of scope:** RinkQuest, implementation, Apple imitation, exhaustive standards certification, every browser/device combination, new dependencies.

---

### DONE D3-QA-RQ — RinkQuest premium game polish & accessibility QA
**Source:** follow-up to D3  
**Depends on:** D3 implementation pushed to main  
**Route:** Fresh dedicated GPT-5.4 Mini QA subagent. Audit-only; no application-code edits.  
**Goal:** Independently QA RinkQuest as a polished touch-first game experience on desktop and mobile, with special attention to mobile game cards, the playable rink, feedback, smoothness, and accessibility.

**Quality bar**
Treat “Apple-level” as the execution standard of a highly polished first-party consumer game: immediate comprehension, deliberate touch ergonomics, responsive feedback, smooth state changes, restraint, accessibility, and no desktop-to-mobile compromises. Preserve HockeyStats/RinkQuest Aero + MD3 identity; do not copy Apple Game Center/iOS styling.

**Scope**
- Discover the current RinkQuest route(s), gameplay states, and controls from the running app.
- Exercise the primary play loop on desktop and mobile.
- Capture screenshots of the main RinkQuest states needed to demonstrate findings.
- Prioritize actual playability over preserving desktop composition on mobile.

**RinkQuest game cards**
Check:
- primary gameplay action/information is immediately scannable
- text/numbers/status hierarchy remains readable at phone width
- wrapping/truncation and secondary metadata do not obscure the task
- touch targets and separation are comfortable
- selected/correct/incorrect/disabled/pressed states provide clear feedback
- cards remain visually coherent with Aero/MD3 without excessive glass/noise

**Playable rink**
Treat the rink as a first-class mobile game surface:
- fits the usable viewport without awkward horizontal scrolling/zooming for normal play
- preserves useful rink proportions while prioritizing tap accuracy
- targets, labels, overlays, markers, and controls remain legible/tappable
- selected/focus/pressed/correct/incorrect states are immediately understandable
- interaction feedback is prompt and not dependent on color alone
- overlays/tooltips do not obscure the next action
- orientation/viewport changes do not leave the rink in a broken state
- mobile composition may intentionally differ from desktop when that improves play

**Game feel & smoothness**
Observe:
- tap/click-to-feedback latency
- state transitions between question/action/result/next state
- distracting layout shifts
- animation/scroll stutter
- whether motion helps comprehension or delays play
- loading/restart/reset transitions and repeated-play flow

Report only observable/measurable issues; do not prescribe speculative React optimizations.

**Accessibility & preferences**
Verify:
- full keyboard path where the game interaction can reasonably support it
- visible focus and logical focus movement
- semantic/accessibly named controls
- gameplay state/result not conveyed only through color
- reasonable mobile touch targets
- text enlargement/zoom does not make the core game unusable
- `prefers-reduced-motion: reduce` removes nonessential motion without removing gameplay feedback
- light/dark themes remain legible
- dynamic result/state changes are understandable to assistive technology where applicable

**Finding severity**
- **P0:** blocks play or creates a serious accessibility barrier.
- **P1:** clearly makes RinkQuest feel unfinished, harder to play, or less accessible.
- **P2:** optional refinement.

Prefer 5–10 high-confidence findings. Do not turn subjective game-design preferences into defects without observable user impact.

**Constraints**
- AUDIT ONLY; no app-code edits.
- No redesign, Apple/iOS imitation, animation library, new dependency, or gameplay feature expansion.
- Do not turn this into a generalized game-engine/accessibility rewrite.
- Keep context targeted; rendered gameplay and screenshots are primary evidence.
- Recommend the smallest fix direction, not implementation plans.

**Acceptance**
- Primary RinkQuest loop is inspected on desktop and mobile.
- Mobile game cards and playable rink each receive explicit findings or an explicit “no meaningful gap observed.”
- Screenshots cover the important game states/findings.
- Touch, keyboard/focus, reduced motion, themes, zoom/text sizing, and non-color feedback are exercised.
- Each P0/P1 includes state, desktop/mobile/both, evidence, user impact, and smallest fix direction.
- Final report proposes at most 3 bounded follow-up tickets; no fixes are implemented.

**Return**
```text
QA: PASS | GAPS FOUND
COVERAGE: desktop play loop | mobile play loop | accessibility/preferences
SCREENSHOTS: <paths/names>

P0/P1 FINDINGS:
1. <RinkQuest state> — <desktop|mobile|both> — <evidence> — <impact> — <smallest fix direction>

GAME CARDS:
- <findings or no meaningful gap observed>

RINK:
- <findings or no meaningful gap observed>

ACCESSIBILITY:
- <verified behaviors + concrete gaps>

GAME FEEL:
- <observed smoothness/feedback issues>

P2 OPTIONAL:
- <worthwhile refinements only>

RECOMMENDED FOLLOW-UPS:
- <max 3 bounded tickets; do not implement>
EXECUTION: single QA subagent
CONTEXT: targeted | expanded
EXPANSION: none | <reason>
```

**Out of scope:** main-site pages, implementation, new gameplay features, Apple imitation, exhaustive certification, every device/browser combination.

---


### ACTIVE LIB1 — Extract portable Aero/MD3 experience library
**Source:** D1/D3 portability follow-up  
**Depends on:** D3 complete; D3-QA findings that affect shared design primitives should be resolved or explicitly deferred  
**Route:** GPT-5.4 Mini orchestrated in bounded phases. Use a fresh QA subagent for consumer-app verification. GPT-5.6 Sol only for package/build/tooling problems that cannot be resolved within the existing architecture.  
**Goal:** Move the domain-free Aero/MD3 design language—including tokens, themes, interaction states, accessibility/user-preference behavior, and motion primitives—into a new independent repository/package that HockeyStatsWebApp imports as a real consumer.

**Human checkpoint**
Creating a new repository/package boundary is intentional for this ticket, but the human must approve the proposed repository/package name, package manager/build approach, and initial public API before extraction begins. Do not create/publish a registry package or make the repository public without explicit approval.

**Library principle**
Extract the reusable **experience language**, not HockeyStats. The new library should own project-agnostic visual and behavioral primitives. HockeyStats keeps hockey semantics, data, layouts, feature components, team/rivalry/status meaning, and app-specific composition.

### Phase A — extraction inventory & boundary
- Inspect the current D1/D3 portable layer and actual consumers.
- Inventory candidates: semantic color/theme tokens, typography, spacing, radii, elevation, surfaces/glass, focus/hover/pressed/selected/disabled states, motion duration/easing, reduced-motion behavior, color-scheme/theme behavior, and generic accessibility-oriented CSS/interaction primitives.
- Classify each item: `PORTABLE`, `HOCKEYSTATS`, or `UNCERTAIN`.
- Identify any accidental HockeyStats coupling/imports.
- Propose the smallest initial library API and repository/package structure.
- Return the proposal to the human for approval before creating/extracting.

### Phase B — independent library
After approval:
- Create the new repository using the approved name/location.
- Move/copy only approved domain-free primitives into it.
- Provide one documented import/entry point and minimal theme/configuration surface.
- Keep runtime dependencies at zero or near-zero; any new dependency requires human approval.
- Preserve tree-shakeable/simple consumption where practical; do not build elaborate plugin architecture.
- Include concise documentation for installation/local development, theming, accessibility/preferences, motion, and what intentionally remains app-specific.
- Add only high-value tests/checks for stable public behavior (for example token/build integrity or small primitive behavior); do not create a giant test framework.

### Phase C — HockeyStats becomes consumer
- Replace duplicated local portable primitives with imports from the independent library.
- Keep HockeyStats theme seed/config and hockey-specific semantics in HockeyStats.
- Avoid a flag-day rewrite: migrate only the shared layer needed to prove real consumption.
- Remove duplicate source only after the imported version is verified.
- Preserve current visuals/behavior unless an explicitly approved QA fix is included.

### Phase D — consumer QA
Use a fresh browser-capable QA subagent:
- build/typecheck both library and HockeyStats
- verify HockeyStats resolves the library through the intended dependency path rather than a hidden local duplicate
- render representative desktop/mobile HockeyStats pages and RinkQuest surfaces that exercise the shared language
- verify light/dark, keyboard focus, touch states, reduced motion, zoom/text sizing, and other extracted preference/accessibility behavior
- confirm no HockeyStats/domain imports or naming exist in the library
- confirm the library can be consumed by a tiny non-hockey example/smoke consumer without HockeyStats code

**Accessibility portability**
The library may provide generic defaults/primitives that help consumers respect accessibility and user preferences, such as focus visibility, reduced motion, theme/color-scheme hooks, state semantics/styling, legibility-oriented tokens, and documented touch/contrast guidance. Do **not** claim the library makes a consuming app automatically accessible; semantic markup, labels, focus management, content, contrast choices, and feature-specific behavior remain consumer responsibilities.

**Motion portability**
Move only domain-free motion vocabulary and generic interaction behavior. Do not export HockeyStats/RinkQuest choreography as generic primitives merely because it already exists.

**Versioning/distribution**
- Initial success is an independent repo/package that HockeyStats can consume through the approved development dependency method.
- Publishing to npm/another registry, CI release automation, semantic-release tooling, changelog bots, docs sites, Storybook, monorepo conversion, and broad versioning automation are separate future decisions unless explicitly approved.
- Prefer the simplest versioning approach needed for one real consumer.

**Constraints**
- No HockeyStats, NHL, team, game, rivalry, schedule, standings, or RinkQuest semantics in the library.
- No giant component framework or attempt to recreate Material UI.
- No new styling/runtime framework unless human-approved.
- Do not extract feature components just to increase library size.
- Do not change the design language during extraction; this is primarily a boundary/migration ticket.
- Do not make the repo/package public or publish externally without explicit human approval.
- Keep contexts separated: library extraction and HockeyStats migration may use separate worker contexts when that reduces rereading.

**Acceptance**
- Independent repository/package exists at the human-approved location/name.
- HockeyStats imports and uses the independent library as a genuine dependency for the approved shared layer.
- Shared tokens/themes/states/motion/preferences are no longer maintained as duplicate HockeyStats-owned source.
- Library contains no hockey/domain-specific imports or names.
- Light/dark, focus, reduced motion, touch/interaction states, and representative responsive visuals remain correct in HockeyStats.
- A minimal non-hockey smoke consumer can import the library without HockeyStats code.
- Documentation clearly separates what the library guarantees from accessibility responsibilities of consuming apps.
- Relevant library + HockeyStats build/typecheck/tests pass.

**Verify:** dependency-boundary check → library checks → HockeyStats checks → non-hockey smoke consumer → browser QA on representative desktop/mobile + accessibility/preferences.  
**Out of scope:** public registry publishing, docs website, Storybook, full generic component suite, monorepo migration, automatic accessibility certification, feature extraction, redesign.

---

### IDEA LIB2 — Library API consolidation & fast integration
**Source:** follow-up to LIB1  
**Depends on:** LIB1 complete and verified with HockeyStats as a real consumer  
**Route:** GPT-5.4 Mini in audit → targeted consolidation → verification phases. Use GPT-5.6 Sol only for evidence-backed package/runtime architecture problems.  
**Goal:** After extraction proves the boundary, simplify the library’s public API, remove overlapping shared logic, and make consuming the Aero/MD3 experience language fast, predictable, and difficult to misuse without introducing a framework-sized abstraction.

**Principle**
LIB1 proves portability. LIB2 optimizes the boundary based on real usage. Do not design an ideal API from imagination; use HockeyStats plus the non-hockey smoke consumer as evidence for what should be consolidated.

### Phase A — consumer/API audit
- Inspect actual imports/usages in HockeyStats and the non-hockey smoke consumer.
- Inventory public exports, configuration steps, duplicated wrappers/helpers, repeated token mappings, repeated preference/motion setup, and consumer boilerplate.
- Identify overlapping logic that now exists on both sides of the package boundary.
- Classify findings: `DUPLICATE`, `NECESSARY CONSUMER CONFIG`, `LIBRARY RESPONSIBILITY`, or `NOT WORTH ABSTRACTING`.
- Identify measurable integration/runtime friction before optimizing it.
- Propose a small consolidation plan; do not rewrite the API yet if the change would be breaking or architectural without human approval.

### Phase B — API cleanup
- Reduce the public surface to a small set of intentional entry points.
- Prefer one obvious import/setup path for the common case.
- Consolidate duplicate domain-free token/theme/motion/preference logic into the library.
- Keep HockeyStats-specific semantics/configuration in HockeyStats.
- Remove deprecated/duplicate exports only after consumers migrate.
- Keep naming consistent and discoverable.
- Avoid barrel/export structures that materially hurt tree-shaking or create circular dependencies.

### Phase C — fast connection
- Minimize setup needed for a new React consumer while keeping configuration explicit.
- Prefer static CSS/tokens and lightweight initialization over runtime indirection.
- Avoid repeated theme/preference calculations across components.
- Ensure shared CSS/assets are loaded once through the intended entry point.
- Measure package/build/runtime effects where practical; optimize only observed overhead.
- Do not add caching, memoization, providers, context layers, code generation, or build plugins without a demonstrated need.

### Phase D — deduplication
- Remove overlapping domain-free helpers/styles from HockeyStats after the library replacement is verified.
- Detect accidental duplicate CSS/token definitions and competing sources of truth.
- Preserve app-specific accessibility behavior, semantic markup, and feature logic where those properly belong to the consumer.
- Do not force feature-specific logic into the library merely to eliminate duplication.

### Phase E — verification
Use a fresh verifier when the API/boundary changes are substantial:
- library + HockeyStats build/typecheck/tests
- confirm intended dependency/import path
- verify no duplicate shared implementation remains for migrated primitives
- smoke-test a fresh/minimal non-hockey consumer using the documented common path
- browser-check representative HockeyStats/RinkQuest surfaces, light/dark, focus, reduced motion, and responsive behavior
- compare any claimed performance/build improvement with evidence

**Developer-experience target**
A developer starting a new React project should be able to understand the normal integration path from a short README section and reach the design language with minimal imports/configuration. Do not optimize for “one magic line” if it hides important theme/accessibility responsibilities.

**Constraints**
- No redesign of Aero/MD3.
- No HockeyStats/RinkQuest domain logic in the library.
- No speculative abstraction or generic plugin system.
- No new runtime dependency unless human-approved and justified by measured value.
- No public breaking API change without human approval.
- Do not optimize bundle/runtime performance without evidence.
- Do not collapse distinct accessibility responsibilities merely to reduce code.
- Prefer deleting duplication over introducing a new abstraction when deletion is sufficient.

**Acceptance**
- Common consumer setup is shorter/clearer than immediately after LIB1.
- Public exports have one clear responsibility and unnecessary overlap is removed.
- Migrated shared primitives have one authoritative implementation.
- HockeyStats-specific configuration remains visibly separate from portable library logic.
- No circular dependency or duplicate shared-style loading is introduced.
- A minimal non-hockey React consumer can integrate from the documented path without repository knowledge.
- Any claimed speed/bundle/runtime improvement is backed by before/after evidence.
- HockeyStats/RinkQuest visuals, themes, motion preferences, focus/accessibility behavior, and relevant tests remain correct.

**Verify:** import/API inventory → duplicate-source check → library/HockeyStats checks → minimal consumer integration → representative browser QA → evidence for any performance claim.  
**Out of scope:** new design features, component-suite expansion, registry/release automation, monorepo conversion, speculative caching, generalized plugin architecture.

---

### IDEA ARCH1 — Extract HockeyStats API into an independent service repo
**Source:** architecture follow-up after LIB1  
**Depends on:** LIB1 complete; preferably run after LIB2 so the frontend/library boundary is stable  
**Route:** GPT-5.4 Mini in bounded inventory → extraction → deployment → consumer verification phases. Use GPT-5.6 Sol only for evidence-backed cross-repo/runtime architecture problems.  
**Goal:** Separate HockeyStats data/API responsibilities from the frontend into an independent repository and Render service, while keeping HockeyStatsWebApp and the portable Aero/MD3 library independently deployable/consumable.

**Target architecture**
```text
HockeyStats API repo
      │
      └── Render API service
                │ HTTPS/JSON
                ▼
HockeyStatsWebApp repo ───── imports ─────► Aero/MD3 library repo
      │
      └── frontend deployment

The design library never depends on or calls the HockeyStats API.
```

**Human checkpoint**
Before creating/moving repositories or changing production deployment, return an inventory and proposed boundary. The human approves: API repo name/location, service boundary, migration approach, Render service changes, environment-variable names, and any contract strategy. Do not delete/move production code or alter live Render services before approval.

### Phase A — boundary inventory
- Inspect current frontend/backend/API/proxy/server/data-fetching code and current Render/deployment configuration.
- Classify relevant code/config as `API`, `FRONTEND`, `SHARED CONTRACT`, `DEPLOYMENT`, or `UNCERTAIN`.
- Identify existing API endpoints, frontend consumers, environment variables, CORS/origin assumptions, secrets, caching/proxy behavior, and health/start commands.
- Identify code that only exists because frontend and API currently share a repo/process.
- Propose the smallest extraction that preserves behavior; do not redesign the backend.
- Flag any shared types/contracts that would become duplicated, but do not create a contracts package unless real duplication warrants a separate human-approved follow-up.

### Phase B — independent API repo
After approval:
- Create the approved API repository and move only backend/API responsibilities.
- Preserve current framework, endpoint behavior, response semantics, and data-source behavior unless a change is required for separation and approved.
- Add minimal README/setup, environment-variable documentation, health/start/build commands, and targeted API checks.
- Keep secrets out of source and history.
- Keep frontend/UI/design-library code out of the API repo.
- Avoid adding frameworks, ORMs, gateways, queues, or infrastructure merely because the API now has its own repo.

### Phase C — explicit frontend contract boundary
- HockeyStatsWebApp calls the API through one obvious configuration/base-URL boundary.
- Keep API DTO/JSON mapping at the frontend boundary rather than leaking transport shapes throughout React components.
- Preserve existing frontend domain models/helpers where appropriate.
- Remove obsolete same-repo/proxy assumptions only after remote API consumption works.
- The Aero/MD3 library remains domain-free and has zero API/network knowledge.
- Do not create a shared-contract package unless duplication is already causing measurable maintenance friction and the human separately approves it.

### Phase D — independent Render deployment
- Configure/prepare the API repo for its own Render Web Service using the existing runtime requirements.
- Configure frontend deployment to consume the API service URL through environment configuration.
- Treat frontend and API as independently deployable services; one should not require rebuilding the other for unrelated changes.
- Configure only necessary CORS/origin behavior; do not use unrestricted production CORS as a convenience unless explicitly justified/approved.
- Preserve secrets/environment separation between services.
- Do not alter DNS/custom domains, paid service tiers, production data, or destructive Render settings without human approval.
- Prefer existing Render capabilities/configuration; no new infrastructure platform.

### Phase E — migration verification
Use a fresh verifier/browser-capable QA path where applicable:
- API build/start/health and targeted endpoint checks
- frontend build/typecheck/tests against configured API boundary
- representative Home/Team/Game/Standings/Schedule/signature-feature data flows
- RinkQuest only where it actually consumes API data
- browser check for loading/error states caused by network separation
- confirm design-library dependency remains independent
- confirm no secrets or backend-only code landed in frontend/library repos
- confirm API and frontend can be built/deployed independently

**Performance & reliability**
- Establish baseline request behavior before changing it.
- Watch for accidental duplicate requests, proxy hops, CORS preflights caused by poor request design, lost caching, or slower critical data paths introduced by extraction.
- Fix only observed regressions; do not introduce Redis/CDN/custom caching/queues/speculative infrastructure without evidence and human approval.
- “Fast connection” means preserving or improving observed request behavior with the simplest architecture, not adding infrastructure.

**Constraints**
- No backend rewrite during extraction.
- No new API framework/runtime/database unless human-approved.
- No design-library network/API coupling.
- No speculative microservices; one API service is the default.
- No automatic shared-types/contracts package.
- No public API breaking changes without human approval.
- No production Render mutation before the checkpoint/approval.
- No secrets committed to any repo.
- Keep contexts separated by phase when that reduces cross-repo rereading.

**Acceptance**
- Independent API repo exists at the approved location and contains only appropriate backend/API responsibilities.
- HockeyStatsWebApp consumes the API through an explicit environment-configured boundary.
- Aero/MD3 library remains independent of HockeyStats/API code.
- Existing representative API behavior/data remains correct after extraction.
- Frontend and API can build/deploy independently.
- Render configuration clearly maps the API repo to its API service and the frontend repo to its frontend service.
- Necessary CORS/origin and environment configuration is documented and no secrets are committed.
- No accidental duplicate API implementation remains in HockeyStatsWebApp for migrated responsibilities.
- Any observed performance regression from separation is resolved or explicitly reported before completion.
- Relevant builds/typechecks/tests/browser checks pass.

**Verify:** boundary inventory → human approval → API checks → frontend contract checks → independent build/deploy config verification → representative browser data-flow QA → secret/domain-coupling scan.  
**Out of scope:** backend rewrite, microservices, new database, public API redesign, GraphQL migration, shared-contract package unless separately approved, new hosting provider, speculative caching/infrastructure.

---

## Later candidates

| Status | Ticket | Source | Note |
|---|---|---|---|
| IDEA | F3 — Playoff What-If | `docs/design-feature-backlog.md` | Logic-heavy; preferably after playoff helper work. |

## Ready

- D3 — Product-level polish and motion

## Active

- LIB1 — Phase A extraction inventory and approval proposal

## Completed

Use existing progress/backlog completion markers as historical truth; do not duplicate the Phase 2 progress log here.
