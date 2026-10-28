# FEED-01 — "My Hockey" personal feed

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-21: /my-hockey page plus an "Up next" strip on home (right-hand column on desktop); Up next / Last results / Your players; games by time, players by tier; hard cap of 5 favorite teams (API); season + last-game player lines. Accepted from screenshots 2026-10-22.

**Status:** DONE — accepted by the Product Owner from screenshots 2026-10-22.

**Approved decisions (Product Owner, 2026-10-21, from 375/1280 mockups):**

- Location: both. A `/my-hockey` page (sign-in prompt when signed out),
  linked from the avatar menu and a "See all" on the home "Your teams" row,
  plus a short "Up next" strip on home (first 3 games, "My Hockey →" link)
  under the favorites rows.
- Sections, in order: **Up next**, **Last results**, **Your players**
  (desktop: the two game sections side by side, players in two columns).
- Ordering: Up next live games first, then by start time; Last results newest
  first; players by tier (Diehard, Fan, Curious). A game between two
  favorites shows once.
- Hard cap of **5 favorite teams** (API returns 409 past 5, like the
  10-player cap; existing accounts over 5 keep theirs but cannot add). The
  team star shows the same limit message as players. No "Show more" needed.
- Every favorite player is shown with a season line (skaters GP · G · A · P;
  goalies GP · W-L-OTL · SV% · GAA) and a last-game line from the box score
  of the player's team's latest final.

**Implemented:** `features/my-hockey` (`MyHockeyPage`, `UpNextStrip`,
`UpNextRow`, `LastResultRow`, `FeedPlayerRow`, `FeedSection`, `FeedList`,
`useMyHockeyData`, `useFeedFavorites`,
`utils/feedSelection.ts`, `utils/feedFormat.ts`); `/my-hockey` route; avatar
menu link; "See all" on "Your teams" (`FavoriteRowSection.titleLink`); the
team-page star shows "You can favorite up to 5 teams. Unfavorite one first."
on a 409. `/team/schedule` is cached 12 hours by the API, so games that have
started but are not final there are corrected from their box scores (5-minute
cache), which also give the players' last-game lines. HockeyStatsAPI: favorite
teams capped at 5 (409, per-user advisory lock like players), and the goalie
summary now includes `otLosses` (the frontend shows W-L when an older API
leaves it out). `lib/teamLogo.ts` now holds the themed logo URL. Shared
components added for reuse (Product Owner, 2026-10-22): `FanCategoryBadge`
(home cards and feed rows), `TeamLogo`, `SectionHeading` (home rows, stat
leaders, Up next strip) and `PageIntro` (My Hockey, Weekly Player Report).
Desktop home (Product Owner, 2026-10-22): from 1001px the Up next strip sits
in a 24rem right-hand column at the top, beside the favorite rows, which
scroll sideways; phones and tablets keep the stacked order. Verified at
375/1024/1280/1440 light/dark: strip top-aligned with "Your teams", rows
scroll, no page horizontal scroll; without favorite teams there is no strip
and the rows take the full width.

**Verification:** tsc, `pnpm test` (48 files, 192 tests, incl. ordering and
next/last selection), format check, build; API `node --test src/test/*.test.js`
(84 pass). Playwright on `vite preview` against a mocked API at 375/1280,
light/dark: live game first then by start time, a game between two favorites
shown once, newest final first with Report pills and the unread dot, players
in tier order with season and last-game lines (live, final, did not play);
one schedule request per team (a failing team only adds the client's own
retries) and box scores only for rechecks and player games; one failing team
schedule hides only that team; opening a report row marks it read; home strip
shows three games and reuses the page's requests; "See all" and avatar links;
Tab reaches the rows; signed out: prompt with no private or feed calls and no
strip; zero favorites: one hint; sixth team: limit message, star stays off; no
page horizontal scroll. Not verifiable here: real NHL data, headshots and
logos (hosts blocked), real Google sign-in. Note: a team whose schedule call
keeps failing delays the feed by the client's retry backoff (~7s) before it
renders without that team.

**Goal:** One place where a signed-in user sees what's happening with their
favorite teams and players: next games, last results, and how their players
are doing, without opening each team page.

**Dependencies:** WPR-01 and FAN-01 (favorites with tiers). The first version
needs no API change: it composes `/api/favorites`, `/api/favorite-players`,
`/team/schedule/:triCode`, `/api/after-action-reports` and the skater/goalie
summary endpoints the site already calls.

**Proposed design (PM recommendation, confirm at checkpoint):**

- Route `/my-hockey` (signed-in only; signed out shows a sign-in prompt), linked
  from the avatar menu and from a "See all" on the home favorites rows. A
  later decision can move a short version onto the home page.
- Sections:
  1. **Up next:** each favorite team's next game (date/time local, opponent,
     home/away) linking to `/game/:gameId`, ordered by start time; live games
     first with the score.
  2. **Last results:** each favorite team's latest final with score, linking
     to its After Action Report when there is one.
  3. **Your players:** season line per favorite player (skaters G-A-P,
     goalies W-SV%-GAA) and last-game line when available, sorted by tier.
- Ordered within each section Diehard, Fan, Curious, then by time.
- Feature home: new `features/my-hockey` composing data through its own `api/`
  module; display components from other features go through the existing
  exceptions or `components/` / `lib/` (update `architecture.md`).
- Refreshes on focus and every 5 minutes while visible, like the inbox.

**Out of scope (candidate follow-ups needing a backend ticket):** milestone
watch ("3 goals from 300", needs career totals from the NHL player landing),
injuries (no reliable public NHL source), and a server-side aggregate endpoint
if the client fan-out proves slow.

**Acceptance:**

- Signed out: sign-in prompt, no API calls for private data.
- Zero favorites: one hint linking to teams and stat leaders.
- One team's schedule call failing hides only that team's rows.
- With 10 players and several teams, the page loads with no more than one
  schedule call per team and reuses cached summary data.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** unit tests for ordering and next/last game selection; Playwright
against a mocked API for the cases above with screenshots.
