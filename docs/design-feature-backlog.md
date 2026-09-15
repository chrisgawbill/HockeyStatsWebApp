# Design + Signature Feature Backlog

> A focused product/design track for making HockeyStatsWebApp feel like a designed hockey product rather than a generic statistics dashboard.
>
> This backlog intentionally sits alongside `docs/frontend-backlog.md` and `docs/exciting-features-backlog.md`. It does **not** replace the existing MD3 work or the existing E1–E9 feature ideas.
>
> **Design direction:** use the existing MD3 token foundation as the structural system, then add a restrained Aero/glass visual personality on top. Do not attempt a wholesale Material Design 3 component-library migration. The existing frontend backlog already chose MD3 tokens + custom CSS rather than a component library.
>
> **Product direction:** build three distinctive experiences in sequence:
> 1. **Game Story** — explain what actually happened in a game.
> 2. **Team DNA** — explain what kind of team this is.
> 3. **Playoff What-If** — let fans explore how outcomes change the race.
>
> The goal is not to finish every ticket. A junior designer/developer should be able to complete the design system foundation and one flagship experience well, then use the same system to improve existing screens.

## Working rules for this backlog

- **Design first, implementation second.** Each feature should have a small written UX spec before substantial code is written.
- **Use existing data before adding APIs.** Prefer projections of `ScheduleContext`, `StandingsContext`, team data, and existing game-detail data.
- **No giant redesign.** Work screen-by-screen. Keep existing routes and information architecture unless a ticket explicitly changes them.
- **MD3 underneath, Aero above.** Use semantic design tokens, accessible contrast, predictable states, and familiar controls. Aero is the surface treatment, not the information architecture.
- **Glass is an accent.** Do not put every table, card, and paragraph inside translucent glass. Dense statistics need solid, readable surfaces.
- **Motion explains state.** Avoid decorative animation that makes data harder to scan.
- **Junior-friendly means reversible.** Prefer small components, pure helpers, and one responsibility per ticket.
- **Stop when the acceptance criteria are met.** Record unrelated discoveries rather than expanding scope.

---

# D1 — Establish the HockeyStats visual foundation

- [ ] **Owner:** Design + frontend | **Depends on:** existing `docs/frontend-backlog.md` F1–F4 where applicable | **Data:** none

Create the visual foundation that the three signature experiences will share. This is the "design system lite" ticket, not a complete MD3 implementation.

### What this should accomplish

Define a small, reusable set of decisions for:

- typography hierarchy
- page background and surface hierarchy
- primary/secondary/tertiary semantic colors
- borders and outlines
- corner radius scale
- elevation/shadow scale
- buttons and interactive states
- selected/hover/focus/disabled states
- compact data surfaces
- responsive spacing
- light/dark theme behavior

The existing token work in `react/src/index.css` / current style architecture should be extended rather than replaced.

### Implementation prompt

```text
ROLE: You are the senior frontend engineer pairing with me. I am a junior developer learning the codebase. Explain the reasoning before implementation. Give me one numbered step at a time and pause so I can implement it. Do not generate a giant replacement file for me.

PROJECT: HockeyStatsWebApp. React + TypeScript + Vite + CSS Modules. The repository was recently moved toward Bulletproof React paths under react/src/{app,features,components,lib,styles}; check docs/architecture.md before assuming an old path.

READ FIRST:
1. docs/architecture.md
2. docs/frontend-backlog.md — especially F1–F5 and the decision record about MD3/custom CSS
3. Current global token/style files under react/src/styles/ and/or react/src/index.css
4. Two or three existing pages and their CSS modules
5. One existing component that already handles focus/hover/disabled states well

TASK: Establish a small HockeyStats visual foundation that uses MD3 principles underneath and a restrained Aero/glass visual personality above it.

IMPORTANT DESIGN RULE:
- Do NOT install a Material component library.
- Do NOT rewrite the whole app.
- Do NOT make every surface glass.
- Do NOT introduce arbitrary one-off colors in page CSS.
- Preserve accessibility and readable data tables over visual effects.

STEPS:
1. Inventory: identify the existing tokens and style conventions. Write down what already exists before changing anything.
2. Design decisions: choose a small scale for typography, spacing, radius, elevation, and semantic colors. Explain why each scale is small enough for a junior project to maintain.
3. Token implementation: add only the missing semantic tokens. Prefer names such as primary, on-primary, surface, surface-container, outline, success, warning, danger rather than page-specific names.
4. Aero treatment: define one or two reusable surface patterns (for example, a subtle translucent hero surface and a solid data surface). Make sure the data surface is the default for dense content.
5. Interactive states: standardize hover, focus-visible, active, selected, and disabled behavior. Do not use transform/scale hover effects for controls unless there is a clear reason.
6. Typography: apply the hierarchy to one representative page only. Do not migrate the whole application in this ticket.
7. Theme check: verify light and dark themes and test the focus state with keyboard navigation.
8. Document: add a short section to docs explaining the visual rules so future tickets do not invent their own styles.

INVARIANTS:
- Existing routes keep working.
- No new runtime dependency.
- No raw hex values in new page/component CSS when a semantic token can be used.
- Light and dark themes both remain usable.
- Dense statistics remain higher contrast than decorative surfaces.

OUT OF SCOPE:
- Full app redesign
- Replacing React Bootstrap grid if it is still needed for layout
- Building a component library
- Redesigning every existing page
- Motion system beyond basic interaction states

DONE WHEN:
- TypeScript/build checks pass.
- A reviewer can understand the new visual tokens without reading every page.
- One representative page demonstrates the new visual language.
- Keyboard focus is visible.
- Both themes are legible.
- The implementation is small enough that a junior developer can explain every new token.
```

