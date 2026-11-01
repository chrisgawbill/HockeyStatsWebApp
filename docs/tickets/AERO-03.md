# AERO-03 — Shared primitives for duplicated app styles (aero-md3-core 0.3.0)

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE

**Goal:** HockeyStatsWebApp and Spotter can build buttons, page states,
section headers, tables, callouts, tabs and small form/utility patterns from
`@chrisgawbill/aero-md3-core` classes instead of each app writing its own copy.

**Dependencies:** Owning repository is
[aero-md3-core](https://github.com/chrisgawbill/aero-md3-core). Like `API-*`
tickets, copy or adapt this ticket to that repository's workflow before
implementation; starting it here does not authorize library edits. Release
0.3.0 to npm before [AERO-04](AERO-04.md) starts.

**Read:** aero-md3-core `README.md` (public contract, compatibility policy,
"Intentionally app-specific") and `src/core.css`; `fixtures/primitives-0.2.html`.
The consumer sources named under each item below show the duplicated pattern.

**Product Owner checkpoint:**

- Class names: approve the proposed names below or rename before work starts.
- Default `.ds-button` hover and `:disabled` styling (item 1) changes how
  existing buttons look in both apps. The compatibility policy needs an explicit
  decision: either approve it as a 0.3.0 change, or ship it as opt-in only.
- Whether items 7–9 ship in 0.3.0 or wait for a later release. Each is used by
  one app today.

**Decisions (Product Owner, 2026-11-01):**

- Class names approved as proposed.
- Item 1 `.ds-button` hover/pressed/disabled styling ships as an approved
  default change in 0.3.0.
- Items 7–9 ship in 0.3.0.

Library-side implementation choices (including the `.ds-input-glass` name for
the item 7 input) are recorded in aero-md3-core `docs/tickets/AERO-03.md`.

**Scope:** additive, opt-in CSS in `src/core.css`, documented in the README's
public contract (so `pnpm check` still matches every `.ds-*` class and
`--ds-*` token), with a 0.3.0 release note. Each primitive uses existing
tokens, supports `data-theme="dark"`, and disables motion under
`prefers-reduced-motion`.

1. **Button variants and states.** `.ds-button-tonal`, `.ds-button-outlined`,
   `.ds-button-text`, `.ds-button-danger`; `.ds-button:hover` state layer
   (`--ds-state-hover-opacity`), `.ds-button:disabled`, and
   `.ds-button[aria-pressed]` toggle styling (pressed state must not rely on
   color alone). Replaces Spotter `.button-secondary`, `.button-danger`,
   `.format-button` and HockeyStats `ErrorState` `.error-state__retry`.
2. **Loading, empty and error states.** `.ds-state`, `.ds-state-full`,
   `.ds-state-title`, `.ds-state-message`, `.ds-spinner`, with one shared
   enter animation. Replaces the near-identical HockeyStats `LoadingState`,
   `EmptyState` and `ErrorState` CSS and Spotter `.empty-state`. React
   components stay in the app.
3. **Section header.** `.ds-section-header`: title first, actions pushed to
   the end, wrapping on narrow screens. Replaces Spotter `.section-head` and
   HockeyStats `SectionHeading` `.row`.
4. **Overline label.** `.ds-overline`: label size, semibold, uppercase,
   letter-spacing. Replaces HockeyStats `PageIntro .kicker`, leaderboard
   titles and similar, and Spotter `.meta-label`.
5. **Table extensions.** `.ds-table-compact` (fixed row height, small
   uppercase headers, no last-row border, as HockeyStats now forces globally
   in `styles/shared.module.css`) and `.ds-table-stack` (below a breakpoint,
   each row becomes a stacked card; header visually hidden but still read by
   assistive technology; cell labels from a `data-label` attribute). Replaces
   Spotter `.runs-table`/`.storage-table` mobile blocks. Existing `.ds-table`
   defaults are unchanged.
6. **Callout.** `.ds-callout` with `.ds-callout-primary`, `-success`,
   `-warning`, `-danger`: tinted background and inline-start accent border.
   Replaces Spotter `#run-error`, `#error`, `.record-help` and
   `.install-banner` accents.
7. **On-glass controls.** `.ds-icon-button` (circular glass button for
   `.ds-aero-glass` chrome) and a matching on-glass input style. Replaces the
   copied styles in HockeyStats `ShareButton`, `NotificationBell`,
   `GoogleAvatarBadge` and the `PageHeader` search input.
8. **Tabs and nav links.** `.ds-tab` (underline tab driven by
   `[aria-selected='true']`) and `.ds-nav-link` (pill driven by
   `[aria-current='page']`). The consumer owns roles, selection state and
   keyboard behavior.
9. **Form and utility gaps.** `--ds-font-family-mono`; `.ds-num` (right
   aligned, tabular digits); `.ds-check` (checkbox/radio row with a usable hit
   area); full-width controls inside `.ds-field`; larger minimum target size
   for `.ds-button`, `.ds-input` and `.ds-nav-link` under `pointer: coarse`.
10. **Tidy-up.** Remove the duplicate `.ds-focusable:focus-visible` rule in
    `core.css` (no visible change).

**Exclusions:** no React components, JavaScript, or runtime dependencies.
No hockey/Spotter names or meanings (the `check` script's domain guard must
stay green). Status meanings, brand seeds, team colors, rink/board-game
colors, `PageHeader` layout and Spotter's run checklist stay in the apps. No
changes to existing token values or class meanings except any change the
Product Owner approves for item 1.

**Acceptance:**

- Every new class and token is documented in the README with a short example
  where markup structure matters (states, table stack, tabs, callout).
- A new `fixtures/primitives-0.3.html` shows each primitive in light and
  dark, including disabled, pressed, focus, hover and loading/empty/error
  states, and stacked tables at a phone width.
- Pressed, selected, current and danger states remain understandable
  without color; focus stays visible on every interactive primitive.
- Existing 0.2 fixture pages look the same apart from approved item 1 changes.
- `@chrisgawbill/aero-md3-core@0.3.0` is published.

**Verify:** `pnpm check` in aero-md3-core. Open both fixture pages in a
browser at desktop and 375px widths, light and dark, with keyboard
navigation, and with reduced motion enabled; save screenshots. Install the
packed 0.3.0 tarball in HockeyStatsWebApp and Spotter without code changes and
confirm both still build and render.

**Evidence:** aero-md3-core branch `ccr-151cb49c-meihlk`; details and
screenshots in aero-md3-core `docs/tickets/AERO-03.md` and
`docs/evidence/AERO-03/`.

- `pnpm check`: PASS.
- Fixture pages at 1280 and 375px, light and dark, keyboard, reduced motion:
  PASS (Chromium). 0.1/0.2 fixtures are pixel-identical before and after.
- Packed 0.3.0 in HockeyStatsWebApp without code changes: `pnpm tsc`,
  `pnpm test`, `pnpm build` PASS; renders pixel-identical to 0.2.0.
- Packed 0.3.0 in Spotter without code changes: renders unchanged; `npm test`
  188 pass / 7 fail, the same 7 tests that fail on 0.2.0 in this environment.
- Firefox/Safari: NOT RUN.
- `@chrisgawbill/aero-md3-core@0.3.0` published: NOT RUN (publishes from
  aero-md3-core `main` after merge).

**Release follow-ups:** consumer adoption is [AERO-04](AERO-04.md).
