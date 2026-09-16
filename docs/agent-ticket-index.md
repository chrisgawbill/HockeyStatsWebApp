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

### ACTIVE F1 — Game Story
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

### IDEA E2 — Team form and momentum
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

## Later candidates

| Status | Ticket | Source | Note |
|---|---|---|---|
| IDEA | F2 — Team DNA | `docs/design-feature-backlog.md` | Better after D1/D2; can reuse E2. |
| IDEA | F3 — Playoff What-If | `docs/design-feature-backlog.md` | Logic-heavy; preferably after playoff helper work. |
| IDEA | E1 — Playoff race command center | `docs/exciting-features-backlog.md` | Pure derivation; larger rules surface. |
| IDEA | E3 — Head-to-head matchup explorer | `docs/exciting-features-backlog.md` | Reuses loaded schedule data. |
| IDEA | F4 — Signature interaction polish | `docs/design-feature-backlog.md` | Only after a signature feature exists. |

## Ready

None.

## Active

- F1 — Game Story (Phase B implemented; manual UI verification pending)

## Completed

Use existing progress/backlog completion markers as historical truth; do not duplicate the Phase 2 progress log here.
