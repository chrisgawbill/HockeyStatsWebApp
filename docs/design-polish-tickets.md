# HockeyStats Design Polish Tickets

Focused visual-polish backlog for the HockeyStats site after the initial Aero/MD3 migration work. These tickets should improve hierarchy, spacing, responsiveness, accessibility, and consistency without redesigning the product or adding unnecessary framework code.

## Operating principles

- Prefer fixing a reusable Aero/MD3 primitive in `aero-md3-core` when the same visual rule should apply across multiple projects.
- Keep HockeyStats-only layout and hockey-domain styling in this repository.
- Do not duplicate a design-system rule locally when an Aero token or primitive can own it.
- Preserve routes, data behavior, keyboard behavior, dark mode, and current feature set.
- Avoid large rewrites. Make small, reviewable visual changes.
- Every visual ticket requires rendered desktop + mobile browser QA, not source inspection alone.
- Accessibility is part of polish: visible focus, readable contrast, >=44px mobile targets where appropriate, reduced-motion support, semantic headings, and no layout that depends on hover alone.

---

## UI-01 — Fix global navigation width, mobile nav, and season selector

**Goal:** Make the global Aero navigation feel intentional, full-width, and comfortable on desktop, while turning the mobile bottom navigation + season control into clean, deliberate app chrome rather than a crowded stack of floating controls.

**Read:** `react/src/components/PageHeader.tsx`, `react/src/components/PageHeader.module.css`, `react/src/components/SeasonSelector.tsx`, `react/src/components/SeasonSelector.module.css`, `react/src/app/index.tsx`, global mobile page-bottom spacing, and relevant Aero layout/control primitives in `aero-md3-core`.

**Problems visible in current UI:**
- Desktop header derives width from Bootstrap gutter variables and negative margins, so it can look inset instead of spanning the viewport.
- Mobile primary navigation is visually cramped: five destinations plus back/search/utility behavior compete inside a small fixed area.
- The selected nav item has noticeably more visual weight than neighboring items, which makes spacing look uneven.
- The season selector sits as a floating pill above the bottom nav and visually overlaps the page/nav boundary instead of reading as an intentional control row.
- The current mobile bar uses a large fixed top padding to make room for the selector, coupling layout to one specific control height.
- The search FAB, season selector, bottom nav, and page content can visually compete in the same lower-screen region.
- Fixed chrome must reserve its real height so cards/content never disappear underneath it.

**Change — desktop:**
- Make nav chrome span the actual viewport width independently of the constrained page-content container.
- Remove Bootstrap-gutter coupling and negative-margin width calculations from header sizing.
- Keep content centered/constrained separately from full-width chrome.
- Rebalance brand, search, season selector, nav destinations, and utility spacing so controls do not read as one compressed strip.
- Keep the current Aero/MD3 language, but avoid adding more one-off gradients/borders when an Aero primitive should own the treatment.

**Change — mobile primary nav:**
- Keep the bottom navigation if it remains the clearest pattern, but make it a true full-width mobile app bar anchored to the viewport edges and safe area.
- Give the five primary destinations equal, predictable slots. The active item may be highlighted, but must not distort the geometry of the row.
- Keep each destination >=44px tall and large enough to tap without relying on tiny icon hit areas.
- Use consistent horizontal insets/gaps rather than shrinking individual buttons until they fit.
- Prevent clipping/wrapping at 320px width; if secondary controls cannot fit, move them out of the primary row rather than reducing tap targets.
- Keep the active state obvious in both themes without making inactive items visually disappear.
- Search/back/utility actions must not create a sixth/seventh cramped slot in the primary five-item row.

**Change — mobile season selector:**
- Treat the season control as its own compact secondary chrome row/control, not as an absolutely-positioned pill that happens to sit over the nav.
- It may visually attach to the bottom nav, but its layout must be structurally separate so changing its height does not require magic top padding on the nav.
- Center it intentionally and give it enough breathing room from both page content and the primary nav row.
- Preserve a >=44px usable target where practical, readable season text, chevron state, keyboard focus, and screen-reader labeling.
- The listbox must open in the direction with available space on mobile (normally upward above a bottom bar), remain inside the viewport, and never render behind the nav/search FAB.
- Long/alternate season labels must not widen the control enough to collide with neighboring chrome.
- Avoid covering the last visible card/row: page bottom padding must be derived from the combined fixed chrome height (primary nav + season row + safe area), not a stale hard-coded approximation.

