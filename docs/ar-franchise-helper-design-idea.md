# AR Franchise Helper — Design Idea

Concept document for a future franchise-mode companion experience. This is a design direction, not an implementation backlog.

## Product idea

Turn a phone into an **Assistant GM** while playing a hockey franchise mode.

The player points the phone at the TV/monitor. The app recognizes supported franchise screens, builds a living model of the user's franchise, and surfaces short, contextual advice without forcing the player to stop playing and manage a spreadsheet.

The experience should progress in stages rather than attempting full live AR immediately:

1. **Capture** — photograph/screenshot a supported game screen.
2. **Understand** — extract roster, lines, ratings, morale/chemistry, contracts, standings, or other supported data.
3. **Advise** — explain useful lineup, roster, trade, contract, development, and franchise decisions.
4. **Live Assistant GM** — recognize screens through the camera and surface timely advice while the user plays.
5. **AR layer** — anchor lightweight contextual callouts to useful regions of the recognized screen when doing so is clearer than a normal companion card.

The phone is a companion display, not a replacement game UI.

---

## Design language

Use the same underlying **MD3 foundation + restrained Aero/glass atmosphere** being established for HockeyStats, ideally through `aero-md3-core` rather than recreating the visual system locally.

### Visual principles

- **MD3 provides the rules:** hierarchy, typography, spacing, shape, interaction states, accessibility, touch targets, and predictable controls.
- **Aero provides atmosphere:** translucent surfaces, depth, soft highlights, restrained blur, and a slightly futuristic "GM command center" feel.
- Glass is for hierarchy, not decoration. Do not put every statistic inside another glowing panel.
- Hockey/game-specific colors belong to the project layer; reusable surfaces, focus, motion, spacing, and control behavior belong in the shared design library.
- Information should feel calm and glanceable while a game is running. The design must never demand more attention than the game itself.
- Dark mode is especially important for a camera/TV companion so the phone does not become a bright distraction.

This should visually feel related to HockeyStats without looking like HockeyStats squeezed onto a camera view.

---

## Core experience

### 1. Franchise Home — "GM Desk"

The normal non-camera home screen is a compact franchise dashboard.

**Primary content:**
- team identity + current season
- record / recent form
- cap or roster health when available
- upcoming decisions
- lineup health / chemistry summary
- development watch
- recent Assistant GM observations

The page should answer one question quickly: **"What needs my attention right now?"**

Use a small number of strong surfaces rather than a grid of equally weighted stat cards. Important decisions rise to the top; background information stays quiet.

### 2. Scan mode

Camera opens nearly full-screen with minimal chrome.

**Structure:**
- top: recognized screen type + confidence/status
- center: camera feed with subtle recognition guides
- bottom: one compact action/control surface
- transient: recognition confirmation or a short suggestion

Example status language:

> LINEUP SCREEN RECOGNIZED
> 18 / 20 players read

Do not cover the game UI with permanent boxes while recognition is still uncertain. When confidence is low, ask the user to steady/reframe rather than presenting guessed data as fact.

### 3. Assistant GM mode

The main advice UI is a **bottom-sheet / floating-card system**, not a chat transcript.

A recommendation should normally contain:

**Observation** → **Recommendation** → **Why** → optional **Details**

Example:

> **Chemistry opportunity**
> Try moving Konecny to Line 1.
> Projected chemistry improves while keeping the current center pairing intact.
> `Compare lines`

Advice should be short enough to understand in a few seconds. Detailed reasoning opens only when requested.

### 4. Live AR / "GM Vision"

When the camera recognizes a supported screen, useful information may attach visually to that screen region.

Examples:
- subtle `CHEMISTRY +` indicator beside a line combination
- development warning beside a prospect
- expiring-contract indicator beside a player
- roster-role mismatch indicator
- trade/contract context when a relevant menu is recognized
- "better fit available" marker with a tap target that opens the explanation on the phone

**Important:** AR overlays should be exceptional, not the default representation for every insight. If screen anchoring does not make the information easier to understand, show a normal Assistant GM card instead.

Never create a wall of labels. Prefer one high-confidence, high-value suggestion at a time.

---

## Recommendation priority

The assistant should behave more like a good staff member than a notification feed.

Use three visual levels:

- **Quiet insight** — useful but not urgent; small neutral surface/icon.
- **Opportunity** — a meaningful improvement is available; accent surface and concise action.
- **Needs attention** — roster legality, major contract/cap issue, serious lineup problem, or another condition that requires action; stronger semantic treatment.

Do not use red merely because a recommendation is suboptimal. Reserve danger/error styling for genuinely important conditions.

The user should be able to mute categories and reduce suggestion frequency. Live mode must avoid repeatedly surfacing the same advice.

---

## Signature interaction: Compare Change

