# TEAM-LINES-01 — "Line Change" roster view

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved: "Line Change" rink strips + Forwards/Defense/Goalies tab row; Product Owner reviews screenshots.

**Status:** DONE (Product Owner approved 2026-10-19) (frontend)

**Approved decisions (Product Owner):** Option 1. Roster tab gets a
Forwards | Defense | Goalies tab row styled like the player stats header
(`.player-stat-tab`). Each line/pair is a rink strip with jersey tokens in
formation (LW-C-RW; LD-RD), swiped horizontally with L1–L4 / P1–P3 pager.
Goalies: starter in the crease, backup on a bench strip. Strip shows time
together and the source game; falls back to the ice-time ranking labeled
"Projected" when the API returns `source: 'none'` or the call fails.

**Dependencies:** API-LINES-01 contract (frontend must work before it deploys).

**Product Owner review (screenshots):** Approved with polish: larger tokens on
desktop, content-sized goalie bench, Defense 2 columns below 1200px, grid edge
fix. Tokens show NHL headshots (number-disc fallback). Desktop (>= 992px) shows
all lines in a grid; the carousel is phone/tablet only. Tapping a player opens a
stats dialog (`AppDialog`) built from the skater/goalie stats the team page
already loads; no extra API calls.

**Follow-up (not in scope):** the global header nav overflows the viewport by
~35px at 1024px (pre-existing, outside this change).