**Change — mobile search/back relationship:**
- Keep search easy to reach, but ensure the FAB does not collide with the season selector or obscure nav labels/icons.
- Back navigation should appear only when useful and must not compress the five persistent destinations below their target size.
- Prefer one clear spatial hierarchy: page content -> season/secondary control -> primary nav, with the search action positioned deliberately outside that row.

**Reusable-library rule:** If full-bleed app chrome, equal-slot mobile navigation, or compact control-bar spacing is generally reusable, add the smallest additive primitive/token to `aero-md3-core` and consume it here. Keep route names, hockey-specific behavior, and season data logic in HockeyStats.

**Do not:** Add a navigation dependency; redesign route structure; hide primary destinations behind a hamburger menu; shrink touch targets to make controls fit; hard-code another selector height into body padding; or solve overlap by adding arbitrary z-index values without fixing layout ownership.

**Done when:**
- Desktop nav reaches the viewport edges while page content remains centered/constrained.
- No horizontal overflow at common desktop widths.
- At 320px, 375px, 390px, and 430px widths, all five primary nav destinations remain visible, evenly spaced, unwrapped, and >=44px tall.
- The active destination does not change the width/position of neighboring destinations.
- The season selector reads as an intentional secondary control, does not overlap page content, and does not require magic nav padding to make room for itself.
- Opening the season selector on mobile keeps the entire listbox visible/scrollable above the bottom chrome and above the search FAB.
- Search, back, season selector, and primary nav do not overlap one another in portrait orientation.
- The last page card/row can scroll fully above the fixed chrome.
- Safe-area insets work on devices with a home indicator.
- Keyboard focus and active-route states are clearly visible in light/dark themes.
- Browser screenshots are captured at desktop plus 320px, 375px, 390px, and 430px mobile widths, including one screenshot with the season menu open.

---

## UI-02 — Establish one page-shell and section-spacing system

**Goal:** Remove the uneven vertical rhythm and large accidental empty zones visible across the site.

**Read:** `react/src/styles/shared.module.css`, `react/src/styles/index.css`, `react/src/app/LandingPage.module.css`, major page-level CSS modules, Aero spacing/layout tokens.

**Change:**
- Define one consistent content-width, horizontal gutter, section-gap, and page-top/page-bottom spacing scheme.
- Replace ad-hoc margins/padding where they create visibly inconsistent rhythm.
- Use Aero spacing tokens (`--ds-space-*`) or map HockeyStats aliases directly to them rather than maintaining a parallel spacing scale.
- Tighten large blank gaps between hero/introduction content and the first meaningful data section.
- Keep enough whitespace to separate concepts; the goal is intentional rhythm, not density for its own sake.
- Ensure mobile section spacing compresses appropriately without making cards touch the viewport edges.

**Do not:** Mass-format unrelated CSS or change content order.

**Done when:** Landing, standings, schedule, teams, team detail, matchup, and other primary stats pages share a visibly consistent page rhythm on desktop/mobile.

---

## UI-03 — Strengthen landing-page hierarchy and game-card readability

**Goal:** Make the landing/schedule-facing experience read in a clear order instead of presenting several similarly weighted rectangles.

**Visual reference:** Current page screenshot shows a strong nav, followed by a subdued season intro, a large gap, a `Tonight's Games` section, a rivalry callout, and game cards with similar visual weight.

**Read:** landing/schedule page components, game-card components, rivalry callout component/styles, shared surface styles.

**Change:**
- Give the page intro a clearer relationship to the first data section; reduce dead space.
- Make section headings visually distinct from card titles without simply increasing every font size.
- Establish a card hierarchy: primary matchup information first, secondary metadata second, badges/status last.
- Improve mobile game-card scanning: teams, logos, score/time, rivalry/preseason/status information should remain readable without visual clutter.
- Make rivalry treatment noticeable but restrained; use the semantic danger/accent language consistently instead of introducing a second custom red treatment.
- Use shared Aero surface/card primitives for common structure, while keeping hockey-specific accents local.
- Avoid excessive shadows, nested bordered boxes, or decorative gradients on every element.

**Done when:** A user can visually identify page title -> section title -> matchup -> status/meta in that order at a glance on desktop and phone widths.

---

## UI-04 — Consolidate duplicated Aero surface, typography, and interaction recipes

