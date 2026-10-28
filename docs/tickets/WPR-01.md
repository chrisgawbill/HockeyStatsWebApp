# WPR-01 — Favorite players and the weekly report (frontend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-19: reusable star headshot, proposed inbox/report design, best-performer wording; screenshots for Product Owner acceptance; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Not run: the break-week check (a week without games sends nothing). Previously recorded: ACTIVE — implemented and QA-verified (`909cf01`, fixes `2f53aee`); Product Owner accepted 2026-10-24; first Monday report received on the Product Owner's phone and checked 2026-10-26. Pending: a break week sends nothing.

**Approved decisions (Product Owner, 2026-10-19):**

- Replaces design item 1: a reusable **player headshot with a corner star
  button**. Tapping the star toggles the favorite; tapping the photo keeps
  today's behaviour. Filled gold = favorited, outline = not; signed out it
  shows the same sign-in hint as the team star. Used on the larger headshots:
  roster stats dialog, team Player Stats rows, Three Stars, stat-leader
  rows/modal, and the weekly report cards (not the scoring-summary goals).
- Inbox item, report page, and toggle placement as proposed (items 2–3).
- Notification wording as in API-WPR-01's approved decisions.

**Goal:** A signed-in user can star a player, see their favorite players,
and open each Monday's Weekly Player Report from the bell inbox or from the
push notification.

**Dependencies:** API-WPR-01 contract (build against it; degrade gracefully
until it deploys, as TEAM-LINES-01 did).

**Read first:** this block and API-WPR-01; AAR-01/AAR-02 blocks;
`features/after-action-reports/` (`FavoriteTeamButton`, `NotificationBell`,
`AfterActionReportsContext`, `usePushNotifications`, `utils/serviceWorker`,
`public/sw.js`); `features/teams/components/PlayerStatsDialog.tsx` and
`JerseyToken.tsx`; `lib/auth/AuthContext.tsx`; `app/App.tsx` routes.

**Proposed design (PM recommendation; confirm at the checkpoint):**

1. **Where the star lives:** there is no player page today. Put a star in
   the roster stats dialog (`PlayerStatsDialog`) next to the player's name,
   using the same component and signed-out hint behaviour as
   `FavoriteTeamButton`. Optionally add a star to stat-leader rows later.
2. **Inbox:** the bell inbox shows a "Weekly Player Report · Oct 13–19" item
   alongside After Action Reports, unread until opened; the toggle "Weekly
   player report notifications" sits next to the existing push controls.
3. **Report page:** new route `/weekly-report/:weekStart` with one card per
   favorite player (headshot, team, the week's line, best game) and a "Did
   not play" state; it reads the frozen report from the API and marks it
   read. A "Favorite players" list with unstar buttons sits at the bottom.
4. **Push click:** the service worker opens `#/weekly-report/<weekStart>`
   and posts the read token, mirroring the AAR click flow.
5. Keep cross-feature rules from `docs/architecture.md`: the dialog in
   `features/teams` may render the favorites feature's star, as `TeamHero`
   already does; record the new exception in architecture.md.

**Implemented:** `features/favorite-players` (API client, `FavoritePlayersProvider`,
`PlayerHeadshot` + `FavoritePlayerStar`, `WeeklyReportPage` at
`/weekly-report[/:weekStart]`); stars on the roster dialog, team Player Stats
rows, Three Stars, and stat-leader cards (the stat-leader modal is a table with
no headshots); bell inbox merges weekly items and hosts the weekly switch;
`sw.js` routes `kind: "weekly-report"` pushes. Architecture exceptions recorded.

**Verification so far:** unit tests (format helpers, service-worker weekly
push/click), tsc, build. Independent QA ran Playwright against a mocked API on
the dev server and production preview: star toggle/revert/409/signed-out hint
on every surface (photo and card clicks unchanged, none on scoring summary),
bell mix/badge/open/mark-all-read, report page (skater/goalie lines, best-game
link, did-not-play, traded, other weeks, unstar, 404 and empty states), weekly
switch with a stubbed PushManager, old-API 404 degradation, `wpr-navigate`
messages, and 375/1280 light/dark without horizontal scroll — all PASS after
fixing the dark-theme best-game link contrast and the stat-leader star
position under `vite dev` (`2f53aee`, re-verified). Not verifiable here: real
Google sign-in, a real OS notification tap, and real NHL data.

**Planned verification:** unit tests for formatting and state; Playwright against a
mocked API at 375px and 1280px, light and dark: star/unstar from the dialog
(signed in and out), inbox item and unread badge, report page including "Did
not play", the notification toggle, and the service-worker click route.

**Acceptance:** Product Owner favorites players on the deployed site,
receives the first Monday report on a phone, and confirms that a break week
sends nothing.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Previously recorded: ACTIVE — implemented and QA-verified (`909cf01`, fixes `2f53aee`); Product Owner accepted 2026-10-24; first Monday report received on the Product Owner's phone and checked 2026-10-26. Pending: a break week sends nothing. Not run: the break-week check (a week without games sends nothing).
