# HOME-LEAD-01 — Stat leaders use the favorite card on the home page

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-21: Option B (FavoriteCard in a 2×2 grid, Skaters/Goalies switch on phones); accepted from 375/1280 screenshots 2026-10-21.

**Status:** DONE — Product Owner accepted 2026-10-21. Chose Option B on 2026-10-21 from the phone
mockups (today / A swipe row / B 2×2 grid / C list). Implemented; QA PASS
(10/10 browser criteria + checks, after fixing an empty modal wrapper that took
a grid cell); readability pass done.

**Goal:** On phones all four leaders of a group are visible without swiping,
and stat leaders look like the favorite rows above them.

**Approved design (Product Owner, Option B):**

- Each leader is a `FavoriteCard`: headshot straddling the top border with the
  favorite star on its corner, then the category (small caps, accent colour),
  the stat value large, the player name and "TEAM · POS" when known. The badge
  slot shows the value instead of a fan tier. Tapping the card still opens the
  category's leaderboard dialog.
- Phones (< 768px): one "Stat leaders" section with a Skaters / Goalies
  segmented switch (Skaters default) over a 2×2 grid of that group's cards. No
  horizontal swipe row.
- PM default (Product Owner may revise at review): from 768px both groups show
  with their own left-aligned headings, each a 2-column grid of the same cards;
  no switch.
- Headings left-aligned at the favorite rows' size; loading, error, empty-group
  and missing-category behaviour unchanged.

**Verify:** unit tests for the card variant and the switch; Playwright against
a mocked API at 375 and 1280, light/dark: 4 cards visible per group on phone
without horizontal scroll, switch toggles groups, card opens dialog, star works
independently of the card.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-21. Chose Option B on 2026-10-21 from the phone mockups (today / A swipe row / B 2×2 grid / C list). Implemented; QA PASS (10/10 browser criteria + checks, after fixing an empty modal wrapper that took a grid cell); readability pass done.