**Goal:** Stop HockeyStats from maintaining a second mini design system beside `aero-md3-core`.

**Read:** `react/src/styles/index.css`, `react/src/styles/theme.css`, `react/src/styles/shared.module.css`, component CSS modules with repeated gradients/borders/radii/focus states, `aero-md3-core/src/core.css`.

**Change:**
- Inventory local aliases and repeated recipes for spacing, typography, radii, elevation, surfaces, focus rings, hover/pressed motion, and glass/Aero treatments.
- Keep hockey-domain colors/tokens local (rink, teams, gameplay, rivalry where domain-specific).
- Move generally reusable visual language into additive `aero-md3-core` tokens/classes when it is missing there.
- Replace duplicate HockeyStats recipes with the Aero primitive or a thin local semantic wrapper.
- Prefer semantic roles over raw values.
- Remove obsolete aliases only after all consumers are migrated and visual parity is verified.

**Do not:** Move hockey-specific domain tokens into the shared package or introduce React components into the CSS-first Aero library.

**Done when:** Shared visual rules have one source of truth and HockeyStats local CSS is primarily layout/domain styling rather than duplicated design-system infrastructure.

---

## UI-05 — Polish data surfaces: tables, stat blocks, chips, and controls

**Goal:** Make dense hockey data easier to scan without making the interface feel heavier.

**Read:** standings/stat-leader/team tables, chips/badges, filters, season controls, Aero table/control primitives.

**Change:**
- Normalize row heights, header treatment, numeric alignment, spacing, divider contrast, and selected/sort/focus states.
- Keep dense desktop tables compact but readable; on mobile prefer controlled horizontal overflow or deliberate information prioritization rather than tiny text.
- Standardize chips/badges for status categories so preseason, rivalry, clinched, live/final, etc. do not each invent unrelated styling.
- Bring form controls and filter controls to one Aero/MD3 interaction language.
- Ensure sortable headers and row navigation are obvious to keyboard and pointer users.

**Done when:** Tables and dense stat surfaces feel like one system in light/dark mode, and mobile users do not need to zoom to read primary information.

---

## UI-06 — Accessibility and motion polish pass

**Goal:** Bring the stats site to the same accessibility standard as the visual design without overengineering.

**Read:** global styles, PageHeader, modal/dialogs, interactive cards, tables, forms, existing reduced-motion rules.

**Change:**
- Audit visible focus across all interactive elements; no interaction should lose a clear focus indicator against glass/surface backgrounds.
- Verify text/icon contrast in light and dark modes, especially secondary text on translucent navigation and subtle surfaces.
- Ensure icon-only mobile controls have accessible names.
- Verify heading order and landmark structure on major pages.
- Respect `prefers-reduced-motion` for transforms, smooth scrolling, and decorative transitions.
- Check target sizes on mobile; do not reduce below usable dimensions to solve layout crowding.
- Confirm hover-only styling has equivalent focus/pressed/selected affordances.

**Do not:** Add an accessibility framework dependency unless a concrete gap cannot reasonably be solved with platform semantics/CSS.

**Done when:** Keyboard-only navigation can traverse all major routes and controls with visible focus; reduced-motion removes non-essential movement; light/dark contrast issues found in browser QA are fixed.

---

## UI-07 — Cross-page visual QA and final cleanup

**Goal:** Catch inconsistencies that remain after UI-01 through UI-06 without starting a redesign cycle.

**Depends on:** UI-01 through UI-06.

**QA scope:** landing, standings, schedule/month view, teams, team detail, matchup, stat leaders, draft lottery, dialogs, and any other main stats route. RinkQuest should only be checked for global chrome regressions; its game-specific polish belongs in its own ticket set.

**Verify at:**
- desktop wide (~1440px)
- desktop/laptop (~1024px)
- tablet (~768px)
- phone (~390px)
- narrow phone (~320px)
- light and dark theme
- keyboard-only navigation
- reduced-motion enabled

**Find/fix only:** obvious spacing drift, clipped content, inconsistent border radius/elevation, unreadable text, broken focus, overflow, awkward nav/card alignment, or component states that no longer match the Aero system.

**Do not:** Invent new features or reopen already-approved design decisions because of subjective preference.

**Done when:** Browser QA produces no high-confidence visual/accessibility defects across the primary stats routes, and any remaining subjective polish ideas are documented separately rather than bundled into cleanup.
