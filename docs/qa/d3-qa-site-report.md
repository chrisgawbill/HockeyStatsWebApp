# D3-QA-SITE — Main-site premium polish and accessibility audit

Date: 2026-09-16  
QA result: **GAPS FOUND**

## Routes and coverage

The current route table and navigation expose these main-site routes; RinkQuest is excluded as instructed:

`/`, `/standings`, `/schedule`, `/teamList`, `/team/:teamId`, `/game/:gameId`, `/matchup`, `/diagnostics`

All eight routes were rendered at 1440×1000 and 390×844. Representative dynamic routes used `BOS` and game `2024020001`; matchup used `BOS` vs `TOR`. The local API was not running, so data-backed routes were verified in their rendered error state; matchup was verified in its loaded empty-state state and diagnostics in its locked state.

## P0/P1 findings

1. **Global navigation uses nested interactive elements** — desktop and mobile — the rendered DOM contains `<a><button ...></button></a>` for every primary nav item. This creates two interactive semantics for one destination, can produce duplicate or confusing keyboard/screen-reader stops, and is invalid interactive-content nesting. Smallest fix: make each destination a styled `Link`/anchor, or make the button perform navigation, but keep one focusable control per item. Affected route: every route with `PageHeader`.

2. **Primary navigation has no navigation landmark, and failure states lose page-heading semantics** — desktop and mobile — `PageHeader` renders the primary bar as a `div`, not `nav`; `ErrorState` renders its title as a `span`. On the observed error states for standings, schedule, teams, team detail, and game detail, the route-specific title is therefore not exposed as a heading/landmark context. Smallest fix: wrap the primary controls in `<nav aria-label="Primary">` and render state titles as an appropriate heading (or provide an explicit page heading before the state). Evidence: [home desktop](qa/d3-qa-site/home-desktop.png), [team list mobile](qa/d3-qa-site/team-list-mobile.png).

3. **Fixed mobile navigation obscures matchup content** — mobile loaded empty state — at 390×844, the fixed bottom bar covers the beginning of the “No Meetings Played” empty-state content on the matchup route; the heading/body is visibly clipped behind the bar in the captured viewport. Smallest fix: add route/content bottom padding that accounts for the fixed mobile bar and safe-area inset, or reserve the bar height in the page layout. Evidence: [matchup reduced-motion mobile](qa/d3-qa-site/matchup-reduced-mobile.png).

## P2 optional

- The desktop chrome stretches five nav pills across nearly the full viewport and provides no product/brand anchor; a bounded refinement would cap the nav content width and add restrained brand hierarchy while preserving Aero.
- Error and empty states are vertically centered in a large remaining viewport, which is calm but leaves a substantial low-information gap on mobile when the API is unavailable; consider a tighter state layout after the semantic/fixed-nav issues are addressed.

## Accessibility and preferences

- Search, season selector, nav items, back button, mobile search FAB, diagnostics passphrase, and retry controls expose accessible names in the rendered DOM.
- Loading and error primitives use `role="status"`/`aria-live="polite"` and `role="alert"`; mobile search uses a modal dialog with `aria-modal="true"` and restores focus to its trigger on close by implementation inspection.
- Visible focus styling is present on search, nav, retry, and breadcrumb controls; the diagnostics passphrase is visibly focused in the locked-state capture.
- Reduced-motion capture preserved the matchup state while disabling the page-entry animation; shared loading/empty/error and navigation transitions have explicit reduced-motion rules.
- Dark theme was rendered coherently at the current local time. A light-theme toggle/control was not exposed in the inspected main-site UI, and the browser CLI’s light-mode override did not change the app’s time/system-derived theme; light-mode contrast therefore remains a coverage limitation rather than a PASS claim.
- Full manual keyboard traversal and text-zoom testing were not possible with the available headless-only browser invocation; the nested controls and missing landmark/heading semantics are concrete blockers to calling accessibility fully clear.

## Smoothness

Loading and error transitions settle without observed layout shift on the captured routes. The main observable smoothness issue is the mobile fixed-nav overlap described in P1-3; no measurable performance regression was found in this audit.

## Follow-up ticket clusters (maximum 3)

1. **Navigation semantics and keyboard flow:** one-control-per-destination, primary landmark, focus traversal, mobile search dialog verification.
2. **State semantics and responsive safe areas:** heading/landmark structure for loading/error/empty states plus fixed-nav clearance on detail pages.
3. **Theme and final visual calibration:** explicit light/dark preference control/coverage, desktop chrome hierarchy, and text-zoom/manual keyboard pass.

## Resolution

The reported P0/P1 issues and the P2 refinements were implemented in the main site:

- Primary navigation now uses one styled link per destination inside a labeled `nav` landmark.
- Error-state titles expose heading semantics appropriate to their page context.
- Matchup content reserves space for the fixed mobile navigation and safe-area inset.
- Desktop navigation has bounded content width and restrained product branding.
- Loading, empty, and error states use a tighter responsive vertical layout.
- Light/dark preference switching is explicit and persisted; mobile search traps focus and handles Escape.

TypeScript, production build, automated tests, and diff checks pass. Manual rendered keyboard and text-zoom verification remains a follow-up because the available headless Chrome invocation crashes before producing a page capture.