---

# D2 — Apply the visual foundation to Home → Game → Team

- [ ] **Owner:** Design + frontend | **Depends on:** D1 | **Data:** existing data only

Use the new foundation on three existing surfaces rather than attempting a full application migration. These screens become the visual "spine" of the product.

### Target screens

1. **Home:** orient the user quickly: what is happening, what matters, where to go.
2. **Game:** establish the visual language for a high-attention hockey event.
3. **Team:** establish the visual language for a data-rich entity page.

### Implementation prompt

```text
ROLE: Senior frontend engineer mentoring a junior developer. I will write the code. Explain one step, let me implement it, then review before moving on.

READ FIRST:
1. docs/design-feature-backlog.md D1
2. docs/architecture.md
3. Current Home/landing page
4. Current GameDetailPage
5. Current TeamPage
6. Their CSS modules and shared layout components

TASK: Apply D1's visual language to Home, Game Detail, and Team without redesigning their information architecture.

STEPS:
1. Make a quick screen inventory: identify the hero, primary action, dense data, secondary information, and empty/loading/error states on each page.
2. Pick one visual hierarchy change per page. Do not make ten changes at once.
3. Home: create a stronger entry hierarchy and reserve the Aero treatment for the most important hero/summary surface.
4. Game: make score/state the dominant visual anchor, with dense stats using solid readable surfaces.
5. Team: establish a repeatable entity-page hierarchy that can later host Team DNA.
6. Check responsive behavior at approximately 576px, 768px, and desktop width. Fix overflow before polishing.
7. Check both themes and keyboard focus.
8. Capture a short before/after note in this ticket describing the design decisions.

INVARIANTS:
- No route changes.
- No new API calls.
- Do not duplicate existing components if a shared component can be reused safely.
- Do not add visual effects that reduce table/chart readability.

OUT OF SCOPE:
- Game Story
- Team DNA
- Playoff What-If
- Full navigation redesign
- Migrating every legacy page

DONE WHEN:
- Home, Game, and Team visibly share the same design language.
- Each page still works on mobile.
- Existing data and links remain intact.
- Build/type checks pass.
```

---

# F1 — Game Story: turn a game into a visual narrative

- [ ] **Owner:** Design + frontend | **Depends on:** D1, preferably D2 | **Data:** existing game-detail + schedule data; no new endpoint unless the required event fields are genuinely absent

**Flagship feature #1.** Instead of presenting a box score as a wall of numbers, answer the fan question: **"What actually happened in this game?"**

The experience should tell a compact story such as:

- who struck first
- when the game changed direction
- how the lead moved
- which period was decisive
- whether special teams mattered
- how the final score was reached

A simple version can use a period/goal timeline, score-state changes, key statistical turning points, and a concise generated/derived narrative. Avoid pretending to have richer event data if the API does not provide it.

### UX concept

The user lands on a game and sees:

1. **Hero:** final/live score + game state.
2. **Story timeline:** major scoring events in chronological order.
3. **Momentum/lead strip:** visual score state across the game.
4. **Turning point cards:** derived moments such as "Colorado took its first lead in the 2nd."
5. **Numbers that explain the story:** shots, PP, faceoffs, etc. only where useful.

