# FEED-02 — Favorites move to My Hockey

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22: Option A — Your teams and Your players rows move from home to the top of /my-hockey; the player row and the feed's player list merge into one card row (season + last-game lines on each card); home keeps only the Up next strip; Up next rows show the opponent logo right after the matchup; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24 by explicitly closing tickets awaiting acceptance. Previously recorded: merged in `3d09840b` (#117).

**Approved 2026-10-22 (option A):** move Your teams and Your players from
home to the top of `/my-hockey`. Merge the player row and feed player list
into one card row with season and last-game lines. Home keeps Up next only;
its matchup rows show the opponent logo directly after the matchup.

**Verify:** retain FEED-01's signed-out, empty, ordering, failure and request
reuse checks; review the moved rows and opponent logos at 375/1280 in light
and dark. A merge alone does not establish acceptance.
