# AHL-02 — Favorite AHL teams and players in the shared favorites list

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE — Started by the Product Owner 2026-10-29. Implemented on
branch `feature/ahl-league-toggle` (with AHL-01); pending Product Owner
confirmation of the checkpoint below, the experiential review, a Spotter run,
and the API-AHL-03 deploy. Requested 2026-10-29. Frontend.

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
- 2026-10-29: Product Owner started the ticket on the AHL-01 branch. Built on
  the PM recommendation for the checkpoint (a small outlined "AHL" tag under
  the name on AHL favorite cards only). Still needs explicit Product Owner
  confirmation and the experiential review.
- 2026-10-29 (implementation): a favorite is league plus tri-code or player
  id everywhere in the frontend, so an AHL `TOR` and the Maple Leafs are two
  favorites. Stars and the team button use the league the site shows; My
  Hockey cards use the favorite's own league and link with an explicit
  `?league=nhl|ahl`, so a card opens its own league's page from either view
  (and switches the toggle to it). The limit messages now say "across the NHL
  and AHL". AHL copy leaves out After Action Reports and the Weekly Player
  Report. The bell lists only NHL teams and players for push mutes and says
  notifications and the weekly report cover NHL favorites only when the user
  has AHL ones; its empty-inbox hint names only NHL teams.
- Open for the Product Owner: the home page has no favorites rows, only the
  Up next strip, which shows NHL favorites' games and stays hidden in the AHL
  view (it reads NHL schedules). AHL favorites appear on My Hockey's "Your
  teams" and "Your players" rows but have no games, season or last-game lines
  there (the feed reads NHL data only). Recommendation: accept for now; AHL
  games in the feed would be a follow-up with the AHL game polling ticket.

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

**Evidence (2026-10-29, branch `feature/ahl-league-toggle`):**

- PASS: `pnpm tsc`, `pnpm test` (318/318, new: AHL favorites calls send
  `league=ahl` on add, remove, category and push-mute for teams and players
  while NHL calls are unchanged; the same `TOR` and player id kept once per
  league; a missing `league` read as NHL), `pnpm format:check`, `pnpm build`.
- PASS (local Playwright against a preview build, not Spotter): the AHL-02
  add/remove spec (favorite the AHL `TOR` with the NHL `TOR` already
  favorited, both shown apart on My Hockey with the "AHL" tag and their own
  league links, unfavorite only the Marlies), the AHL half of the shared-limit
  spec, and AHL-01's AHL-only specs. The NHL steps need Spotter's recorded NHL
  fixtures and did not run locally.
- NOT RUN: Spotter on the pushed branch (`react/qa/ahl-favorites.spec.mjs`,
  and `react/qa/league-toggle.spec.mjs`, whose synthetic AHL league moved to
  `src/test/fixtures/ahlLeague.mjs` and which no longer expects the AHL team
  page to hide the favorite button).
- NOT RUN: Product Owner experiential review.

**Release follow-ups:** deploy API-AHL-03 before this ships (Product Owner).
