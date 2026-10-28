# FAN-01 — Favorite teams on home and fan categories (frontend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-20: teams row above players, sorted by tier; Product Owner reviews the category menu and rows in screenshots; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24 by explicitly closing tickets awaiting acceptance. Previously recorded: implemented, QA PASS (11/11 after a focus-trap fix), readability pass done.

**Goal:** Favorite teams join the home favorites area, and a user can put each
favorite in a category and see favorites grouped or badged by it.

**Proposed design (PM recommendation, confirm at checkpoint):**

- Home: a "Your teams" row of logo cards (link to `/team/<triCode>`) next to /
  above the HOME-FAV-01 players row, sharing its section styling.
- Category control: tapping a favorited star (team or player) opens a small
  menu: Diehard / Fan / Curious, optional custom label, Unfavorite.
  Unfavorite stays one extra tap away instead of the current one-tap toggle.
- Card layout (Product Owner, 2026-10-20, applies to both home rows): the
  headshot or team logo is centered at the top and straddles the card's top
  border (the border meets the middle of the image), with name, "TEAM · POS",
  and the badge centered underneath. The star stays on the image corner.
- Home rows order Diehard first, then Fan, then Curious; each card
  shows a small badge (custom label if set, else the tier name).
- Degrade gracefully until API-FAN-01 deploys (missing `tier` = Fan,
  menu hides category options).
- Fix (Product Owner, 2026-10-21: "you cannot change fan level"): home team
  cards had no star, so their tier could only be changed on the team page;
  they now carry the same corner star as player cards. The menu opens above
  its star when there is not enough room below, so it is no longer squeezed
  into a scrolling sliver on phones. Saving still needs API-FAN-01 deployed.

**Verify:** unit tests for ordering/badges; Playwright against a mocked API
for the menu, row grouping, 375/1280 light/dark.
