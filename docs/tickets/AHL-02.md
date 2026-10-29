# AHL-02 — Favorite AHL teams and players in the shared favorites list

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested by the Product Owner 2026-10-29. Frontend.

**Goal:** A signed-in user can favorite AHL teams and players and see them in
the same favorites as their NHL ones, with no separate AHL list.

**Dependencies:** API-AHL-03 deployed; AHL-01.

**Read:** FEED-02, FAN-01 and WPR-01 tickets; the favorites hooks and My Hockey
page.

**Product Owner checkpoint:** how a favorite shows its league (PM
recommendation: a small "AHL" badge on AHL favorites only); experiential
review.

**Decisions:**

- 2026-10-29 (Product Owner): one favorites list across both leagues, same
  limits (5 teams, 10 players in total).

**Scope:**

- The favorite buttons on AHL team and player pages send `league=ahl`.
- My Hockey and the home page favorites rows show favorites from both leagues
  whichever league the toggle is on, and link each to its own league's page.
- The limit message counts both leagues ("You can favorite at most 5 teams").
- Tier, label and mute controls work the same for AHL favorites; push and
  report settings say they cover NHL favorites only (per API-AHL-03).

**Acceptance:**

- A user can favorite an AHL team and an NHL team with the same tri-code and
  tell them apart.
- At 5 teams in total, favoriting a sixth from either league shows the limit
  message.

**Verify:** unit tests for league-aware favorites state; browser spec adding
and removing an AHL favorite and hitting the shared limit; Spotter run.
