# AAR-01 — Favorite teams and After Action Report inbox

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Product Owner review of favorite star, header bell/inbox, report wording, and browser-alert opt-in on a real deploy.

**Status:** DONE — accepted by the Product Owner (2026-10-19)

**Goal:** A signed-in user favorites a team and gets an "After Action Report"
after each of its games; choosing one opens that game's detail page.

**Approved decisions:**

- Google account sign-in is site-wide (Product Owner, architecture approval).
- Delivery is an in-app inbox plus browser alerts while a tab is open
  (Product Owner). Mobile push is AAR-02.
- Multiple favorites are allowed. A favorite reports games that started no
  more than 12 hours before it was favorited (tonight's game counts even when
  favorited after the final horn; no season back catalogue). A game between two favorites
  yields one report written from the first favorite's side. Inbox keeps the 25
  newest reports.
- Browser alerts need an explicit "Turn on browser alerts" click; each game
  alerts once per browser; several new games roll into one alert. Clicking an
  alert opens the game and marks it read.

**Backend (HockeyStatsAPI):** migration `003_create_favorite_teams_and_report_reads.sql`;
`slices/afterActionReports`; routes `/api/favorites` and
`/api/after-action-reports` (see that repo's README). Reports overlay the
12-hour season club schedule with a 10-minute current-week club schedule so a
final shows up within about 10 minutes plus the client's 5-minute refresh.

**Frontend:** `lib/auth` (site-wide session, moved from Rink Quest),
`components/AccountCorner`, `features/after-action-reports`, star in `TeamHero`.

**Verification so far:** API unit/route tests and a real-Postgres run of the
repository SQL; frontend unit tests; Playwright run against a mocked API
covering signed-out hint, header sign-in, favorite/unfavorite, unread badge,
inbox to game navigation and read receipts, mark-all-read, browser-alert
opt-in/new-game alert/click-through, Rink Quest streak sync on the shared
session, phone layout without horizontal scroll, dark theme.

**Deploy steps:** run `pnpm run db:migrate` on the API before releasing the
frontend. `GOOGLE_OAUTH_CLIENT_ID` / `SESSION_JWT_SECRET` / `VITE_GOOGLE_CLIENT_ID`
are already required by Rink Quest sign-in.

**Acceptance:** Product Owner signs in on the deployed site, favorites a team,
and confirms a real game's report appears, reads well, and opens the game.
