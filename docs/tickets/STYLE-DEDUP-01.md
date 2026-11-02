# STYLE-DEDUP-01 — Remove the duplicate label, header and toast styles AERO-06 left out of scope

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE (inventory done; implementation waits for the Product
Owner checkpoint below)

**Goal:** The duplicate styles listed under [AERO-06](AERO-06.md) "Release
follow-ups" are gone. Pages look the same, except for differences the Product
Owner approves below.

**Dependencies:** AERO-06 and AERO-07 (DONE; app on
`@chrisgawbill/aero-md3-core` `^0.4.1`). No aero-md3-core edits: a shared
primitive that looks warranted is listed as a library follow-up instead.

**Read:** AERO-06 "Release follow-ups" and "Evidence";
[code conventions](../code-conventions.md); aero-md3-core `core.css`
`.ds-overline`, `.ds-meta-label`, `.ds-toast`; the files named below.

**Product Owner checkpoint:**

Values below are computed at the app's 16px root. `--text-xs` is
`--ds-font-size-label` (0.75rem = 12px). `--color-muted-text` and
`--color-text-secondary` are both `--ds-color-on-surface-variant` ("muted").

*Library classes:*

| Class | Size | Weight | Tracking | Color | Other |
| --- | --- | --- | --- | --- | --- |
| `.ds-overline` (0.3.0) | 12px | 600 | 0.06em = 0.72px | muted | `margin: 0` |
| `.ds-meta-label` (0.4.0) | 12px | 600 | 0.04em = 0.48px | muted | fixed 5.5rem width, `flex: none`; only for `.ds-meta` rows |

`.ds-meta-label` has the closest tracking but forces a 5.5rem column, so it
fits none of the rules below (none is a `.ds-meta` row).

