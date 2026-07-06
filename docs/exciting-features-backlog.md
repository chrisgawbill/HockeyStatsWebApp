# Exciting Features Backlog

Creative, differentiating feature ideas identified on 2026-07-01. The goal of this file is uniqueness: features that make the app feel like *your* hockey app rather than a re-skin of nhl.com. It complements [phase-2-backlog.md](./phase-2-backlog.md) (core workflows) and stays out of the way of [cleanup-backlog.md](./cleanup-backlog.md) and [frontend-backlog.md](./frontend-backlog.md).

**Guiding principle — derive, don't fetch.** The app already loads a full season of schedule results (`ScheduleContext`), full standings with streaks/wildcard sequences (`StandingsContext`), skater/goalie summaries, stat leaders, and locally computed draft lottery odds (`LeagueStandingsHelper.ts`). Almost every ticket below is a pure client-side projection of that already-loaded data: **zero new NHL API calls, zero new backend endpoints**. Each ticket carries a **Data** line stating its cost. The one exception is E8 (Prospect Watch), which adds two tiny, long-TTL NHL fetches — flagged explicitly.

Ordering: E1–E7 and E9 are independent of each other and can land in any order (E1 pairs naturally with Phase 2 ticket 2.10; E9 reuses 2.9's local-first patterns). E8 is the only ticket that touches `api/`. All derivation math goes into pure helper files under `react/src/Data/Helpers/` so ticket 2.13's test suite can cover it.

Each ticket's **implementation prompt** is self-contained and meant to be pasted verbatim into a fresh Claude Code session (senior dev pairing with a junior dev who writes the code).

## E1 Playoff race command center: magic numbers, cutlines, and pace

- [ ] **Owner:** Either | **Data:** already-loaded contexts — zero new fetches | **Pairs with:** Phase 2 ticket 2.10

The single most "fan-brain" feature a standings app can have and one almost no hobby app does well: for every team, compute its **magic number** (points needed to clinch a playoff spot), **tragic number** (points until mathematically eliminated), current pace vs. the projected playoff cutline, and points-per-remaining-game required to reach the cutline. Everything derives from data already in `StandingsContext` (points, games played) and `ScheduleContext` (remaining games per team). This is the natural sibling of ticket 2.10's wildcard view — if 2.10 hasn't landed, this ticket's helper should still be built standalone so 2.10 can consume it.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/. This ticket is frontend-only: zero new fetches, zero api/ changes.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E1 and docs/phase-2-backlog.md ticket 2.10 (check whether its wildcard derivation helper exists yet)
2. docs/architecture.md — "Season Selection", "Developer Conventions"
3. react/src/Data/Context/StandingsContext.tsx and ScheduleContext.tsx — what fields each team/game already carries
4. react/src/Data/Helpers/LeagueStandingsHelper.ts and react/src/Data/Models/StandingsTeam.ts
5. react/src/Pages/StandingsPage.tsx

TASK: Add a "Playoff Race" view: per-team magic number, tragic number, projected cutline, and required pace — all derived client-side.

STEPS (pause after each):
1. Derive the inputs with me first, on paper: remaining games per team = that team's games in the loaded season schedule with a future/pre gameState (FUT/PRE); max possible points = points + 2 * remaining. Confirm StandingsTeam carries points and gamesPlayed, and agree how we identify the current playoff cutline (8th seed per conference: top 3 per division + 2 wildcards — reuse 2.10's derivation if it exists, otherwise write it here in the helper and note that 2.10 should consume it).
2. Create react/src/Data/Helpers/PlayoffRaceHelper.ts — pure functions, no React imports (2.13 will unit test it): computeMaxPoints, computeMagicNumber (points such that the 9th-place team's max possible points can no longer pass you), computeTragicNumber (symmetric: eliminated when your max possible points < current cutline holder's points), computeRequiredPace (points per remaining game to match the cutline's projected 82-game total). Document each formula with a comment — magic/tragic numbers are simplified (they ignore tiebreakers like regulation wins); say so in the UI with a small footnote.
3. Build the view: a per-conference table (or an extension of StandingsPage behind a URL param, e.g. ?mode=race if 2.10's mode param exists; otherwise a new /playoff-race route in App.tsx) showing team, points, remaining, max points, magic #, tragic #, required pace. Clinched teams show their clinch indicator instead of a magic number; eliminated teams show "—" with an eliminated style.
4. Visual cutline: a horizontal divider row in the table between the 8th and 9th seeds, and subtle row tinting for clinched / in-position / chasing / eliminated (tokens from index.css only — no raw hex, per frontend-backlog F3).
5. Empty/edge states: early season (magic numbers absurdly large — show "early" state below a games-played threshold we pick together), past seasons (season over: everything resolves to clinched/eliminated — the math must not divide by zero remaining games).

INVARIANTS:
- Zero new fetches: only ?season= triggers a re-fetch; this view is a projection of loaded context data.
- All math in PlayoffRaceHelper.ts, pure and unit-testable; components only render.
- URL params preserved via the setSearchParams(prev => ...) pattern; route-state fields on any team links.
- Styling via CSS modules and existing tokens; reuse EmptyState.

OUT OF SCOPE: full Monte Carlo playoff-odds simulation (a possible future ticket), tiebreaker-exact clinch math (NHL's official clinch logic includes regulation-win tiebreakers — our simplified numbers get a footnote instead), backend endpoints.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: current season shows plausible numbers (spot-check one team's magic number by hand math); a past season renders the resolved state without crashes or division-by-zero; switching seasons via SeasonSelector updates the view; no network requests fire when opening the view with contexts warm (devtools Network).
- I have ticked this box and added a short completion note under this ticket in docs/exciting-features-backlog.md.
```

## E2 Team form and momentum visuals

- [ ] **Owner:** Either | **Data:** already-loaded contexts — zero new fetches, no new dependencies

Standings tell you where a team is; form tells you where it's going. From the completed games already in `ScheduleContext`, derive per-team momentum visuals: a last-10 win/loss strip (the classic W-L-OTL dot row), a rolling points-percentage sparkline across the season, cumulative goal differential, and home/road splits. Rendered as small inline SVGs — no chart library. Surfaces on the team page (Overview tab once 2.7 lands) and as a compact strip in standings rows.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero new fetches; NO chart library — small inline SVG components.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E2
2. react/src/Data/Context/ScheduleContext.tsx and react/src/Data/Models/ScheduledGame.ts — exactly which result fields a completed game carries (scores, gameState, home/away, OT/SO indicator if present)
3. react/src/Pages/TeamPage.tsx (or its 2.7 successor) and react/src/Pages/StandingsPage.tsx — where the visuals will mount
4. react/src/Data/Helpers/GameStatusHelper.ts (completed-game detection) and TeamColor.ts if present
5. docs/frontend-backlog.md F2/F3 — use tokens, not raw hex, for win/loss colors

TASK: Pure derivation helper + three small SVG components: FormStrip (last-N results as dots/letters), PointsPaceSparkline (rolling points% over the season), and SplitBars (home/road, GF/GA). Mount on the team page; FormStrip optionally in standings rows.

STEPS (pause after each):
1. Create react/src/Data/Helpers/TeamFormHelper.ts (pure, no React): getTeamResults(games, triCode) → ordered result objects {date, won, otl, gf, ga, home}; lastN(results, n); rollingPointsPct(results, window); cumulativeGoalDiff(results); homeRoadSplits(results). Decide together how OT/SO losses are detected from the ScheduledGame model — if the model lacks an OT indicator, check whether the schedule contract carries one before falling back to treating all losses equally (and note the gap for the backend mapper if so).
2. FormStrip component: a row of small circles or letters (W green / L red / OTL amber — via success/danger/tertiary tokens), most recent on the right, with an accessible label ("last 10: 7-2-1"). Size via prop so it works in a table row and on the team page.
3. PointsPaceSparkline: one inline SVG polyline of rolling points% (window ~10), fixed viewBox, stroke currentColor so it themes for free; a faint 0.500 reference line. Keep it under ~60 lines — no library.
4. SplitBars: home vs road record and GF/GA as two paired horizontal bars.
5. Mount on the team page (Overview area), all derived via useMemo over ScheduleContext data for the selected season. If ticket 2.7's tabs exist, put them in the Overview tab.
6. Optional (agree first): FormStrip in StandingsPage rows — only if it doesn't crowd mobile; check at 576px.

INVARIANTS:
- Zero new fetches; useMemo over context data; re-derives when useSeason() changes.
- All math in TeamFormHelper.ts (unit-testable, ticket 2.13); SVG components are dumb renderers.
- Colors via CSS tokens only; date parsing via parseLocalDate — never new Date("YYYY-MM-DD").

OUT OF SCOPE: player-level form, shot/xG charts (data not collected), chart libraries, backend changes.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: a team page shows form strip + sparkline matching reality (cross-check last-10 vs nhl.com for one team); past seasons render full-season visuals; both themes legible; mobile at 576px doesn't overflow.
- I have ticked this box and added a short completion note under this ticket.
```

## E3 Head-to-head matchup explorer

- [ ] **Owner:** Either | **Data:** already-loaded current season; past seasons reuse the existing cached `?season=` fetch path

Pick any two teams and see their season series: results of played meetings, upcoming meetings, aggregate goals, home/away splits, and current form (reusing E2's FormStrip). A natural pre-game page — and a link target from every game card ("view season series"). Current season comes straight from `ScheduleContext`; browsing a past season's series reuses the same season-switch fetch the schedule page already does (cached on the backend), so no new endpoints.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; no new endpoints; the only fetches are the existing season-schedule loads ScheduleContext already performs.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md sections E3 and E2 (reuse TeamFormHelper/FormStrip if E2 landed)
2. react/src/Data/Context/ScheduleContext.tsx, react/src/Data/Models/ScheduledGame.ts
3. react/src/Data/LocalData/TeamListData.ts (team picker source), react/src/Components/SchedulePage/ (GameChip/ScheduleCard to reuse for meeting rows)
4. react/src/Pages/SchedulePage.tsx — the setSearchParams(prev => ...) and goToGameDetails patterns to copy
5. docs/phase-2-backlog.md ticket 2.5 — if its ?team= filter landed, stay consistent with its param naming

TASK: A /matchup route (e.g. /#/matchup?a=COL&b=VGK&season=...) showing the season series between two teams, derived from the loaded season schedule.

STEPS (pause after each):
1. Create react/src/Data/Helpers/MatchupHelper.ts (pure): getSeasonSeries(games, triA, triB) → {played: [...], upcoming: [...], summary: {winsA, winsB, otDecisions, goalsA, goalsB, homeRecordA, ...}}. Unit-testable, no React.
2. Add the /matchup route in App.tsx with two team selects (from localTeamList) backed by ?a= and ?b= URL params (deep-linkable, params preserved via the usual pattern). Season comes from the shared SeasonSelector/useSeason().
3. Render: summary header (series score, aggregate goals), played meetings as compact result rows linking to /game/:gameId (route-state fields preserved), upcoming meetings with dates/venues, and both teams' FormStrips side by side if E2 exists.
4. Entry points: a "Season series" link on GameDetailPage (both teams known) and on the team page schedule area, linking to /matchup with the params filled.
5. States: same team twice (prompt to pick two different teams), teams that don't meet in the loaded season (possible cross-conference in some seasons — EmptyState), season still loading.

INVARIANTS:
- Only ?season= triggers a re-fetch (via the existing context); a/b param changes are pure client-side projections.
- Date parsing via parseLocalDate; route-state fields on all game/team links; CSS modules + EmptyState.
- All series math in MatchupHelper.ts.

OUT OF SCOPE: all-time head-to-head history across many seasons at once (would need multi-season aggregation — a future ticket, possibly over the Postgres tables per ticket 2.14), player-vs-team splits, backend changes.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: a divisional matchup shows the full series correct against nhl.com; deep link with ?a=&b=&season= renders in a fresh tab; changing a team fires no network request with the season already loaded; links from a game detail page arrive pre-filled and back-navigation works.
- I have ticked this box and added a short completion note under this ticket.
```

## E4 Interactive draft lottery simulator

- [ ] **Owner:** Either | **Data:** locally computed odds — zero fetches of any kind

The app already computes draft lottery odds locally in `LeagueStandingsHelper.ts` — this ticket turns that static table into a toy fans genuinely play with: **run the lottery**. One click animates a weighted draw (who wins the #1 and #2 picks, everyone else slots by inverse standings with the NHL's max-10-spot jump rule), and a "simulate 10,000×" mode shows each team's empirical distribution of final pick positions. Pure client-side Monte Carlo — this is the kind of feature that makes a site unique, and it costs no data at all.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero fetches; no new dependencies.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E4
2. react/src/Data/Helpers/LeagueStandingsHelper.ts — the existing odds table and how league rank maps to odds (this is the single source of truth to build on, not duplicate)
3. react/src/Data/Context/StandingsContext.tsx (lottery-eligible teams = non-playoff teams, needs the same derivation the odds already use)
4. react/src/Pages/LandingPage.tsx — where the odds currently render
5. docs/frontend-backlog.md F4 — interaction styling conventions (state layers, no scale hovers)

TASK: A lottery simulator: single animated draw + N-run Monte Carlo distribution, built on the existing local odds.

STEPS (pause after each):
1. Verify the rules we implement, together, before code: two lottery draws (picks 1 and 2), odds per league rank from the existing table, a team can move up at most 10 spots (so only ranks 1–11 can win pick 1), teams not drawn slot in inverse-standings order. Write these as comments in the helper; cite that it mirrors the current NHL format and note the season it was last verified.
2. Create react/src/Data/Helpers/LotterySimulator.ts (pure, no React): drawLottery(teamsWithOdds, rng) → final pick order for one run; simulate(teamsWithOdds, n, rng) → per-team map of pickPosition → frequency. Inject the rng function (Math.random by default) so tests can pass a seeded stub — determinism matters for 2.13.
3. Single-draw UI on a /lottery route (or a section where the odds table lives — decide with me): a "Run lottery" button, a short suspense animation (reveal from pick 16 down to 1; CSS transitions, respect prefers-reduced-motion), winners highlighted. A "run again" resets.
4. Monte Carlo UI: "Simulate 10,000" renders a per-team distribution — a small horizontal stacked bar or dot matrix per team (inline SVG, tokens only) with the modal pick and % chance at #1. 10k runs of a 16-team weighted draw is trivial CPU; still, run it in one synchronous burst behind a useMemo/useState pair, not per-render.
5. States: during the regular season the odds shift daily — label the simulation "if the season ended today"; for past seasons, show the odds as of season end. Playoff teams are excluded exactly as the existing odds derivation excludes them.

INVARIANTS:
- Zero fetches; builds on LeagueStandingsHelper's existing odds — never a second odds table.
- Simulation math in LotterySimulator.ts, pure, rng-injected, unit-testable.
- Animations respect prefers-reduced-motion; colors via tokens; CSS modules.

OUT OF SCOPE: fetching real lottery results, conditional pick ownership/trades (we simulate team slots, not pick ownership — add a footnote), backend changes.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual sanity: with a seeded rng in a quick console test, 10,000 runs give the last-place team a #1 frequency within ~1.5 percentage points of its table odds; the max-jump rule is visibly respected (a mid-rank team never appears above its max jump); animation runs and reduced-motion disables it.
- I have ticked this box and added a short completion note under this ticket.
```

## E5 Season superlatives and records page

- [ ] **Owner:** Either | **Data:** already-loaded contexts — zero new fetches

A "fun facts" page derived entirely from the loaded season: biggest blowout, highest-scoring game, longest team win/point streaks, best/worst month by team, most common final score, busiest day of the season, and stat-leader superlatives already in hand (top rookie among leaders, widest gap between #1 and #2 in a category). Editorial-feeling content generated from data you already have — great landing-page teaser material and totally absent from typical stats sites.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero new fetches.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E5
2. react/src/Data/Context/ScheduleContext.tsx and Models/ScheduledGame.ts — the completed-game fields available (final scores, dates, teams)
3. react/src/Data/Hooks/useStatLeaders.ts and the leader contexts — what leader data is already loaded
4. react/src/Components/LandingPage/ — card styles to reuse
5. react/src/Data/Helpers/ScheduleHelper.ts (parseLocalDate/formatDateParam)

TASK: A /superlatives route of derived "record book" cards for the selected season, plus one teaser card on the landing page.

STEPS (pause after each):
1. Create react/src/Data/Helpers/SuperlativesHelper.ts (pure): each superlative is a small function over ScheduledGame[] returning {title, value, detail, gameId?} — biggestBlowout, highestScoringGame, longestWinStreak(perTeam → overall max), longestPointStreak, mostCommonFinalScore, busiestDay, bestTeamMonth. Compose them in one getSuperlatives(games) so adding a new fact is one function + one list entry.
2. Add leader-derived facts from already-loaded leader data (no new categories fetched): largestLeadInCategory (gap between #1 and #2), and any others the loaded shapes support — inspect the data with me first.
3. Superlatives page: a responsive card grid; each card shows the fact, the teams/players involved (logos where localTeamList has them), and links to the game (/game/:gameId, route-state preserved) or team where applicable. SeasonSelector on the page; everything re-derives on season change.
4. Landing teaser: one rotating "Did you know?" card on LandingPage pulling a random superlative (rotate on mount, not on a timer).
5. States: early season (streak/month facts need a minimum sample — hide facts below thresholds rather than showing degenerate answers), past seasons (should be the richest case), loading via existing context loading flags.

INVARIANTS:
- Zero new fetches; useMemo over context data; all math in SuperlativesHelper.ts (2.13-testable).
- Date handling via parseLocalDate; ties broken deterministically (document the rule per fact — e.g. earliest game wins ties) so tests are stable.
- Route-state fields on links; CSS modules; EmptyState for empty cases.

OUT OF SCOPE: all-time/franchise records (needs multi-season aggregation — future ticket over the Postgres tables), player game-level records (goals in a game etc. — needs boxscore sweeps we don't batch-load), backend changes.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: a completed past season shows every card with plausible values (hand-verify biggest blowout against the schedule data); the current season hides below-threshold facts; links land on the right game pages with back-navigation intact.
- I have ticked this box and added a short completion note under this ticket.
```

## E6 Milestone and pace watch

- [ ] **Owner:** Either | **Data:** already-loaded summaries/leaders — zero new fetches (career milestones deferred until 2.8's contract exists)

Project every leader and every skater in the loaded summaries to an 82-game pace, then surface the chases: who's on pace for 50 goals / 100 points / a 60-save-percentage-something season; which teams are pacing toward franchise-feeling point totals; who's within N of a within-season round number. Pure arithmetic over `player_season_stats`-shaped data already in the frontend. Career milestones (500 goals, 1,000 points) need career totals — that's ticket 2.8's player landing contract, so they're an explicit follow-up step gated on 2.8, not scope here.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero new fetches.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E6
2. react/src/Data/Hooks/useStatLeaders.ts, the leader contexts, and react/src/Services/ApiHandler.ts (GetSkaterSummary/GetGoalieSummary) — which stat fields and gamesPlayed values are already loaded, and for which player populations (league-wide leaders vs per-team summaries)
3. react/src/Data/Context/StandingsContext.tsx (team points + gamesPlayed for team pace)
4. react/src/Components/LandingPage/StatLeaderCard.tsx — card style to extend
5. docs/phase-2-backlog.md ticket 2.8 — the career-milestone dependency; do NOT build player landing fetches here

TASK: Pace projections and milestone-chase cards: player 82-game paces from loaded summaries/leaders, team point paces from standings, and a "chases" list (on pace for 50G/100P/etc.).

STEPS (pause after each):
1. Create react/src/Data/Helpers/PaceHelper.ts (pure): projectToGames(statValue, gamesPlayed, teamGamesPlayed or 82) with a documented minimum-games threshold (e.g. 10 GP) below which we return null instead of a silly extrapolation; teamPointsPace(points, gamesPlayed); milestoneChases(players, thresholds) → sorted list of {player, stat, current, pace, threshold, onPace}.
2. Decide the population with me: league-wide leader arrays cover the interesting chases (top ~10 per category); per-team summaries cover "your team's paces" on the team page. Use both where each is already loaded — never fetch a new league-wide summary just for this.
3. Chases section (landing page or a /pace route — decide together): cards like "Player X — 64 pts in 50 GP, on pace for 105", grouped by chase (50 goals, 100 points, goalie wins). Each links to the player page if 2.8 landed, else to their team page.
4. Team pace: on the team page, "on pace for N points" next to the record, with the simple math shown in a tooltip/title.
5. Season-awareness: for a completed past season, pace equals the final numbers — render as "finished with" instead of "on pace for" (check season vs getCurrentSeasonId from SeasonHelper).
6. FOLLOW-UP (record, don't build): when 2.8's PlayerProfileContract exists with career totals, add career milestone detection (within-50 of 500 goals etc.) to PaceHelper and the player page. Add that note to ticket 2.8's scope or a new ticket.

INVARIANTS:
- Zero new fetches; derive only from populations already loaded by existing contexts/pages.
- All math in PaceHelper.ts, pure, threshold-guarded, unit-testable.
- Route-state on links; tokens/CSS modules; EmptyState where a season lacks data.

OUT OF SCOPE: career milestones (gated on 2.8), new backend endpoints or stat categories, injury/games-remaining adjustments (pace is naive 82-game extrapolation — footnote it).

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: hand-verify one player's pace math; a sub-threshold player shows no projection; a past season renders "finished with"; no new network requests with contexts warm.
- I have ticked this box and added a short completion note under this ticket.
```

## E7 Rest, travel congestion, and schedule-strength badges

- [ ] **Owner:** Either | **Data:** already-loaded schedule + standings — zero new fetches

Bettors and diehards look at one thing casual apps never show: **rest**. From the loaded schedule, compute each game's rest differential (days since each team's previous game), flag back-to-backs and 3-games-in-4-nights, and summarize remaining-schedule difficulty per team (opponents' aggregate points% from standings). Surfaces as small badges on schedule cards/chips ("B2B", "2nd of B2B", "+2 rest") and a per-team congestion summary on the team page.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero new fetches.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E7
2. react/src/Data/Context/ScheduleContext.tsx and Models/ScheduledGame.ts (dates, home/away, teams per game)
3. react/src/Data/Helpers/ScheduleHelper.ts — parseLocalDate is mandatory here; rest math done in UTC would be off by a day
4. react/src/Components/SchedulePage/ScheduleCard.tsx and GameChip.tsx (badge mount points; GameChip is dense — badges must be tiny or day-view-only)
5. react/src/Data/Context/StandingsContext.tsx (opponent points% for schedule strength)

TASK: Rest/congestion derivation helper + badges on schedule views + a team-page congestion summary + remaining strength-of-schedule.

STEPS (pause after each):
1. Create react/src/Data/Helpers/RestHelper.ts (pure): buildTeamGameIndex(games) → per-triCode date-sorted game list (build ONCE per season array — this powers everything); restDays(index, triCode, game) → days since previous game (null for season opener); isBackToBack, isSecondOfBackToBack, gamesInLastNDays(index, triCode, date, n).
2. Rest differential per game: restDays(home) − restDays(away). Badge rules we agree on: "B2B" when a team plays its 2nd game in 2 nights; "+N rest" only when the differential is ≥ 2 (badge noise is the enemy — decide thresholds with me).
3. Badges on ScheduleCard (day view). GameChip (week/month) gets at most a single dot/short marker or nothing — decide together at 576px width.
4. Team page congestion summary: remaining B2B count, heaviest stretch (max games in any 7-day window), and next-week density. Derived from the same index.
5. Remaining strength of schedule: mean opponents' points% (from StandingsContext) over each team's remaining games; show on the team page and optionally as a sortable value in E1's playoff-race table if it landed.
6. States: past seasons (all games played — congestion summary becomes a season recap or is hidden; decide), early season (rest data fine from game 2 onward).

INVARIANTS:
- Zero new fetches; the per-team index builds in useMemo over the loaded season, keyed on the games array.
- Every date computation goes through parseLocalDate; never new Date("YYYY-MM-DD").
- All math in RestHelper.ts; badges are dumb renderers with tokens/CSS modules.

OUT OF SCOPE: actual travel distance/timezone modeling (venue coords aren't collected — note as a future idea), betting-style presentation, backend changes.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: find a real back-to-back in the schedule and confirm both games badge correctly; rest differential spot-checked by hand for one game; a date near a month boundary computes rest correctly (the UTC-shift trap); week/month views stay readable on mobile.
- I have ticked this box and added a short completion note under this ticket.
```

## E8 Prospect watch: draft central and rookie tracker

- [ ] **Owner:** Either | **Data:** ⚠ the exception — two small NEW NHL fetches (draft rankings + draft picks), tiny payloads, long TTL; rookie tracking reuses the existing stats client | **Pairs with:** the existing local lottery odds and E4

The requested prospect feature, shaped to fit the "don't re-hit the NHL API unless necessary" rule. Honest constraint first: there is **no good free official API for AHL/CHL/European prospect stats** (Elite Prospects' API is commercial; AHL data sits behind HockeyTech keys), so this ticket deliberately does NOT scrape unofficial sources. What the NHL API family you already use *does* offer, cheaply:

1. **Central Scouting draft rankings** (`api-web.nhle.com/v1/draft/rankings/...`) — the official pre-draft prospect rankings (NA/international skaters and goalies). Updates a handful of times per season → cache for days.
2. **Draft results** (`api-web.nhle.com/v1/draft/picks/...`) — who went where, once the draft happens.
3. **Rookie filtering on the stats REST API you already call** — nhl.com's own stats page filters rookies via the same `api.nhle.com/stats/rest` skater endpoints (`cayenneExp` rookie flag), enabling a "Rookie watch / Calder tracker" from the client you already have.

The unique hook: tie it to the **draft lottery odds already computed locally** — "If the lottery holds, YOUR team picks 3rd; the #3-ranked NA skater is …". That combination (lottery odds × official rankings) is genuinely not a thing other hobby apps do.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/, Express proxy/cache backend in api/. This ticket ADDS BACKEND ENDPOINTS — the only ticket in exciting-features-backlog.md that does. Payloads are tiny and change rarely; TTLs are long.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E8 — especially the no-scraping constraint and the lottery-odds tie-in
2. docs/architecture.md — "Backend Route Modules", "Backend Response Contracts", "Backend Caching", "Developer Conventions" (thin handlers, map after GetOrFetch, cache keys include every input)
3. api/services/nhlApiClient.js (axiosNhl and axiosNhlStats — reuse, don't create new instances), api/utils/cacheManager.js, api/services/mappers/playerMapper.js (mapper style to copy)
4. api/test/mappers.test.js and routes.test.js (test patterns to copy)
5. react/src/Data/Helpers/LeagueStandingsHelper.ts (the lottery odds to tie in), react/src/Services/ApiHandler.ts, react/src/App.tsx

TASK: A /prospects page with three sections — Draft Rankings, Rookie Watch, and "Your Pick" (lottery odds × rankings) — backed by two new long-TTL backend routes and one reuse of the existing skater stats client.

STEPS (pause after each):
1. Discovery BEFORE design (do not trust this doc's URL guesses — verify): curl https://api-web.nhle.com/v1/draft/rankings/now and (if it 404s) probe year/category variants like /v1/draft/rankings/2026/1; curl /v1/draft/picks/now or a year variant. Separately, open nhl.com/stats with its Rookie filter on and copy the api.nhle.com/stats/rest request it makes from devtools — that shows the exact cayenneExp rookie clause the skater summary endpoint accepts. Paste all three real payloads into the session; we design contracts from what actually exists.
2. Backend rankings route: GET /draft/rankings in a new api/routes/draft.js — GetOrFetch under a new CACHE_TYPES.DRAFT (add it to cacheManager's types) with a long TTL (rankings change ~monthly; 3–7 days). Cache key includes year + category if the endpoint is parameterized. Map after GetOrFetch via a new api/services/mappers/draftMapper.js → DraftProspectContract (@typedef documented): rank, name, position, height/weight if present, amateur club + league, category. Defensive fallbacks on every field.
3. Backend picks route (thin): GET /draft/picks/:year? mapped to a DraftPickContract (overall pick, round, team triCode, player name). Same caching pattern. If the rankings/picks payloads turn out to share shapes, one mapper file covers both.
4. Rookie watch: extend the EXISTING skater summary route (api/routes/player.js) with an optional ?rookie=true that adds the verified rookie clause to the cayenneExp — the cache key MUST include the rookie flag. Same for goalies if the payload supports it. No new NHL client, no new endpoint family.
5. Backend tests before frontend: mapper unit tests with trimmed fixtures (including missing-field cases), route tests asserting cache keys include year/category/rookie flag, mocked NHL clients throughout. cd api && npm test.
6. Frontend: /prospects route + ApiHandler functions. Rankings section: tabs or a select per category, ranked table. Rookie Watch: leaders among rookies (points, goals, goalie wins) with links to player pages if 2.8 landed. Clearly label rankings with their source ("NHL Central Scouting") and last-updated date if the payload carries one.
7. "Your Pick" tie-in: using the lottery odds already in LeagueStandingsHelper.ts, for each lottery team show its most likely pick slot and the prospect ranked at that slot ("If the lottery holds: #4 — <name>, <club>"). If E4's simulator landed, link to it. Label clearly as projection, not news.
8. States: post-draft (rankings stale → picks section becomes primary), off-season (no rookie stats yet), NHL endpoint missing/changed (the route 502s gracefully; the page section shows EmptyState — one dead section never blanks the page).

INVARIANTS:
- Thin handlers: validate → GetOrFetch → map → send; next(e) on errors; map AFTER GetOrFetch (cache stores raw payloads).
- Cache keys include every response-changing input; long TTLs for draft data (document the chosen TTLs in architecture.md's caching section).
- No scraping, no unofficial third-party APIs, no bulk export surface (per the architecture doc's NHL-data usage note).
- Frontend consumes contracts only; official data vs projection ("Your Pick") visually separated.

OUT OF SCOPE: AHL/junior-league live prospect stats (no free official source — revisit only if one appears), per-prospect profile pages, draft-day live updates, mock-draft user input.

DONE WHEN:
- cd api && npm test passes with the new mapper/route/cache-key tests; cd react && npx tsc --noEmit and pnpm build pass.
- Manual: rankings render for the current draft year; a second page load serves from cache (backend logs/no NHL hit); rookie leaders match nhl.com's rookie filter for one category; the "Your Pick" slot matches the team's league rank per the local odds; killing the draft route (bad URL) degrades that section to EmptyState without blanking the page.
- docs/architecture.md gains the new routes, CACHE_TYPES.DRAFT + TTLs, and contracts; I have ticked this box and added a short completion note under this ticket.
```

## E9 Pick'em: local-first game predictions

- [ ] **Owner:** Either | **Data:** already-loaded schedule — zero new fetches, no accounts, no backend | **Depends on:** the localStorage patterns of Phase 2 ticket 2.9 (favorites) — land 2.9 first or copy its versioned-storage conventions

Let the user predict winners for upcoming games, then score the picks automatically as results land in the already-loaded schedule data. Running accuracy, current streak, best streak, per-team accuracy ("you always pick against Toronto and you're usually right"). Local-first exactly like favorites: one versioned localStorage key, no accounts, no backend. Turns passive schedule browsing into a habit loop — the stickiest feature in this file for the cost of zero infrastructure.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the concept and plan before any code; then guide me step by step with small snippets I type myself. Pause after each numbered step. Do not expand scope; log unrelated findings as notes for docs/cleanup-backlog.md.

PROJECT: HockeyStatsWebApp — React (Vite, HashRouter) frontend in react/. Frontend-only; zero fetches; no accounts; no new dependencies.

READ FIRST, in this order:
1. docs/exciting-features-backlog.md section E9 and docs/phase-2-backlog.md ticket 2.9 — if FavoritesContext exists, copy its storage/versioning/guard patterns exactly; if not, this ticket establishes them and 2.9 should later copy THIS
2. docs/architecture.md — "Global Providers" (the index.tsx vs App.tsx provider-split rule)
3. react/src/Data/Context/ScheduleContext.tsx and Models/ScheduledGame.ts (gameId, gameState, scores — what scoring picks needs)
4. react/src/Components/SchedulePage/ScheduleCard.tsx (where pick controls mount) and GameChip.tsx (week/month views likely show only a tiny picked-indicator)
5. react/src/Data/Helpers/GameStatusHelper.ts (completed/future detection — picks lock at puck drop)

TASK: PicksContext (localStorage, versioned) + pick controls on upcoming games + automatic scoring from loaded results + a small "My Picks" record view.

STEPS (pause after each):
1. Storage design first: one key, versioned shape {version: 1, picks: {[gameId]: {winner: triCode, pickedAt: ISO}}}. Store ONLY the pick — correctness is always derived by joining against loaded schedule results, never stored (results can arrive late; derived scoring self-heals). Guard JSON.parse failures/unknown versions by falling back to empty. Discuss localStorage size ceiling: picks are ~60 bytes each, a full season of daily picking is a few KB — fine, but prune picks for seasons older than the last two on load.
2. PicksContext + usePicks(): {picks, setPick, clearPick, isLocked(game)}. Locked = game not in a future/pre state (or start time has passed). Placement per the provider-split rule: depends on neither routing nor season → index.tsx.
3. Pick UI on ScheduleCard for future games: two team-buttons (real <button>, aria-pressed, keyboard-friendly), tap to pick, tap again to clear, disabled+lock icon once locked. Week/month GameChips get at most a tiny picked-dot.
4. Scoring: react/src/Data/Helpers/PicksScoringHelper.ts (pure): score(picks, games) → {correct, total, pending, accuracy, currentStreak, bestStreak, perTeam}. Completed games with a stored pick are right/wrong; games without results stay pending. Unit-testable, no React.
5. "My Picks" view (a /picks route or a landing-page card — decide together): record, streaks, per-team accuracy table, and a list of pending picks with links to games (route-state preserved). Season-scoped via useSeason(); picks store globally but display filters by the loaded season's gameIds.
6. States: no picks yet (invite state on the schedule page, default landing unchanged — mirror 2.9's rule); corrupt storage → empty, no crash; a picked game missing from loaded data renders as pending, never a crash.

INVARIANTS:
- No backend, no accounts, no new dependencies; storage guarded and versioned exactly like FavoritesContext (or establishing that pattern).
- Correctness always derived at read time from ScheduleContext — never persisted.
- Picks lock at puck drop; locked picks are immutable in the UI.
- Accessible controls (buttons, aria-pressed); tokens/CSS modules; EmptyState reuse.

OUT OF SCOPE: score predictions (winner-only), leaderboards/sharing (no accounts), notifications, backend persistence.

DONE WHEN:
- cd react && npx tsc --noEmit and pnpm build pass.
- Manual: pick two upcoming games, refresh — picks persist; hand-edit one picked game's stored gameId to garbage and reload — no crash; a completed picked game scores correctly in My Picks; a locked game's buttons are disabled; keyboard-only picking works; hand-set localStorage to "not json" and reload — app renders with zero picks.
- I have ticked this box and added a short completion note under this ticket.
```

## Ideas parked (not ticketed)

Recorded so they aren't lost; each needs either data the app doesn't collect or a decision first:

- **Monte Carlo playoff odds** — full-season simulation of remaining games for real playoff probabilities. Natural E1+E4 follow-up; ticket it once E1's helper exists.
- **All-time head-to-head & franchise records** — needs multi-season aggregation; the right shape is a query over the normalized Postgres tables, so it should ride on ticket 2.14's read-side work rather than N frontend season fetches.
- **Shareable matchup/superlative cards** — canvas-render a game or fact card to a PNG for sharing. Pure frontend, but wants the MD3 visual work (F2–F6) done first so the cards look sharp.
- **Travel-distance fatigue model** — would need venue coordinates (a small static local dataset could work); parked until E7 proves people look at rest data.
- **Live prospect stats from AHL/CHL/Europe** — no free official API exists today (Elite Prospects is commercial, AHL is behind HockeyTech keys). Deliberately excluded from E8; revisit only if an official free source appears.
