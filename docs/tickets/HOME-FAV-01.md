# HOME-FAV-01 — Favorite players row on the home page

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Started 2026-10-20 with PM-recommended layout (see block); Product Owner reviews 375/1280 screenshots; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24 by explicitly closing tickets awaiting acceptance. Previously recorded: implemented, QA PASS (all criteria, 375/1280 light/dark), readability pass done.

**Goal:** A signed-in user sees their favorite players in a row directly
below the landing page intro header ("<season> at a glance").

**Dependencies:** WPR-01 (`features/favorite-players`, `FavoritePlayersProvider`,
`PlayerHeadshot`/`FavoritePlayerStar`). No API change: data comes from
`GET /api/favorite-players` via `useFavoritePlayers()`.

**Approved decisions (PM recommendation, Product Owner said "start"):**

- New `features/favorite-players/components/FavoritePlayersRow.tsx` (+ CSS
  module), rendered by `app/LandingPage.tsx` between the intro `<header>` and
  the loading/error/content block, so it does not wait for stat leaders.
- Section title "Your favorite players". One card per favorite, in API order:
  `PlayerHeadshot` (with its star, so unstarring here works), name, and
  "TEAM · POS". Pressing the card opens the player's season stats in the
  team page's player stats dialog (Product Owner, 2026-10-21; it used to link
  to the team page).
- Signed in with zero favorites: one compact line, "Star a player's headshot
  to pin them here." Signed out, or `available === false` (old API): render
  nothing.
- Up to 10 cards (API cap). On narrow screens the row scrolls horizontally
  inside itself; the page never scrolls horizontally.
- Reuse design tokens and existing card styling; no new dependencies.

**Acceptance:**

- Signed out: no row, landing page unchanged.
- Signed in, favorites present: row appears under the header while stat
  leaders are still loading and when they error.
- Card click opens the player's stats dialog and does not navigate; the star
  opens the fan category menu; the toast/limit behavior is unchanged.
- Zero favorites shows the hint; old-API 404 shows nothing.
- 375px and 1280px, light and dark: readable, no page horizontal scroll.

**Verify:** tsc, `pnpm test`, build; Playwright against a mocked API
(signed-in session stub) for the cases above with screenshots.

**Acceptance (human):** Product Owner reviews screenshots, then on deploy.
