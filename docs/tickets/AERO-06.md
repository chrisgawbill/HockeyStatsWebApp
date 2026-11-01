# AERO-06 — Apps use aero-md3-core 0.4.0 primitives for chrome, overlays and motion

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE (HockeyStatsWebApp part started 2026-11-01; Spotter part
not started)

**Goal:** HockeyStatsWebApp and the Spotter dashboard look and behave as they
do today, but get entrance motion, menus, toasts, badges, app chrome, page
rhythm, base element styles and small helpers from
`@chrisgawbill/aero-md3-core` 0.4.0. The local copies listed in
[AERO-05](AERO-05.md) are deleted.

**Dependencies:** [AERO-05](AERO-05.md) released as
`@chrisgawbill/aero-md3-core@0.4.0`. This ticket covers two repositories. The
HockeyStatsWebApp part runs under this workflow. The Spotter part must be
copied into Spotter's `docs/ticket-index.md` and started there, after or
together with the still-open Spotter part of [AERO-04](AERO-04.md) (Spotter is
still on `^0.2.0`). Starting this ticket here does not authorize Spotter
edits. The Spotter part must not conflict with its QA-06 dashboard cleanup.

**Read:** AERO-05 (the consumer sources under each item) and the 0.4.0 README
sections for the primitives being adopted; [code conventions](../code-conventions.md);
the source files named below. Spotter: its `CLAUDE.md`, `AGENTS.md`,
`docs/dashboard.md`.

**Product Owner checkpoint:**

- Review before/after screenshots of changed pages in both apps. No visible
  change is expected except where approved below.
- `.ds-base` heading weight: the shared default is 500. HockeyStats h1 is 400
  today. Recommendation: keep 400 with a local h1 override (no visible change).
- Mobile bottom navigation: the shared `.ds-bottom-nav` shows the current
  destination as a primary-container pill. HockeyStats uses a white glass pill
  on its team-tinted bar. Recommendation: adopt the shared structure and keep
  the white pill and team tint as local overrides (no visible change).
- Kickers: `.ds-overline-primary` uses `--ds-font-size-label` (0.75rem), bold,
  0.08em tracking. `MatchupPage .kicker` already matches. Approve the small
  size/tracking differences elsewhere, or keep those kickers local.
- Entrance timing: the shared motion uses a 360ms decelerate curve and a
  0.75rem rise. Local animations differ slightly in duration and distance.
  Approve the shared defaults, or set per-page `--ds-enter-*` overrides where
  the current feel matters (for example the landing intro).

**Decisions (Product Owner, 2026-11-01):**

- `.ds-base` heading weight: keep the HockeyStats h1 at 400 with a local
  override (no visible change).
- Mobile bottom navigation: adopt the shared `.ds-bottom-nav` including its
  primary-container current-page pill, replacing the white glass pill. The
  team-tinted bar stays local.
- Kickers: the small size/tracking differences are approved; all listed
  kickers use `.ds-overline-primary`.
- Entrance timing: the shared `.ds-enter` defaults are approved everywhere,
  with no per-page `--ds-enter-*` overrides.

**Scope:** bump `@chrisgawbill/aero-md3-core` to `^0.4.0` in each app, then
replace the local copies below. Delete each local rule a shared class or token
replaces; keep only real app-specific overrides.

HockeyStatsWebApp (`react/src`):

1. **Entrance motion:** `.ds-enter` and its variants, with
   `--ds-stagger-index`, replace the near-identical local keyframes and their
   reduced-motion blocks: `landing-intro-enter`, `landing-content-reveal`
   (`LandingPage`); `team-form-enter`, `enterFromLeft`/`enterFromRight`
   (`TeamPage`); `game-hero-enter`, `game-story-event-reveal`
   (`GameDetailPage`); `dna-panel-enter`, `dna-description-reveal`
   (`TeamDna`); `matchup-content-enter`; `game-over-enter`;
   `modal-overlay-enter`; `group-fade-in`; `mobile-search-fade-in`. Keyframes
   that are not simple entrances (spinners, dice, puck, minigames, lottery
   draws) stay local.
2. **Menus:** `GoogleAvatarBadge` dropdown, `FavoriteCategoryMenu` surface,
   `PageHeader` search dropdown and option rows, and the `NotificationBell`
   panel surface use `.ds-menu`/`.ds-menu-item`/`.ds-menu-label`/
   `.ds-menu-divider`. Positioning, open/close, roles and keyboard handling
   stay as they are.
