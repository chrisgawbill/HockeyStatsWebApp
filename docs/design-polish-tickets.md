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

## UI-01 — Fix global navigation width, spacing, and mobile crowding

**Goal:** Make the global Aero navigation feel intentional, full-width, and comfortable instead of inset/cramped.

**Read:** `react/src/components/PageHeader.tsx`, `react/src/components/PageHeader.module.css`, `react/src/app/index.tsx`, Aero layout/control primitives in `aero-md3-core`.

**Problem:** The header currently derives its width from Bootstrap gutter variables and uses negative margins to simulate full bleed. That makes the nav visually dependent on the surrounding container and can leave it feeling narrower than the viewport. Mobile also packs back navigation, five main destinations, season control, search access, and utility actions into a very small area.

**Change:**
- Make the nav chrome span the actual viewport width independently of the page content container.
- Remove Bootstrap-gutter coupling from header sizing.
- Keep page content constrained separately so full-width chrome does not force full-width content.
- Rework desktop spacing so brand, search, season selector, nav destinations, and utilities have clear breathing room.
- On mobile, reduce simultaneous competition between controls. Keep primary navigation obvious and move secondary controls into a compact secondary row, overlay, menu, or other simple pattern if needed.
- Preserve the fixed bottom-nav behavior if it still produces the clearest mobile navigation, but it must not feel packed edge-to-edge.
- Keep safe-area support, keyboard focus, active-state clarity, and >=44px touch targets.
- If the width/spacing solution is generally reusable, add the needed shell/chrome primitive to `aero-md3-core` instead of baking another one-off recipe into HockeyStats.

**Do not:** Add a new navigation dependency, redesign route structure, hide primary destinations behind a menu on desktop, or shrink touch targets to make items fit.

**Done when:**
- Desktop nav visually reaches the viewport edges while page content remains centered/constrained.
- No horizontal overflow at common desktop widths.
- Mobile nav has visibly more breathing room and does not clip/wrap at 320px, 375px, 390px, and 430px widths.
- Season selector/search/utility controls remain reachable without crowding the primary nav.
- Keyboard focus and active-route states are clearly visible in light/dark themes.
- Browser screenshots are captured for desktop and the four mobile widths above.

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
