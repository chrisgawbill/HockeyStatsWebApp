# API-PWHL-01 — PWHL data on the read routes through a shared HockeyTech league slice (backend)

Delivery rules: [development workflow](../agent-development.md).

**Status:** IDEA — Requested 2026-11-15 ("research PWHL free APIs … can we
plug PWHL data in like we do with AHL"; "save the fixtures and write the
tickets"). HockeyStatsAPI.

**Goal:** The web app can ask the same read routes for PWHL data with
`league=pwhl` and get the response shape it already reads for the NHL and
AHL. The AHL code becomes one HockeyTech slice set up per league, so the PWHL
(and any later HockeyTech league) is mostly configuration rather than a copy.

**Dependencies:** API-AHL-01 and API-AHL-02 (done). Blocks PWHL-01. Favorites
for the PWHL are a later ticket.

**Read:** `src/platform/ahlApiClient.js`; `src/slices/ahl/` (services,
repository, both mappers); `src/presentation/middleware/validateLeague.js`;
the league switches in `src/presentation/routes/{standings,schedule,team,player}.js`;
`src/composition/container.js`; `bin/www` (the 3x daily refresh); migration
`014`; the API README "AHL data" section; fixtures `src/test/fixtures/pwhl/`
and `src/test/fixtures/ahl/`.

**Product Owner checkpoint:**

- **Data source risk.** The PWHL has no official API. Its website uses the
  same undocumented HockeyTech feed as the AHL (`client_code=pwhl`, the public
  key from thepwhl.com), with the same risk: it can change or be blocked
  without notice. Confirm we accept that, as we did for the AHL.
- **Storage** (PM recommendation: one set of HockeyTech tables with a league
  column). API-AHL-01 chose separate `ahl_*` tables because AHL ids can
  collide with NHL ids. PWHL ids collide with AHL ids too (team id 1 is in
  both), so the league has to be part of every key either way. Options:
  1. *(Recommended)* One migration renames `ahl_*` to `hockeytech_*`, adds
     `league text NOT NULL DEFAULT 'ahl'` with a `CHECK (league IN ('ahl',
     'pwhl'))`, and puts `league` first in each primary key. This is the
     pattern migration 015 used for favorites. Existing AHL rows are kept.
  2. A second set of `pwhl_*` tables with the same columns, with the
     repository choosing the table set by league. No change to AHL rows, but
     two copies of every table for every new league.
- **PWHL point percentage** (PM recommendation: points ÷ (3 × games played)).
  The feed's `percentage_full` assumes 2 points a game, so Montréal's 2025-26
  value is 1.033. Dividing by the PWHL's 3 points a game gives 0.689. Being
  first or last is unaffected either way.

**Decisions:**

- 2026-11-15 (planning spike, live feed): the PWHL feed answered with the
  thepwhl.com public key on every view the AHL slice uses: modulekit
  `seasons`, `teamsbyseason`, `schedule`, `roster`, standings `statviewtype`,
  and statviewfeed `players` (skaters and goalies) and `gameSummary`. The
  field names match the AHL fixtures. The only AHL fields the PWHL lacks
  (skater shootout stats, `catches`, video and webcast links) are fields the
  mappers do not read or only store. Running the current mappers on the PWHL
  fixtures produced correct standings (wins include every win, `otLosses` =
  OT + shootout losses, the feed's `points` already follow 3-2-1), schedule,
  roster, player summaries and boxscore scores, apart from the gaps listed
  under Scope.
- 2026-11-15 (spike): PWHL HockeyTech seasons as of today: 2026-27 regular
  season `11` (starts 2026-12-04), 2026-27 pre-season `10`, 2026 playoffs
  `9`, 2025-26 regular season `8`. 2025-26 had 8 teams in one table
  (conference and division both "PWHL"). The feed lists 12 teams for 2026-27
  in Eastern and Western conferences. That season's standings cannot be
  checked until its games start.
- 2026-11-15: recorded trimmed fixtures in `src/test/fixtures/pwhl/` (feed
  key removed), cut down the same way as the AHL ones: 2025-26 seasons and
  teams, three final games (regulation, overtime, shootout game 326),
  standings header and two teams, a three-player Boston roster (G, LD, C), two
  skaters (F, LD), two goalies, and the game 326 summary with three skaters a
  side, including a defender.

**Scope:**

- **Feed client per league.** `ahlApiClient.js` becomes a HockeyTech client
  created with `{ league, clientCode, key }`. Keys stay in `.env`:
  `AHL_FEED_KEY` and `AHL_CLIENT_CODE` as now, plus `PWHL_FEED_KEY` and
  `PWHL_CLIENT_CODE=pwhl`, documented in `.env.example`. A league without a
  key is skipped, as the AHL is now.
- **Services per league.** `createAhlService` / `createAhlReadService` take a
  league config and are built once per configured league in `container.js`.
  Cache keys are prefixed with the league (`ahl:` stays as it is; the PWHL
  uses `pwhl:`). Responses carry that league in `league`.
- **League registry.** `validateLeague` accepts `nhl`, `ahl` and `pwhl`. The
  routes pick the service with a lookup by league instead of
  `req.league === 'ahl' ? …`. `nhlOnly` answers 404 for every league except
  the NHL. Favorites and report routes keep their own validation and still
  answer 400 for `league=pwhl`.
- **Storage** per the checkpoint choice. The repository filters and writes by
  league.
- **Scheduled refresh.** `bin/www` refreshes each configured HockeyTech league
  after the NHL. A failure in one league never stops the others or the NHL.
- **Mapper fixes found in the spike** (they apply to both leagues):
  - *Defense positions.* The PWHL sends `LD` and `RD` for defenders, and `F`
    for some skaters in the stat tables. Map `LD`/`RD` to `D` in
    `toPositionCode`, and group boxscore skaters by the mapped code. Today
    `mapBoxscoreTeamStats` puts every PWHL defender under forwards.
  - *Shootout finals.* PWHL schedule rows send `shootout: "2"` for a game
    decided in a shootout (`game_status: "Final SO"`), but the schedule
    mapper only checks for `"1"`, so game 326 shows `periodType: "OT"`. Treat
    any value other than `"0"` or empty as a shootout.
  - *Preseason season ids.* The PWHL's 2025-26 preseason is dated from
    2025-06-01, so the September 1 rule files it under `20242025`. Exhibition
    seasons take their season id from their end date instead.
  - *Point percentage* per the checkpoint choice. Points per game becomes part
    of the league config: 2 for the AHL, 3 for the PWHL.

**Exclusions:** PWHL favorites, reports and pushes (a later API-PWHL-02);
filling the extra stats the PWHL sends (ice time, faceoffs, hits and blocks
stay `null` as for the AHL); a live game poll; NHL-only routes (`/team/lines`,
play-by-play, landing, Corsi, faceoffs, rivalries, Rink Quest), which answer
404 for `league=pwhl` as they do for the AHL.

**Acceptance:**

- With `league=pwhl` and the key set, standings, schedule, game boxscore,
  team summary, roster, team schedule, player summaries, stat leaders and the
  stats version answer in the AHL response shape with `league: "pwhl"`.
  `?season=20252026` returns the 8-team 2025-26 season.
- PWHL defenders are listed as `D`, in roster and boxscore defense. Game 326
  is a shootout final.
- Every AHL and NHL response is unchanged, apart from the fixes listed above.
  AHL rows, cache keys and tests still pass.
- With the PWHL key missing or the feed down, the PWHL is skipped, or serves
  its cached and stored data, and the AHL and NHL are unaffected.

**Verify:** the existing AHL tests run unchanged against the shared slice;
PWHL tests use the same fixture stubs as `ahl.test.js` and `ahlRoutes.test.js`
on `fixtures/pwhl`, covering LD/RD, the shootout final, the preseason season
id and point percentage. Run the new migration on real Postgres over a
database that already has AHL rows. Do one live refresh with the PWHL key. The
README "AHL data" section becomes "HockeyTech leagues (AHL, PWHL)".

**Evidence:** none yet.

**Release follow-ups:** set `PWHL_FEED_KEY` on the dev server, then deploy
and check one scheduled refresh there (Product Owner). Check the 2026-27
standings layout (two conferences) once games start on 2026-12-04.