### Implementation prompt

```text
ROLE: Senior frontend engineer mentoring a junior developer. I am learning. I write the implementation. Guide me one step at a time and pause after each step. Do not generate a full feature in one response.

READ FIRST:
1. docs/architecture.md
2. docs/design-feature-backlog.md D1 and F1
3. Existing GameDetailPage and its current types/helpers/api files
4. Existing normalized schedule/game models
5. Any existing game-event/scoring-event data already returned by the game detail endpoint
6. docs/exciting-features-backlog.md to ensure we are not duplicating another ticket

PRODUCT QUESTION:
How can a fan understand the story of a hockey game without reading the entire box score?

TASK: Build a "Game Story" section on the existing game detail experience.

FIRST RULE: Do not assume the API contains fields we have not inspected. If a desired visual requires unavailable event data, stop and document the gap before changing the backend.

STEPS:
1. Data inventory: list exactly which game events, scores, periods, shots, special teams, and timestamps are available. Mark each as available/not available.
2. Story contract: design a small typed view model for the story. Keep raw NHL response handling in the existing game-detail helper boundary.
3. Pure derivation: create a pure helper for chronological scoring events, lead changes, period summaries, and a small set of turning-point facts. Keep the helper independent from React.
4. Timeline: render a readable vertical or horizontal scoring timeline. Each event must have an accessible text equivalent.
5. Lead state: create a compact visual showing whether the game was tied, home-led, away-led, or in overtime at each scoring transition. Do not fake continuous "momentum" when only scoring events are known.
6. Turning points: derive 2–4 factual observations from available data. Examples: first lead, largest lead, tied-after-two, special-teams edge. Avoid subjective claims such as "the team dominated" unless the data supports a clear rule.
7. Responsive layout: desktop may use a split composition; mobile should become a single chronological flow.
8. Empty states: historical games may have incomplete detail. Render the best available story rather than blanking the entire page.
9. Visual polish: use D1 tokens. Aero treatment may be used for the story hero, while timeline/data surfaces stay readable.
10. Manual verification: compare one completed game with the official game record and verify every displayed event.

INVARIANTS:
- No invented statistics or events.
- Pure derivation logic is unit-testable.
- Existing game navigation state is preserved.
- Accessible text remains available when visual timeline elements are hidden.
- No chart library unless the project already has one that clearly fits.

OUT OF SCOPE:
- Live play-by-play reconstruction if the current endpoint cannot support it
- AI-generated commentary
- New backend endpoint solely for convenience
- Rebuilding GameDetailPage from scratch
- A generic charting framework

DONE WHEN:
- A completed game has a clear visual story in under 10 seconds of scanning.
- Every story fact can be traced to existing data.
- Mobile and dark theme work.
- Missing event data degrades gracefully.
- Typecheck/build/tests pass.
```

---

# F2 — Team DNA: show what kind of team this is

- [ ] **Owner:** Design + frontend | **Depends on:** D1, D2, ideally E2 team-form helpers | **Data:** existing season schedule + standings/team stats; zero new fetches preferred

**Flagship feature #2.** Give each team a visual identity based on measurable tendencies rather than another table of totals.

Potential dimensions:

- scoring environment
- goal differential
- home vs road performance
- recent form
- ability to protect a lead / frequency of comebacks if derivable
- special-teams profile if available
- pace/consistency across the season

The design should feel closer to a "team fingerprint" than a radar chart stuffed with arbitrary numbers.

### UX concept

A team page section titled **Team DNA** with:

- 4–6 clearly labeled dimensions
- short plain-language interpretations
- a visual fingerprint/profile
- comparison to league average only where the required league data is already loaded
- a "this season" label so the user knows the scope

### Implementation prompt

