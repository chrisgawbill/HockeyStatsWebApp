# STAR-01 — Favorite star in leaderboards and box scores

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-21: starred PlayerHeadshot on the leaderboard dialog (Pos hidden ≤576px) and scoring summary; box score gets a bare star, no photos.

**Status:** DONE — accepted by the Product Owner and merged 2026-10-21.

**Approved decisions (Product Owner, 2026-10-21):**

- The leaderboard dialog and scoring summary use the shared `PlayerHeadshot`
  (photo with the corner star), matching the team Player Stats rows: a 36px
  headshot before the leaderboard name, and the scorer's existing 36px
  headshot gains the corner star (this reverses WPR-01's exclusion).
- Box-score skater and goalie rows get no photos (tried at 28px; too
  crowded): a small bare `FavoritePlayerStar` sits before the name.
- Leaderboard dialog at phone width (≤576px) hides the Pos column so full
  names fit (Option B); Pos stays on wider screens.

**Goal:** A user can favorite any player wherever that player appears in a
list, not only from stat-leader cards, home rows, the roster stats dialog and
Three Stars.

**Dependencies:** WPR-01 (`PlayerHeadshot`, `FavoritePlayerStar`,
`FavoritePlayersProvider`). No API change: `PUT /api/favorite-players/:playerId`
already validates any NHL player id.

**Proposed scope (PM recommendation, confirm at checkpoint):**

- `stat-leaders/components/StatsLeaderModal.tsx`: a `FavoritePlayerStar` on
  each leaderboard row, next to the name.
- `game-detail/components/PlayerStatsSelection.tsx`: a star on each skater and
  goalie box-score row.
- Optional: the scorer in each `ScoringSummary` goal row.
- The star is its own button (tapping the row keeps the row's behaviour), with
  the same signed-out toast, 10-player limit message, fan category menu
  (FAN-01), and hidden-on-old-API behaviour as today.
- `game-detail` already renders `favorite-players` components through
  `ThreeStars`; update the cross-feature exception list in `architecture.md`
  for any new consumer.

**Acceptance:**

- Starring from a leaderboard or box-score row adds the player and the home
  favorites row updates without a reload; unstarring opens the category menu.
- Signed out: the toast appears and nothing is saved. At 10 favorites: the
  limit message.
- Rows stay one line high at 375px; no page horizontal scroll; keyboard focus
  reaches each star.

**Verify:** tsc, `pnpm test`, build; Playwright against a mocked API for the
cases above at 375/1280, light/dark, with screenshots.

**Implemented:** `StatsLeaderModal` (`LeaderboardRow` with a 36px
`PlayerHeadshot`; Pos hidden ≤576px), `PlayerStatsSelection`
(`PlayerNameCell` with a small bare star), `ScoringSummary` (scorer
`PlayerHeadshot`; `LandingGoal` now types `playerId`). The default-mug URL
moved to `lib/playerHeadshot.ts` for the leaderboard and `PlayerStatsSection`.

**Verification:** tsc, `pnpm test` (46 files, 177 tests), format check,
build. Playwright against a mocked API on `vite preview` at 375/1280,
light/dark: starring from the leaderboard, box score and scoring summary
saves and the home favorites row updates without a reload; a starred star
opens the category menu; signed-out toast with nothing saved; 409 limit
message; Tab reaches the leaderboard star and box-score stars take focus;
leaderboard rows 53px and box-score rows 41px, one line; Pos hidden only at
375 and "Oliver Ekman-Larsson" untruncated; no page horizontal scroll. Not
verifiable here: real NHL headshots and logos (asset host blocked) and real
Google sign-in.
