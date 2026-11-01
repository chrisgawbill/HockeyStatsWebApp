# AERO-05 — More shared primitives for app chrome, overlays and motion (aero-md3-core 0.4.0)

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE (started 2026-11-01; library work in aero-md3-core)

**Goal:** HockeyStatsWebApp, Spotter and future apps can build entrance
motion, menus, toasts, badges, the app bar, page rhythm and common small
patterns from `@chrisgawbill/aero-md3-core` classes and tokens instead of each
app writing its own copy. Every primitive must be reusable without app
knowledge and customizable through documented `--ds-*` tokens.

**Dependencies:** Owning repository is
[aero-md3-core](https://github.com/chrisgawbill/aero-md3-core). Like
[AERO-03](AERO-03.md), copy or adapt this ticket to that repository's workflow
before implementation; starting it here does not authorize library edits.
Starts after 0.3.0 is published and [AERO-04](AERO-04.md) is accepted, so the
duplicates below are measured against the post-AERO-04 apps. Release 0.4.0 to
npm before any consumer adoption ticket starts.

**Read:** aero-md3-core `README.md` (public contract, compatibility policy,
"Intentionally app-specific") and `src/core.css`;
`fixtures/primitives-0.3.html`. The consumer sources named under each item
below show the duplicated pattern.

**Product Owner checkpoint:**

- Class and token names: approve the proposed names below or rename before
  work starts.
- Item 7 (`.ds-base`) styles bare elements (`body`, `h1`–`h3`, `code`) under
  an opt-in root class. Confirm that is acceptable for an opt-in layer, or
  limit it to tokens only.
- Item 5: ship `.ds-app-bar` only, or also a `.ds-bottom-nav` (MD3 bottom
  navigation, used by HockeyStats only today) in 0.4.0.
- Optional JavaScript: HockeyStats repeats Escape-to-close (7 files),
  click-outside (4) and scroll locking (2). The README says the package is
  CSS-only. Decide whether a dependency-free optional `behaviors.js` export is
  ever in scope; it is excluded from this ticket either way.

**Decisions (Product Owner, 2026-11-01):**

- [AERO-04](AERO-04.md) accepted, so this ticket may start.
- Class and token names approved as proposed.
- Item 7: `.ds-base` ships element rules (`body`, `h1`–`h3`, `code`/`pre`,
  `::selection`) under the opt-in root class.
- Item 5: ship `.ds-app-bar` and also an MD3 `.ds-bottom-nav` in 0.4.0.
- Optional `behaviors.js`: not decided; excluded from this ticket either way.

**Scope:** additive, opt-in CSS in `src/core.css`, documented in the README's
public contract (so `pnpm check` still matches every `.ds-*` class and
`--ds-*` token), with a 0.4.0 release note. Each primitive uses existing
tokens where possible, exposes the listed custom properties for per-app or
per-element overrides, supports `data-theme="dark"`, and disables motion
under `prefers-reduced-motion`. No existing token value or class meaning
changes.

1. **Entrance motion.** `.ds-enter` (fade and short rise), with
   `.ds-enter-fade`, `.ds-enter-scale`, `.ds-enter-start` and `.ds-enter-end`
   (horizontal) variants. Tokens: `--ds-enter-distance`,
   `--ds-enter-duration`, `--ds-enter-delay`, and a consumer-set
   `--ds-stagger-index` multiplied by `--ds-stagger-step` for staggered
   lists. Reduced motion shows the final state with no animation. Replaces
   about 14 near-identical keyframes, including `landing-intro-enter`,
   `landing-content-reveal` (`LandingPage`), `team-form-enter`,
   `enterFromLeft`/`enterFromRight` (`TeamPage`), `game-hero-enter`,
   `game-story-event-reveal` (`GameDetailPage`), `dna-panel-enter`,
   `dna-description-reveal` (`TeamDna`), `matchup-content-enter`,
   `game-over-enter`, `modal-overlay-enter`, `group-fade-in` and
   `mobile-search-fade-in`, and their reduced-motion blocks.
2. **Menu surface.** `.ds-menu`, `.ds-menu-item`, `.ds-menu-label` and
   `.ds-menu-divider`: elevated surface (solid by default, glass when combined
   with `.ds-aero-glass`), full-width items with the shared hover/focus state
   layer and visible focus, and a muted label row. Tokens: `--ds-menu-min-width`,
   `--ds-menu-max-height` (scrolls past it). Styling reads `aria-current`,
   `aria-checked` and `:disabled`/`aria-disabled`. Replaces the
   `GoogleAvatarBadge` dropdown, `FavoriteCategoryMenu` surface, the
   `PageHeader` search dropdown and option rows, and the `NotificationBell`
   panel surface. Positioning, open/close, roles and arrow-key behavior stay
   in the app.
3. **Toast.** `.ds-toast` with optional tones (`.ds-toast-success`,
   `-warning`, `-danger`, reusing callout colors): fixed, centered,
   width-capped, safe-area aware, elevated, enter motion from item 1.
   Tokens: `--ds-toast-inset-top` or `--ds-toast-inset-bottom` (bottom by
   default), `--ds-toast-max-width`. Replaces the near-identical `.toast` in
   `ShareButton` and `FavoriteStar`. Live-region role, timing and dismissal
   stay in the app.
4. **Count badge.** `.ds-badge` (pill with a minimum size, tabular digits)
   and `.ds-badge-dot` (no text); optional `.ds-badge-anchor` wrapper to place
   it on a corner of an icon button. Tokens: `--ds-badge-color`,
   `--ds-badge-on-color`, `--ds-badge-offset`. Replaces `NotificationBell`
   `.badge`. The badge must have accessible text in the app (count in the
   button's label); the dot must not be the only signal.
5. **App bar.** `.ds-app-bar`: sticky at `--ds-layer-sticky`, top safe-area
   padding, bottom hairline, and an inner row that matches `.ds-container`
   width and gutter. Works alone (opaque) or with `.ds-aero-glass` (tinted
   via the existing `--ds-aero-glass-tint`). Token: `--ds-app-bar-min-height`.
   Replaces the shared parts of HockeyStats `PageHeader` `.nav-bar`/`.nav-inner`
   and Spotter `.app-bar`. Brand, navigation contents and the mobile layout
   stay in the apps unless the Product Owner adds `.ds-bottom-nav`.
6. **Info tone and semantic tokens.** `--ds-color-info`/`--ds-color-on-info`
   with `.ds-chip-info` and `.ds-callout-info`; `--ds-color-subtle-fill`
   (quiet fill for chips, tracks and segmented backgrounds);
   `--ds-color-selection` and `--ds-color-on-selection` applied through
   `::selection` under the item 7 layer. Light and dark defaults included.
   Replaces app-defined `--color-blue-accent`, `--color-info-bg`,
   `--color-chip-bg`, `--color-subtle-divider` and `--color-selection*` (and
   their dark copies) in `styles/index.css`; HockeyStats `--color-overlay`
   maps to the existing `--ds-color-scrim`.
7. **Opt-in base layer.** `.ds-base` on the root element sets `body`
   background and text color from surface tokens, `--ds-font-family`, font
   smoothing, horizontal safe-area padding, smooth scrolling (off under
   reduced motion), an `h1`–`h3` scale from type tokens, and `code`/`pre`
   using `--ds-font-family-mono`. Tokens: `--ds-font-weight-heading`,
   `--ds-letter-spacing-display`, `--ds-letter-spacing-headline`. Replaces
   the matching element rules in HockeyStats `styles/index.css`.
8. **Page rhythm.** `--ds-section-gap`, `--ds-page-block-start`,
   `--ds-page-block-end`, with smaller defaults below 576px; `.ds-section`
   (bottom margin from `--ds-section-gap`) and `.ds-section-title` (title
   size, semibold). Replaces HockeyStats `--page-section-gap`,
   `--page-block-*` and `styles/shared.module.css` `.section`/`.sectionTitle`.
9. **Key–value list.** `.ds-meta` (a `<dl>` or `<div>` of rows) with
   `.ds-meta-label` (overline styling) and `.ds-meta-value`; stacks label
   above value with `.ds-meta-stacked`. Token: `--ds-meta-label-width`.
   Replaces Spotter `.run-meta`/`.meta-label` and HockeyStats
   `.stat`/`.statLabel`/`.statValue` pairs where they are label–value rows.
10. **Small helpers.** `.ds-overline-primary` (primary-colored, bold kicker;
    the AERO-04 follow-up in `LandingPage`, `MatchupPage` `.kicker` and the
    `GameDetailPage` eyebrow); `.ds-muted` (on-surface-variant text);
    `.ds-line-clamp` with `--ds-line-clamp` (default 2; Spotter
    `.activity-text`); `.ds-code-block` (mono, wrapping, scrollable, surface
    and outline, `--ds-code-block-max-height`; Spotter `.scroll-region` and
    `.suggestions pre`).
11. **Activity pulse.** `.ds-pulse`: a slow opacity pulse meaning "in
    progress", stopped under reduced motion. Token: `--ds-pulse-duration`.
    Replaces HockeyStats `pulse-live` (`GameDetailPage`) and Spotter
    `.mark-running` `pulse`. The meaning must also be stated in text.
12. **Layering and guidance.** Add `--ds-layer-toast` (above modal) and
    `--ds-layer-raised` (local stacking inside a component). README guidance:
    map fixed `z-index` values to `--ds-layer-*`; set
    `--ds-focus-outline-color` once on the app root instead of per-component
    focus rules; document two or three recommended breakpoints (CSS custom
    properties cannot be used in `@media`).

**Exclusions:** no React components, runtime JavaScript, or runtime
dependencies. No hockey/Spotter names or meanings (the `check` script's domain
guard must stay green). Status meanings, brand seeds, team colors,
rink/board-game colors, `PageHeader` mobile layout and search overlay,
Spotter's run checklist, and placement/open/close logic for menus and toasts
stay in the apps. No toggle switch primitive: the StatLeaders "switch" is a
segmented control already covered by `.ds-segmented`. No skeleton loaders
(neither app uses them). Consumer adoption is a separate ticket.

**Acceptance:**

- Every new class and token is documented in the README with a short example
  where markup structure matters (menu, toast, badge anchor, app bar, meta
  list, enter stagger).
- Each primitive has at least one documented custom property, and the fixture
  shows it overridden on one element without affecting others.
- A new `fixtures/primitives-0.4.html` shows each primitive in light and dark,
  including menu hover/focus/current/disabled, toast tones, badge with a
  two-digit count and dot, glass and opaque app bars, staggered entrance,
  and the base layer, at desktop and phone widths.
- Under reduced motion, entrance, toast and pulse show their final state with
  no animation and no layout change.
- Badge, toast tone, info callout and pulse meanings are understandable
  without color; focus stays visible on every interactive primitive.
- Existing 0.1–0.3 fixture pages are pixel-identical before and after.
- `@chrisgawbill/aero-md3-core@0.4.0` is published.

**Verify:** `pnpm check` in aero-md3-core. Open all fixture pages in a browser
at 1280 and 375px widths, light and dark, with keyboard navigation and with
reduced motion enabled; save screenshots. Install the packed 0.4.0 tarball in
HockeyStatsWebApp and Spotter without code changes and confirm both still
build, test and render unchanged.

**Evidence:** library work implemented on aero-md3-core branch
`ccr-151cb49c-meihlk`; the checks are recorded in that repository's
`docs/tickets/AERO-05.md`. In summary: `pnpm check` PASS. The 0.4 fixture at
1280 and 375px, light and dark, keyboard and reduced motion: PASS. The 0.1–0.3
fixtures are pixel-identical. The packed 0.4.0 in HockeyStatsWebApp passes
tsc, test and build and renders pixel-identical. Spotter: same results as
before. NOT RUN: npm publish, Firefox/Safari. The Spotter browser integration
test fails the same way on 0.2.0 in this container.

**Release follow-ups:** consumer adoption (a follow-up to AERO-04 that
replaces the sources listed above) needs its own ticket once 0.4.0 is
published.
