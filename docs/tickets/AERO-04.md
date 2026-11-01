# AERO-04 — Apps use shared aero-md3-core styles instead of local copies

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE (HockeyStatsWebApp part implemented 2026-11-01, in review;
Spotter part not started)

**Goal:** HockeyStatsWebApp and the Spotter dashboard look the same as today
(or better where approved), but get their shared patterns from
`@chrisgawbill/aero-md3-core` 0.3.0, removing duplicated local CSS.

**Dependencies:** [AERO-03](AERO-03.md) released as
`@chrisgawbill/aero-md3-core@0.3.0`. This ticket covers two repositories. The
HockeyStatsWebApp part runs under this workflow. The Spotter part must be
copied into Spotter's `docs/ticket-index.md` and started there. Starting this
ticket here does not authorize Spotter edits, and the Spotter part must not
conflict with its active QA-06 dashboard cleanup.

**Read:** AERO-03 and the 0.3.0 README; [code conventions](../code-conventions.md);
the source files named below. Spotter: its `CLAUDE.md`, `AGENTS.md`,
`docs/dashboard.md`.

**Product Owner checkpoint:** review before/after screenshots of changed pages
in both apps. Visual differences are allowed only where they come from
decisions approved in AERO-03 (for example, default button hover).

**Decisions:** none recorded yet.

**Scope:** first cleanup pass. Bump `@chrisgawbill/aero-md3-core` to
`^0.3.0` in each app, then replace these local copies. Delete the local rules
a shared class replaces; keep only real app-specific overrides.

HockeyStatsWebApp (`react/src`):

- `components/LoadingState`, `EmptyState`, `ErrorState`: use `.ds-state*` and
  `.ds-spinner`; remove the three copies of `@keyframes state-enter`. The retry
  button uses a `.ds-button` variant.
- `components/SectionHeading` uses `.ds-section-header`; `PageIntro .kicker`
  and other uppercase small labels use `.ds-overline` where the look matches.
- `styles/shared.module.css`: replace the global `.ds-table` overrides with
  `.ds-table-compact` on the tables that need it.
- `ShareButton`, `NotificationBell`, `GoogleAvatarBadge`: use
  `.ds-icon-button`; `PageHeader` search input uses the on-glass input style.
- `TeamPage` `.player-stat-tab` and other underline tabs use `.ds-tab`.
- Replace the six local visually-hidden copies (`TeamDna`, `SeasonSelector`,
  `ShareButton`, `DraftLotteryOddsRow`, `CompareTable`, `PlayerPicker`) with
  `.ds-visually-hidden`.
- Use `.ds-num` where a rule only right-aligns tabular numbers.

Spotter (`src/dashboard/`):

- `dashboard.css`: replace `.button-secondary`, `.button-danger`,
  `.format-button`, `.ds-button:disabled`/hover overrides with 0.3.0 button
  variants; `.section-head` with `.ds-section-header`; `.empty-state` with
  `.ds-state`; `#run-error`, `#error`, `.record-help`, `.install-banner`
  accents with `.ds-callout-*`; `.meta-label` with `.ds-overline`;
  `.nav-link` with `.ds-nav-link`; `.check` with `.ds-check`; `.num` with
  `.ds-num`; `ui-monospace` with `--ds-font-family-mono`; the
  `pointer: coarse` target sizes with the shared rule.
- `.runs-table` and `.storage-table` mobile layouts use `.ds-table-stack`
  with `data-label` cells set in `dashboard.js`; remove the inline
  visually-hidden `thead` rules.
- Use `.ds-focus-outline` instead of locally re-declared outline focus rules
  where it gives the same result.

**Exclusions:** no page redesigns, new features or framework changes. Keep
app-specific styling (team colors, rink/board game, `PageHeader` layout,
Spotter checklist). Spotter keeps every QA-06 invariant: functional element
IDs (or their JS/test callers updated together), Tailscale-only binding,
same-origin run controls, sandboxed reports, live status updates, and
stale-edit/unsaved-change protection. Remaining duplicates found during the
pass are listed for a follow-up, not expanded into this ticket.

**Acceptance:**

- Both apps depend on `^0.3.0`; every replaced local rule is deleted, not
  left alongside the shared class.
- Changed pages match their before screenshots at desktop and phone widths,
  light and dark, except for approved AERO-03 differences.
- Keyboard focus is visible on every changed control; tabs, pressed toggles,
  nav current page and status callouts remain clear without color; stacked
  tables are still read with their column labels by screen readers.
- Loading, empty and error states look and behave as before, including retry.

**Verify:** HockeyStatsWebApp: standard frontend checks and a Spotter run on
the pushed branch. Spotter: `npm test` and the dashboard browser integration
command in `docs/dashboard.md`. Save before/after screenshots for both apps
(desktop and 375px, light and dark) of the pages touched.

**Evidence** (branch `ccr-151cb49c-meihlk`; HockeyStatsWebApp part
implemented, awaiting Spotter and Product Owner review):

- Dependency: `@chrisgawbill/aero-md3-core@0.3.0` is on npm and its `core.css`
  matches the aero-md3-core branch.
- Replaced with shared classes: page states (`.ds-state*`, `.ds-spinner`,
  outlined `.ds-button` retry); `SectionHeading` (`.ds-section-header`);
  `PageIntro` kicker (`.ds-overline`, keeps 0.8rem); global table overrides
  (`.ds-table-compact` on the standings and stat-leader tables); share, bell,
  sign-in and avatar buttons (`.ds-icon-button`); header search
  (`.ds-input-glass`); team player-stat and roster tabs (`.ds-tab`); five
  visually-hidden copies (`.ds-visually-hidden`); stat-leader value column
  (`.ds-num`). CSS: 378 lines deleted, 20 added.
- Fix from the 0.3.0 bump: the player-stat tabs carried `.ds-button` with
  `aria-pressed`, which 0.3.0 styles as a toggle (check mark, outlined
  border). They now use `.ds-tab` without `.ds-button`.
- Kept local: team-color tab hover/selected, white icon color, 40px avatar,
  600 state-message weight, app state icons, `SeasonSelector`'s
  below-1200px hidden label (conditional, so not the utility class).
- `pnpm tsc`, `pnpm test` (72 files, 337 tests), `pnpm format:check`,
  `pnpm build`: PASS.
- Screenshots (home page with no API: loading and error states, header;
  1280 and 375, light and dark, before = `2247532`): resting headers match
  pixel for pixel. Differences: retry button is outlined with primary text
  and 2.5rem tall; spinner is 28px instead of 34px (`.ds-spinner` is
  border-box); header icon focus is a 3px white outline instead of the
  browser default ring.
- NOT RUN: Spotter run; screenshots of data pages (team tabs, standings and
  stat-leader tables, compare, draft lottery) because no API or fixtures
  were available.

**Follow-up duplicates (not in this ticket):** primary-colored bold kickers
(`LandingPage`, `MatchupPage`, `GameDetailPage` eyebrow) repeat one rule
that differs from `.ds-overline`; `TeamPage` player-stat value columns
right-align numbers alongside other styling.

**Release follow-ups:** none yet.