1. **Uppercase muted labels.** Every `text-transform: uppercase` rule in
   `react/src` was checked (32 rules in 12 modules). Family members:

   | Rule (module) | Size | Weight | Tracking | Color | Kept locally | Recommendation | Change if approved |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | `.three-star-card__label` (GameDetailPage) | 12px | 600 | 0.5px | muted | — | (a) `.ds-overline`, rule deleted | tracking +0.22px |
   | `.team-stat-row__label` (GameDetailPage) | 12px | 600 | 0.5px | muted | centered, nowrap | (a) | +0.22px |
   | `.player-stat-leaderboard__title` (TeamPage) | 12px | 600 | 0.5px | muted | padding, tint, divider | (a) | +0.22px |
   | `.bench__title` (RosterLines, `h3`) | 12px | 600 | 0.5px | muted | bottom margin | (a) | +0.22px |
   | `.scoring-period__header` (GameDetailPage) | 12px | 700 | 0.75px | muted | padding, tint, divider | (b) shared `.label` | −0.03px |
   | `.player-stats-team-block__subtitle` (GameDetailPage) | 12px | 700 | 0.75px | muted | margins | (b) | −0.03px |
   | `.diagnostics-stat-card__label` (DiagnosticsPage) | 12px | 700 | 0.5px | muted | — | (b), rule deleted | +0.22px |
   | `.cache-summary__label` (DiagnosticsPage) | 12px | 700 | 0.5px | muted | — | (b), rule deleted | +0.22px |
   | `.whenDay` (MyHockey) | 12px | 700 | 0.04em = 0.48px | muted | nowrap | (b) | +0.24px |
   | `.game-story-stats__label` (GameDetailPage) | 14px (inherited) | 700 | 0.04em = 0.56px | muted | — | (c) leave: different size | none |
   | `.season-field__label` (SeasonSelector), `.schedule-filter-field__label` (SchedulePage) | 12px | 600 | 0.02em = 0.24px | muted (season: team-overridable) | no pointer events | (c) leave: floating field labels, +0.48px would show | none |
   | `.team-list-controls label` (TeamList) | 12px | 700 | 0.02em | muted | flex wrapper around the select | (c) leave | none |
   | Table headers: `.period-goals-breakdown-table th`, `.player-box-table th` (GameDetailPage), `.cache-table th` (DiagnosticsPage), `.stat-table th` (TeamPage, 0.4px) | 12px | 700 | 0.4–0.5px | muted | table header layout | (c) leave: table styling, not labels | none |

   Not in the family (different size, color or role; left as they are):
   GameDetailPage `.game-story-event__meta`, `.game-detail-team__abbrev`
   (white on the hero), `.game-detail-state-chip`,
   `.player-stats-team-block__title` (16px team color); MatchupPage
   `.control` and ScheduleCalendar `.calendar__weekday` (14px); FavoriteRow
   `.statLabel` (info blue); chips and badges (TeamPage
   `.schedule-strip__badge`/`__result.live`, SchedulePage
   `.game-period-chip`, DiagnosticsPage `.status-badge`); DraftLottery
   `.stage__title`/`.stage__pick` (gold, 0.8rem); SchedulePage `.vs h2`
   (0.7rem, 2px).

   Proposed local class, `styles/shared.module.css`:
   `.label { composes: ds-overline from global; font-weight: var(--ds-font-weight-bold); }`
   (the app's bold variant). Callers keep only their layout properties.

   - **Recommended:** (a)/(b) as tabled. Size, weight and color stay the
     same; tracking converges on the shared 0.06em: +0.22–0.24px per letter on
     seven rules, −0.03px on two.
   - **Alternative (no tracking change):** one local class at 0.04em for all
     nine (600 and 700 variants), no `.ds-overline`; the two 0.75px rules
     lose 0.27px.
   - **Alternative (closest to the library):** all nine use `.ds-overline`,
     so the five bold labels drop to 600 weight; no local class.

2. **`.nav-search-col` width** (`components/PageHeader.module.css`). The search
   column is hidden at ≤576px and at 577–1300px, so 375, 1024 and 1280px do
   not show it; the 280px only applies above 1300px, where `flex-shrink: 1`
   already lets it give way.
   - **Recommended:** a named local property `--nav-search-width: 280px` on
     `.nav-bar`, next to the header's other local properties, used as
     `width: var(--nav-search-width)`. No visible change.
   - Alternative: derive it from the layout (e.g. `flex: 1 1 auto` with a
     max width). The box would grow or shrink above 1300px: a visible change
     to verify at 1440px and wider.

3. **Optional decisions.**
   - **Focus outlines** that use `--ds-color-info` or team colors instead of
     `--ds-focus-outline-color` (default: primary at 55%): FavoriteStar,
     FavoriteRow, SeasonSelector, FavoriteCategoryMenu, `shared.module.css`
     `.surfaceInteractive`, TeamList, StatLeadersSection,
     DraftLotteryOddsCard and Row, MyHockey (info blue, 2–3px); TeamPage tabs
     and rows (primary/team color). Setting `--ds-focus-outline-color` once on
     the app root would not remove these rules alone: each hard-coded color
     must also switch to the variable, and every control on the default would
     turn info blue (visible). Widths also differ (2px vs 3px).
     **Recommended:** keep as they are in this ticket; revisit as a separate
     visual decision.
   - **FavoritePlayerStar toast:** `FavoriteStar.module.css` `.toast` is only
     used by FavoritePlayerStar (its comment says "also"). It is
     `.ds-toast` plus `text-align: left`, which `.ds-toast` does not set, so a
     bare `ds-toast` class could center multi-line messages where the star sits
     in centered content. **Recommended:** keep the composition and correct the
     comment.

Keep: roles, keyboard behavior, team colors, measured chrome heights, and the
game-detail live state stated in text.

**Decisions:** pending.

**Scope:** apply the approved options. Delete every rule (or every property)
a shared class replaces; callers that keep layout properties keep only those.

**Exclusions:** no aero-md3-core edits, redesigns or new features. Rules
marked (c) stay. Table headers stay. Other duplicates found are listed below
for a follow-up.

**Acceptance:**

- No replaced label rule or property is left beside the shared class.
- Changed pages match their before screenshots at 1280 and 375px, light and
  dark, except for approved differences.
- Header layout is identical at 375, 1024 (NAV-01 fit) and 1280px, and the
  search column keeps 280px above 1300px.
- Keyboard focus on changed controls is unchanged unless approved.

**Verify:** standard frontend checks. Before/after screenshots (1280 and 375,
light and dark) of the touched pages: home, team page (stats leaderboard, Line
Change bench), My Hockey, diagnostics, and the header at 1024/1280/375 plus
1440 for the search column. Spotter run on the pushed branch covering game
detail (live and final, recorded fixtures), the header at 1024/1280/375, and
keyboard focus on the changed controls.

**Evidence:** pending.

**Release follow-ups:**

- Possible library follow-up (aero-md3-core, needs approval): a bold overline
  variant if option (b) is adopted, so `.label` can become shared.
- Duplicates seen, not in scope: `.season-field__label` and
  `.schedule-filter-field__label` are identical floating field labels; the
  four custom table headers repeat `.ds-table-compact th`-like rules.