3. **Toasts:** `ShareButton` and `FavoriteStar` `.toast` use `.ds-toast`.
   ShareButton's top placement uses `--ds-toast-inset-top` with the measured
   `--mobile-top-chrome-height`. The fixed `z-index: 1000` maps to
   `--ds-layer-toast`.
4. **Badge:** `NotificationBell .badge` uses `.ds-badge` in
   `.ds-badge-anchor`. The unread count stays in the button's accessible name.
5. **Chrome:** `PageHeader .nav-bar`/`.nav-inner` use `.ds-app-bar` with
   `.ds-aero-glass` and its `.ds-container` row. `.mobile-nav-bar` and its
   items use `.ds-bottom-nav*`. Team tint, the sheen, brand, search,
   breakpoints and the measured chrome heights stay local.
6. **Semantic tokens:** replace `--color-blue-accent`, `--color-info-bg`,
   `--color-chip-bg`, `--color-subtle-divider` and `--color-selection*`
   (light and dark) with `--ds-color-info`, `.ds-callout-info`/
   `.ds-chip-info`, `--ds-color-subtle-fill` and `--ds-color-selection*`.
   Map `--color-overlay` to `--ds-color-scrim`. Callers are updated in the
   same change (56 references outside `styles/index.css` today).
7. **Base layer:** add `.ds-base` to `<html>` and delete the matching
   `html`/`body`/`h1`–`h3`/`code` rules in `styles/index.css`. Keep
   `overflow-x: clip`, the theme color transition and any approved heading
   overrides.
8. **Page rhythm:** `--page-section-gap` and `--page-block-*` (including their
   576px values) become `--ds-section-gap` and `--ds-page-block-*`.
   `styles/shared.module.css` `.section`/`.sectionTitle` use `.ds-section`/
   `.ds-section-title`.
9. **Key–value rows:** `.stat`/`.statLabel`/`.statValue` pairs that are true
   label–value rows use `.ds-meta`. Stat tiles and grids stay local.
10. **Helpers:** `LandingPage` and `GameDetailPage` eyebrows and
    `MatchupPage .kicker` use `.ds-overline-primary` (per the decision above).
    On-surface-variant text rules that only set color use `.ds-muted`.
11. **Pulse:** `GameDetailPage` `pulse-live` uses `.ds-pulse`. The live state
    stays stated in text.
12. **Layers and focus:** map the remaining fixed `z-index` values (29 today)
    to `--ds-layer-*` where they are app-level stacking. Local component
    stacking uses `--ds-layer-raised`. Remove per-component focus rules
    that only restate `--ds-focus-outline-color`.

Spotter (`src/dashboard/`), after its AERO-04 part:

- `.app-bar` uses `.ds-app-bar`; `.run-meta`/`.meta-label` use `.ds-meta`;
  `.muted` uses `.ds-muted`; `.activity-text` uses `.ds-line-clamp`;
  `.scroll-region` and `.suggestions pre` use `.ds-code-block`;
  `.mark-running` `pulse` uses `.ds-pulse`; page headings use `.ds-base`
  only if they render unchanged.

**Exclusions:** no redesigns, new features or framework changes. No
`behaviors.js` or other shared JavaScript (Escape, click-outside and scroll
lock stay in the apps). Keep app-specific styling: team colors, rink/board-game
art, `PageHeader` mobile layout and search overlay, Spotter's run checklist,
and status meanings. Spotter keeps every QA-06 invariant (functional element
IDs or their JS/test callers updated together, Tailscale-only binding,
same-origin run controls, sandboxed reports, live status updates,
stale-edit/unsaved-change protection). List further duplicates found for a
follow-up instead of expanding this ticket.

**Acceptance:**

- Both apps depend on `^0.4.0`. Every replaced local rule, keyframe and token
  is deleted, not left beside the shared one.
- Changed pages match their before screenshots at 1280 and 375px, light and
  dark, except for differences approved at the checkpoint.
- Under reduced motion, entrances, toasts and the live pulse show their final
  state with no animation and no layout shift.