The most important decision UI should be a simple **before → after** comparison.

For a proposed lineup/roster move, show only the dimensions that materially change, for example:

- chemistry
- overall lineup balance
- role fit
- morale impact
- development opportunity
- cap/contract impact

Avoid pretending that one opaque AI score is the truth. Show the tradeoff and let the player decide.

This interaction can become a reusable pattern across future sports configuration packs.

---

## Franchise memory

Captured screens should gradually create a living franchise model rather than disappearing after each scan.

Useful timeline events could include:
- player acquired/traded
- contract signed/expiring
- line changed
- player promoted/demoted
- injury/status change when detectable
- prospect development snapshot
- standings/playoff context

The UI should make provenance visible: users should be able to tell whether a fact came from a recent scan, a manual edit, or a derived recommendation.

If two scans conflict, surface the discrepancy rather than silently overwriting trusted state.

---

## Mobile layout

Design mobile-first because the phone is the primary companion device.

### Portrait

- camera/content occupies the majority of the viewport
- primary advice arrives from the bottom within thumb reach
- persistent controls stay minimal
- >=44px touch targets
- safe-area aware
- no tiny stat tables over the camera

### Landscape

Useful when the phone is mounted beside the TV:

- camera or recognized-screen context on one side
- Assistant GM recommendation rail on the other
- no desktop-style navigation chrome

The experience should remain useful without AR. A user should be able to capture screens and review advice entirely through normal accessible UI.

---

## Motion and feedback

Motion communicates state rather than showing off.

Useful motion:
- soft recognition pulse when a screen locks
- card/sheet transition when new advice becomes relevant
- restrained before/after transition when comparing a proposed change
- subtle anchored movement when an AR label tracks a recognized screen region

Avoid constant floating/glowing animations. Respect `prefers-reduced-motion`; in reduced motion, recognition and state changes must remain understandable through static visual changes and text.

Use haptics sparingly for successful capture or a genuinely important Assistant GM alert where the platform supports them.

---

## Accessibility

Live camera features are an enhancement, not the only way to use the product.

- Every AR recommendation must also exist in an accessible normal UI surface.
- Do not communicate recommendation state by color alone.
- Keep text readable against unpredictable camera backgrounds by placing text on controlled surfaces rather than directly over video.
- Provide accessible names for icon-only controls.
- Preserve keyboard support for web/PWA surfaces where relevant.
- Respect reduced motion, contrast, and text scaling.
- Let users pause live recognition and inspect the current recommendation without time pressure.

---

## Reusable architecture boundary

The visual/product design should reinforce the broader project-agnostic engine idea rather than hard-wire the system to one hockey title.

### Engine / reusable layer

Potential reusable concepts:
- camera capture
- screen recognition state
- OCR/vision result confidence
- anchored overlay primitives
- recommendation cards
- before/after comparison
- provenance/conflict UI
- entity/state timeline
- notification priority

### Game configuration layer

Defines what a particular game understands:
- supported screen types
- fields/entities visible on each screen
- terminology
- roster/lineup rules
- optimization objectives
- confidence requirements
- advice categories

### Project layer

Defines the actual product experience and visual domain. Hockey-specific Assistant GM behavior belongs here; generic capture/recognition/advice components should remain reusable enough to support another sport or a non-sports project later.

Do not over-abstract the first implementation. Extract a reusable primitive only after the NHL helper provides a concrete need for it.

---

## MVP design boundary

The first shippable experience should **not** require continuous AR.

A strong MVP is:

**Capture supported franchise screen → verify extracted data → save it to franchise state → receive one explainable recommendation → compare the proposed change.**

That validates the difficult product loop before adding continuous camera tracking.

Live Assistant GM comes next once screen recognition and recommendation quality are trustworthy. True anchored AR follows only for situations where anchoring materially improves usability.

---

## Things to avoid

- generic chatbot as the primary interface
- sci-fi HUD clutter
- permanent overlays covering the game
- dozens of simultaneous recommendations
- opaque "AI says this lineup is 92/100" scoring
- recreating game menus on the phone
- assuming OCR/vision output is always correct
- making AR mandatory
- putting hockey-specific visual rules into `aero-md3-core`
- building a giant universal engine before the first end-to-end franchise workflow works

---

## North-star demo

A player opens franchise mode and points their phone at the lineup screen. The app recognizes the screen and quietly confirms that the roster is synced. A small Assistant GM card appears: **"Chemistry opportunity — one line change may improve the top six without reducing role fit."** The player taps it, sees the current and proposed lines side-by-side with the affected dimensions highlighted, accepts or dismisses the idea, and keeps playing.

Later, while viewing contracts, the phone recognizes the screen and surfaces one relevant expiring-contract decision. The experience feels like a calm assistant sitting beside the player—not another game UI competing for attention.

That is the design target.