```text
ROLE: Senior frontend engineer mentoring a junior developer. I write the code. Explain the reasoning, then give me one implementation step at a time.

READ FIRST:
1. docs/architecture.md
2. docs/design-feature-backlog.md D1 and F2
3. TeamPage and its current helper/model files
4. ScheduleContext / standings context under the current Bulletproof React paths
5. docs/exciting-features-backlog.md E2 if it has landed or is in progress
6. Existing team stats available without another fetch

TASK: Add a "Team DNA" visual profile to the Team page.

DESIGN WARNING:
Do not automatically choose a radar chart. First determine whether the dimensions can be compared meaningfully. Prefer a clearer custom profile if a radar chart would imply false precision.

STEPS:
1. Data audit: list candidate metrics that are actually available for the selected season. Reject metrics that require new data just for this feature.
2. Choose dimensions: select 4–6 metrics that answer distinct questions. Avoid six versions of scoring rate.
3. Define normalization: decide how each metric becomes a comparable visual value. If league-average normalization is unavailable, use a clearly labeled team-only scale instead.
4. Create a pure `teamDnaHelper` with small functions for each derived metric. No React imports.
5. Define the view model: labels, value, display value, direction (higher/lower/balanced), and a short factual explanation.
6. Build the visual fingerprint. Favor horizontal profiles, segmented bars, or compact cards over a decorative radar if the data is easier to read that way.
7. Add a compact mobile layout. Nothing should require horizontal scrolling.
8. Add plain-language labels. Example: "Road form — 58% points" rather than "Away P%" when space allows.
9. Add a small methodology note: season, sample size, and whether values are team-only or league-relative.
10. Test against one strong team, one middle team, and one struggling team so the visualization does not collapse to the same shape.

INVARIANTS:
- No fabricated metrics.
- No hidden normalization.
- All calculations live in pure helpers.
- The visual is supplementary; raw values remain readable.
- Existing TeamPage tabs/URL state remain intact.

OUT OF SCOPE:
- Player-level DNA
- Historical multi-season DNA
- Machine learning/team clustering
- New backend endpoints
- A league-wide ranking page

DONE WHEN:
- A user can describe the team's style/profile after a quick scan.
- Values have clear definitions.
- The feature remains useful in past seasons with available data.
- Mobile and dark theme work.
- Typecheck/build/tests pass.
```

---

# F3 — Playoff What-If: let fans change the future

- [ ] **Owner:** Design + frontend | **Depends on:** D1, preferably E1 playoff-race derivations | **Data:** existing standings + schedule; zero new fetches

**Flagship feature #3.** Turn playoff standings from a static snapshot into a lightweight sandbox.

A fan can change selected future game outcomes and immediately see the projected playoff race change.

Example interaction:

> "What if my team wins the next 5?"

The app adjusts the projected standings and shows:

- new points
- playoff position
- cutline distance
- teams displaced
- biggest movement

### Important scope constraint

This is **not** a perfect NHL playoff simulator. Start with deterministic what-if scenarios over selected future games. A future ticket can add Monte Carlo simulation.

### Implementation prompt

```text
ROLE: Senior frontend engineer mentoring a junior developer. I am a junior developer and will write the code. Guide me conceptually and one step at a time. Do not give me a complete implementation upfront.

READ FIRST:
1. docs/architecture.md
2. docs/design-feature-backlog.md D1 and F3
3. docs/exciting-features-backlog.md E1 and E4 — understand existing playoff and lottery derivations before duplicating anything
4. Current standings/schedule contexts and their helper files
5. Existing StandingsPage and URL-state patterns

TASK: Build a deterministic "Playoff What-If" experience using already-loaded standings and future schedule games.

CORE USER STORY:
I want to change a few upcoming game outcomes and instantly understand how that changes my team's playoff position.

STEPS:
1. Data model: identify the minimum future-game fields required: game id, teams, date, current status, and enough information to assign a winner. Confirm them from actual models.
2. Scenario state: design a local scenario object/map keyed by game ID. Do not mutate context data.
3. Projection helper: create a pure helper that applies scenario results to a copied standings projection. Keep original standings untouched.
4. Scope the math: start with points only. Clearly document how a selected win/loss affects points and what happens for OT/SO if the scenario needs it. Do not pretend to calculate exact NHL tiebreakers.
5. Build the interaction: show a short list of upcoming games with simple outcome controls such as Home win / Away win / Reset. Make the controls understandable without a legend.
6. Results view: show before vs after points, playoff position, and movement. Highlight the user's selected team and the largest movers.
7. Add a "reset scenario" action and make sure browser refresh returns to the default scenario unless there is a compelling existing URL-state pattern.
8. Empty/edge states: past season, no remaining games, and teams already mathematically resolved.
9. Visual polish: use D1. Make the changed values visually obvious but avoid aggressive animation.
10. Add a small methodology disclaimer: deterministic scenario, simplified tiebreakers, not official NHL playoff odds.

INVARIANTS:
- Scenario changes cause zero network requests.
- Context data is never mutated.
- Projection math is pure and testable.
- Existing standings remain available as the baseline.
- No random simulation in this ticket.

OUT OF SCOPE:
- Monte Carlo odds
- Exact NHL tiebreaker engine
- Saving/shareable scenarios
- Authentication
- Backend changes

DONE WHEN:
- A user can change at least three upcoming results and immediately see a coherent before/after projection.
- Reset returns exactly to the original standings.
- No network requests occur during scenario editing.
- Past seasons and season-end states do not crash.
- Typecheck/build/tests pass.
```