- Menus, toasts, badge, bottom navigation and app bar keep their current
  keyboard behavior, roles, live regions and visible focus. Current page,
  unread count and live state remain clear without color.
- Mobile fixed chrome still reserves its measured height. No content is hidden
  under the bottom navigation or the safe areas.

**Verify:** HockeyStatsWebApp: standard frontend checks and a Spotter run on
the pushed branch. It should cover the home page, team page, game detail
(live and final), matchup, header search, the account menu, notifications,
share and favorite toasts, and phone bottom navigation. Spotter: `npm test`
and the dashboard browser integration command in `docs/dashboard.md`. Save
before/after screenshots for both apps (1280 and 375px, light and dark, plus
reduced motion) of the pages touched.

**Evidence** (branch `ccr-151cb49c-meihlk`; HockeyStatsWebApp part
implemented except item 7):

- Dependency: `^0.4.0` (installs 0.4.0).
- Adopted: items 1–6 and 8–12 as scoped. All 13 listed entrance keyframes plus
  `standings-content-enter`, `standings-loading-enter`, `playoff-panel-enter`
  and `install-enter` now use `.ds-enter*`. Menus, toasts, badge, app bar,
  bottom navigation, semantic tokens, page rhythm (`shared.module.css`
  `.section`/`.sectionTitle` deleted, callers use `.ds-section*`), kickers,
  `.ds-pulse`, and layer tokens are also shared. No `.stat` row was a true
  label–value row, so item 9 changed nothing. CSS/TSX: 464 lines deleted,
  189 added.
- **Item 7 (`.ds-base`) is not adopted: library defect.** `.ds-base h1`–`h3`
  and `.ds-base body` have specificity (0,1,1), which beats single-class
  component rules. The old global `h2 {}` rules did not. Adopting it enlarged
  section titles that set their own size (home "Up next"/"Stat leaders"), moved
  the Rink Quest headings, and overrode the app body background. A test with
  the selectors wrapped in `:where(.ds-base)` (response rewritten in the
  browser, nothing on disk) removed those differences. The local element rules
  stay until an aero-md3-core patch ships.
- Kept local, with reasons: nav and bottom-nav hairline `rgba(255,255,255,.25)`;
  app-bar row sizing (padding instead of the 3.5rem minimum, keeping 56px);
  landing kicker 4px bottom margin; z-index literals where a token would
  change stacking order (team nav 50, install banner 95, mobile search FAB 90,
  avatar menu 110, bell panel 120, season listbox 150, team-button popover 20,
  player picker 5, and in-component 0–3 layers); focus outlines in info blue or
  team colors (they are not the default focus color).
- Visible differences (screenshots, reduced motion): bottom-nav current page
  is the shared primary-container pill (approved). The desktop 1280 shots of
  home, Rink Quest, My Hockey, compare and standings are pixel-identical, light
  and dark. Expected but not captured (need data or sign-in): menus use
  surface-container with elevation 2 and 2.5rem rows; search dropdown
  max-height is `min(30rem, 70vh)`; toasts gain a border and body-small text;
  entrances use 360ms/0.75rem with a 50ms stagger (approved); game-detail
  eyebrow and matchup kicker lose a 4px margin (approved kicker change);
  game-over dialog scales without rising; two info tints
  (`TeamList` metrics, faceoff `.open`) use an 8% info mix.
- `pnpm tsc`, `pnpm test` (72 files, 337 tests), `pnpm format:check`,
  `pnpm build`: PASS.
- Screenshots: `/home/user/evidence/aero-06/*-{before,after}.png` (home, board
  game, My Hockey, compare, standings; 1280 and 375; light and dark; reduced
  motion; before = `6441c662`) and `bottom-nav-375-before-after.png`.
- NOT RUN: Spotter run (data pages, menus, toasts, badge, keyboard, live game
  pulse, non-reduced motion); Spotter dashboard part (not started here).

**Release follow-ups:**

- aero-md3-core patch (0.4.1): wrap the `.ds-base` element selectors in
  `:where(.ds-base)` so component classes win. Then adopt item 7 here (owner:
  aero-md3-core; needs Product Owner approval).
- Duplicates for a follow-up: repeated uppercase label rules in
  `GameDetailPage.module.css` (`.game-story-stats__label`,
  `.three-star-card__label` and others); the hard-coded 280px `.nav-search-col`.