---

# F4 — Signature interaction polish: make the product feel alive

- [ ] **Owner:** Design + frontend | **Depends on:** D1 + at least one of F1/F2/F3 | **Data:** none

Add a small, coherent motion language to the signature experience that was actually built. This is the final polish pass, not a general animation project.

### Rules

- Motion communicates change, hierarchy, or navigation.
- Keep transitions short.
- Respect `prefers-reduced-motion`.
- Never animate a dense table simply because it can be animated.
- Avoid scale/translate hover gimmicks.

### Implementation prompt

```text
ROLE: Senior frontend engineer mentoring a junior developer. I write the code. Work one small step at a time.

READ FIRST:
1. docs/design-feature-backlog.md D1 and the completed signature feature ticket
2. Existing CSS transition conventions
3. Any existing reduced-motion handling

TASK: Add a tiny motion language to the strongest signature feature only.

STEPS:
1. Identify three moments where motion improves comprehension: entering a feature, changing a scenario/state, and revealing a secondary detail.
2. Define one transition duration/easing convention using existing tokens where possible.
3. Implement one motion at a time and verify it does not change layout unexpectedly.
4. Add `prefers-reduced-motion` handling.
5. Remove any animation that is decorative rather than informative.
6. Test keyboard interactions and mobile performance.

OUT OF SCOPE:
- Page-wide animation
- Parallax
- Scroll-jacking
- Animated backgrounds
- New animation libraries

DONE WHEN:
- The feature feels responsive without feeling like a demo.
- Reduced-motion users get an equivalent experience.
- No layout jumps or distracting loops remain.
```

---

# F5 — Portfolio-quality pass: document the design decisions

- [ ] **Owner:** Design | **Depends on:** D1, D2, and at least one flagship feature | **Data:** none

Turn the work into a coherent case study inside the repository. This is useful for future contributors as well as a portfolio review.

### Capture

- problem statement
- target user question
- before/after screenshots or links where practical
- design principles
- important rejected ideas
- data constraints
- accessibility decisions
- what is derived locally vs fetched
- what remains intentionally unfinished

### Implementation prompt

```text
ROLE: Senior engineer/designer helping a junior developer document finished work. Keep this concise and factual.

READ FIRST:
1. docs/design-feature-backlog.md
2. docs/frontend-backlog.md
3. docs/exciting-features-backlog.md
4. The completed flagship feature ticket

TASK: Add a short design decision record for the work completed in this backlog.

STEPS:
1. Write the user problem in one paragraph.
2. Write the design direction in 4–6 bullets.
3. Explain why MD3 is used as a structural foundation rather than copied literally as the visual identity.
4. Explain where Aero/glass is used and where it is intentionally avoided.
5. Explain the flagship feature's core interaction and why it is useful.
6. Record data limitations and any simplifications honestly.
7. Record accessibility/reduced-motion decisions.
8. Add links to the implementation tickets and any relevant screenshots/assets.

DONE WHEN:
- Another developer can understand why the UI looks the way it does.
- A portfolio reviewer can understand the problem, process, and outcome without reading source code.
- No marketing claims are presented as technical facts.
```

---

# Suggested execution order

### Milestone 1 — Make the foundation

- [ ] D1 Visual foundation
- [ ] D2 Home → Game → Team application

### Milestone 2 — Build one memorable thing

- [ ] F1 Game Story
- [ ] F4 Motion polish

### Milestone 3 — Add the two supporting ideas if scope allows

- [ ] F2 Team DNA
- [ ] F3 Playoff What-If

### Milestone 4 — Package the work

- [ ] F5 Portfolio-quality design record

**Recommended stopping point:** D1 + D2 + F1 + F4 is already a strong junior designer/developer project. F2 and F3 should be treated as follow-on features, not reasons to dilute the quality of Game Story.

## Design north star

> **MD3 gives HockeyStats the rules. Aero gives it atmosphere. The signature features give it a reason to exist.**

The app should feel like a hockey product first and a design-system exercise second.
