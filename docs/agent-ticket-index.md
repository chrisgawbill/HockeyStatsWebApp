# Agent Ticket Index

Ticket states: IDEA, READY, ACTIVE, BLOCKED, DONE. Tickets remain IDEA until the
Product Owner explicitly promotes or starts one. `Start <ticket>` authorizes only
that ticket.

Opening Night 2.0 direction is in `opening-night-2-design.md`. Read the shared
delivery contract, the selected ticket's checkpoint row and block, and the design
headings named by that ticket.

## Delivery contract for every ticket

Follow [agent-development.md](agent-development.md) for delegation, model
routing, context limits, worker contracts, and verification ownership. Use the
smallest team that satisfies the ticket's risk and acceptance criteria.

The PM owns the reasoning: define rules, edge cases, worker scope, and expected
checks. Workers implement and verify that contract; they do not make unresolved
product decisions. Bring the human concrete options and a recommendation at the
checkpoints below, reuse existing approvals, and record decisions in the ticket
or design before affected implementation. QA evidence and required human
acceptance are both necessary for DONE.

| Ticket | Human decision or review checkpoint |
| --- | --- |
| ON2-01 | Initiative, stoppage/reset behavior, stunned or unavailable skaters, and an example complete shift. |
| ON2-02 | Diagonal pressure/corner rules and a movement example; playtest range changes. |
| ON2-03 | Unplayed-card lifecycle, exhausted/undersized pools, and hidden CPU commitment behavior. |
| ON2-04 | Proposed card list, identity strengths, weaknesses, and functional budgets. |
| ON2-05 | Net-front eligibility, screen expiry on turnovers, and initial save penalty. |
| API-ON2-01 | Rivalry pairs, tiers, and shared read contract. |
| API-ON2-02 | Profile fields, supported vocabularies, and pilot records. |
| ON2-06 | Archetype passives/signatures, compatible roles, CPU star choice, and sparse-data behavior. |
| ON2-07 | Daily weights, repeat window, fallback behavior, and Rivalry Night frequency. |
| ON2-08 | Pilot teams and each team's/player's content before enablement. |
| ON2-09 | Setup flow and star-choice presentation before visual implementation. |
| ON2-09A | Review arena prototype, tactical/close views, phone evidence, device target, and rendering-failure behavior; decide whether to migrate. |
| ON2-10 | Apply the ON2-09A decision; portrait/landscape layout and broadcast treatment, then rendered review. |
| ON2-11 | Readable hand/battle mockup, then touch and keyboard interaction review. |
| ON2-12 | Ordinary/rivalry reveals, pregame/faceoff/shot/goal camera examples and durations, and reduced-motion treatment. |
| ON2-13 | Simulation protocol and material-advantage threshold before evaluation; final playtest and release acceptance. |
| AAR-01 | Product Owner review of favorite star, header bell/inbox, report wording, and browser-alert opt-in on a real deploy. |
| AAR-02 | PWA vs. React Native, alert timing after the final horn, and the external scheduler before any push work. |
| API-LINES-01 | Approved: real lines from NHL shift charts, NHL calls batched/cached (see block). |
| TEAM-LINES-01 | Approved: "Line Change" rink strips + Forwards/Defense/Goalies tab row; Product Owner reviews screenshots. |
| API-WPR-01 | Approved 2026-10-19: Monday 9:00 ET, zero-league-games break, proposed stat lines, 10-player cap, one on/off switch (see block). |
| WPR-01 | Approved 2026-10-19: reusable star headshot, proposed inbox/report design, best-performer wording; screenshots for Product Owner acceptance. |
| HOME-FAV-01 | Started 2026-10-20 with PM-recommended layout (see block); Product Owner reviews 375/1280 screenshots. |
| API-FAN-01 | Approved 2026-10-20: tiers Diehard/Fan/Curious + optional label on teams and players, display only (see block). |
| FAN-01 | Approved 2026-10-20: teams row above players, sorted by tier; Product Owner reviews the category menu and rows in screenshots. |
| HOME-LEAD-01 | Approved 2026-10-21: Option B (FavoriteCard in a 2×2 grid, Skaters/Goalies switch on phones); accepted from 375/1280 screenshots 2026-10-21. |
| HOME-LEAD-02 | Approved 2026-10-21: swipe the phone stat leader grid to switch Skaters/Goalies (left = next, no wraparound); Product Owner reviews on device. |
| HOME-LOTTERY-01 | Approved 2026-10-21: Option A — draft lottery uses the landing page heading, button and card styles; gold kept for the top bulb strip, odds, winners and reveal; light-mode support. Accepted from 375/1280 light/dark screenshots 2026-10-22. |
| STAR-01 | Approved 2026-10-21: starred PlayerHeadshot on the leaderboard dialog (Pos hidden ≤576px) and scoring summary; box score gets a bare star, no photos. |
| NAV-01 | Approved 2026-10-21: Option A — tighter pill padding and gaps at 1001–1199px, labels unchanged; accepted from 1001/1024/1200 screenshots 2026-10-21. |
| FEED-01 | Approved 2026-10-21: /my-hockey page plus an "Up next" strip on home (right-hand column on desktop); Up next / Last results / Your players; games by time, players by tier; hard cap of 5 favorite teams (API); season + last-game player lines. Accepted from screenshots 2026-10-22. |
| FEED-02 | Approved 2026-10-22: Option A — Your teams and Your players rows move from home to the top of /my-hockey; the player row and the feed's player list merge into one card row (season + last-game lines on each card); home keeps only the Up next strip; Up next rows show the opponent logo right after the matchup. Pending Product Owner acceptance. |
| PREVIEW-01 | Approved 2026-10-22: previews use /matchup (not the game page) with a Team DNA card per team; every game card links through one routing helper (future → /matchup, live/final → /game) and /game/:id redirects games that have not started; phones switch between the two DNA cards; the puck-drop chip turns into a game-page link at the start time (local timer, no polling); TeamDna/FormStrip move to `components/` and take the team color. Lines, goalies and the team comparison are dropped. Pending Product Owner acceptance. |
| COMPARE-01 | Approved 2026-10-22: option A data (API-COMPARE-01); Compare button in `PlayerStatsDialog` only; PPG = points per game; PM's call on presentation: table only, GP unmarked, ties at displayed rounding. Product Owner reviews 375/1280 light/dark screenshots. |
| API-COMPARE-01 | Approved 2026-10-22 (option A): league-wide summaries return every player; contract adds team, shots, S%, PP goals. |
| API-CACHE-01 | Serve-stale behaviour (on NHL error, and while refreshing), past-season TTL, and whether an in-memory layer is needed. |
| HOME-LOAD-01 | Per-section loading and error states on home, and what a failed section shows. |
| API-PBP-01 | Play-by-play contract, coordinate normalization, and cache TTLs. |
| GAME-SHOTS-01 | Shot map and game flow designs from mockups; filters and phone layout. |

## Dependency outline

```text
ON2-01 -> ON2-02, ON2-03
ON2-03 -> ON2-04
ON2-02 + ON2-03 + ON2-04 -> ON2-05
ON2-04 + API-ON2-02 -> ON2-06
API-ON2-01 + API-ON2-02 -> ON2-07
API-ON2-01 + API-ON2-02 + ON2-04 + ON2-06 + ON2-07 -> ON2-08
ON2-06 + ON2-07 + ON2-08 -> ON2-09
existing rules -> ON2-09A prototype (may run before ON2-01)
ON2-01 + ON2-02 + ON2-05 + ON2-09 + ON2-09A decision -> ON2-10
ON2-03 + ON2-04 + ON2-10 -> ON2-11
ON2-07 + ON2-10 + ON2-11 -> ON2-12
approved implementation/content release set -> ON2-13
WPR-01 -> STAR-01, FEED-01, COMPARE-01
API-COMPARE-01 -> COMPARE-01
FAN-01 -> FEED-01
API-LINES-01 -> PREVIEW-01
API-PBP-01 -> GAME-SHOTS-01
```

ON2-09A may run early using the existing game; it gates production presentation
work, not 2.0 rules or team-content delivery. Existing ticket IDs are preserved.
Recording this direction does not start implementation tickets.

`API-*` tickets are backend-owned dependencies for the independent
HockeyStatsAPI repository. Copy/adapt them to that repository's workflow before
implementation; starting them here does not authorize backend edits.

---

## ON2-01 — Alternating shift activation engine

**Status:** IDEA

**Goal:** Replace dice/shared movement points with symmetric alternating
three-activation shifts and move-plus-action turns.

**Read:** design “Alternating shifts” and “Balance and fairness”; board-game
state, reducer, board actions, selectors, hook, and focused tests.

**Dependencies:** none.

**Scope:**

- Remove `ROLL_DICE`, dice state, MP gating, and movement-roll UI.
- Track initiative, activating team, per-team activations remaining, and skaters
  already activated this shift.
- Permit optional movement followed by at most one legal action; an action or
  triggered battle completes that activation.
- Reset eligibility after both teams receive three activations.
- Implement the human-approved initiative, stoppage, and skipped-activation
  rules; document how existing stuns and faceoffs fit the new economy.
- Adapt the minimum CPU loop needed to alternate legally.
- Preserve seeded faceoff, shot, card, whistle, and game-over behavior.

**Acceptance:**

- User and CPU strictly alternate without deadlock.
- A non-goalie cannot activate twice in one shift.
- Movement plus one action is legal; a second action is rejected.
- Passing does not activate the receiver.
- Possession changes and battles resume at the correct next activation.
- No movement roll or MP remains in state or match UI.
- Reducer tests cover shift reset, pass, shot, check, possession change, stun,
  and inability to act.

**Exclusions:** diagonal/ranged movement, screens, new cards, visual redesign,
team data.

**Verify:** targeted engine tests, full board-game tests, typecheck, build.

---

## ON2-02 — Ranged diagonal skating and pass lanes

**Status:** IDEA

**Goal:** Make positioning faster and more hockey-like with bounded diagonal
movement and a defensive-zone defenseman perk.

**Read:** design “Movement”; rink geometry, formations, selectors, board actions,
CPU board agent, rink UI, and focused tests.

**Dependencies:** ON2-01.

**Scope:**

- Generate legal paths up to two tiles using eight-direction movement.
- Prevent paths through occupied/unplayable tiles; define diagonal adjacency
  consistently for pressure, checks, and dekes.
- Allow a defenseman up to three tiles only when the entire path remains in that
  player's defensive zone.
- Support unobstructed horizontal, vertical, and straight diagonal passes.
- Update CPU path selection for the same geometry and ranges.
- Make destination/path highlights clear without redesigning the match shell.

**Acceptance:**

- User and CPU obey identical geometry and range rules.
- Defensemen cannot carry the defensive-zone boost into other zones.
- Pieces cannot pass through one another or cut unplayable corners.
- Diagonal pressure/check/deke behavior is unambiguous and tested.
- CPU completes legal turns without oscillation or action-cap reliance.
- Keyboard and touch destination selection remain operable.

**Exclusions:** arbitrary-angle passes, goalie movement, screens, team movement
bonuses.

**Verify:** rink/selector/AI tests, full board-game tests, phone/desktop browser
smoke, typecheck, build.

---

## ON2-03 — Contextual card contracts and offers

**Status:** IDEA

**Goal:** Ensure every battle draws a small hand of cards that make hockey sense
for that battle and participant side.

**Read:** design “Card system”; card types/data, deck, duel, CPU duel policy,
CardView/DuelScreen only as needed, and focused tests.

**Dependencies:** ON2-01.

**Scope:**

- Represent eligibility by battle context and participant side.
- Draw three eligible cards for ordinary battles; retain shot choose-one offers
  and faceoff offers, including the center's fourth option.
- Keep ineligible cards in their piles and safely reshuffle eligible discards.
- Define unplayed-offer handling and undersized eligible pools under the
  approved lifecycle; never duplicate cards or resurrect exhausted cards.
- Apply identical filters, energy, discard, and exhaust rules to user and CPU.
- Reclassify existing cards into valid contexts without expanding the library.
- Keep exact CPU commitments hidden while exposing broad intent.

**Acceptance:**

- No participant receives a contextually impossible card.
- Seeded offers cannot deadlock when eligible draw piles empty.
- User/CPU tests prove symmetric offers and energy accounting.
- Flexible cards used in one context follow normal discard/reshuffle rules.
- Shot and faceoff timing regressions pass.

**Exclusions:** new card content, team packages, signature cards, presentation
redesign.

**Verify:** card/deck/duel/shot/faceoff/CPU tests, full board-game tests,
typecheck, build.

---

## ON2-04 — Hockey card library and identity packages

**Status:** IDEA

**Goal:** Expand the playbook into balanced situational hockey actions and define
reusable team-identity packages.

**Read:** design “Hockey meaning” and “Playbook composition”;
card/balance data and effect helpers.

**Dependencies:** ON2-03; Product Owner approves the proposed card list and
package tradeoffs.

**Scope:**

- Add the smallest useful set for puck-carrier, challenger, passing,
  interception, net-front, shot, and faceoff decisions.
- Lead with pressure/resistance/poise language rather than damage/block.
- Define universal core plus Rush Attack, Possession Cycle, Heavy Forecheck,
  Net-Front Pressure, Structured Defense, and Counterattack packages.
- Give packages comparable card counts and functional budgets with stated
  strengths and weaknesses.
- Add only effects supported by current state or explicitly tested here.
- Reserve signature-card templates for ON2-06.

**Acceptance:**

- Every card has valid participant contexts and concise hockey copy.
- Every ordinary context has enough eligible cards for varied offers.
- No card is dominated at the same cost/context without situational reason.
- Every package replaces equivalent slots and declares a tradeoff.
- Deterministic tests cover each effect and package composition.

**Exclusions:** team assignments, bespoke team cards, player ratings, card UI.

**Verify:** card/effect/package tests, full board-game tests, typecheck, build,
Product Owner content review.

---

## ON2-05 — Screens and Clear Crease battles

**Status:** IDEA

**Goal:** Add one meaningful off-puck setup and its symmetric defensive counter.

**Read:** design “Off-puck play and screens”; rink zones, actions, duel/card
contracts, shot-save model, reducer, and focused tests.

**Dependencies:** ON2-02, ON2-03, and approved net-front cards from ON2-04.

**Scope:**

- Define net-front eligibility and screen state.
- Let an eligible forward spend its action to Set Screen.
- Let an eligible defenseman spend its action to Clear Crease through a card
  battle.
- Remove screens on movement, successful clear, zone-possession exit, or stoppage.
- Apply at most one small visible save-chance modifier.
- Give CPU the same setup/clear capabilities with a minimal legal heuristic.

**Acceptance:**

- Both sides set and clear screens under identical rules.
- A screen costs an activation and cannot stack.
- Every removal/reset condition is tested.
- Shot explanation shows the exact modifier and remains clamped.
- CPU neither ignores every screen nor receives automatic clears.
- No bundle of extra timing/power/rebound/poise modifiers is added.

**Exclusions:** tips, deflections, multiple screens, goalie interference, team
screen bonuses.

**Verify:** action/duel/shot/reducer/CPU tests, full board-game tests, typecheck,
build.

---

## API-ON2-01 — Site-wide rivalry records and contract

**Status:** IDEA — backend-owned dependency

**Goal:** Provide one normalized source of traditional team rivalries for Rink
Quest and later site-wide consumers.

**Owner:** HockeyStatsAPI repository.

**Dependencies:** Product Owner approves initial rivalry records.

**Scope:**

- Add an unordered relation with team A/B foreign keys, primary/secondary tier,
  optional display name, and enabled state.
- Enforce no self-pairs and no reversed duplicate.
- Expose a normalized read contract not tied to the board game.
- Seed only Product Owner-reviewed relationships.

**Acceptance:**

- Lookup from either team returns the same relationship.
- Constraints reject self and reversed duplicates.
- Unknown/disabled rivalries are explicit, not fabricated.
- Tests cover zero, one, and multiple rivalries per team.
- Existing migration/API verification passes.

**Exclusions:** series statistics, automated inference, frontend presentation.

---

## API-ON2-02 — Rink Quest team and player profiles

**Status:** IDEA — backend-owned dependency

**Goal:** Link reviewed Rink Quest identities to canonical teams and players
without duplicating factual records.

**Owner:** HockeyStatsAPI repository.

**Dependencies:** Product Owner approves vocabularies and pilot records.

**Scope:**

- Team profile keyed to canonical team ID: primary identity, optional secondary
  identity, enabled state.
- Player profile keyed to canonical player ID: primary archetype, appearance
  rank, enabled state.
- Join canonical name, position, current team, and headshot in read contracts;
  do not copy them into profile tables.
- Return enabled active-roster candidates by team.
- Validate supported identity, archetype, and rank values.

**Acceptance:**

- Trades affect team eligibility through canonical roster membership while the
  player's profile persists.
- Missing headshots are nullable.
- Disabled/non-roster profiles are ineligible.
- Contracts expose stable IDs without engine details.
- Migrations, contract tests, and existing API checks pass.

**Exclusions:** automatic inference, secondary player archetypes, gameplay
ratings, full-line construction.

---

## ON2-06 — Team playbook and featured-star integration

**Status:** IDEA

**Goal:** Build match configuration from normalized profiles while keeping
external data out of the pure engine.

**Read:** design “Teams, rivalries, and featured players”; board-game API
boundary, types/data, initial state, card packages, and focused tests.

**Dependencies:** ON2-04 and API-ON2-02.

**Scope:**

- Add a feature API adapter for enabled team/player profiles.
- Compose each side's core, primary, secondary, and featured-star playbook.
- Map the star to a compatible role; retain only ID, archetype, role, and
  mechanical template in match state.
- Guarantee its signature card in the first relevant offer, then use normal deck
  rules.
- Select daily candidates deterministically, preferring three archetypes and
  avoiding exact prior-day repetition when possible.
- Select one eligible CPU star reproducibly under the same budget.
- Provide explicit loading, unavailable, and fallback outcomes.

**Acceptance:**

- Engine/data layers make no network calls and contain no headshot URLs.
- Playbooks are reproducible and cover all required contexts.
- Candidate choices are stable for date/team and never invent players.
- Same-archetype players share mechanics regardless of appearance rank.
- Signature cards are guaranteed once, then obey normal piles.

**Exclusions:** selection UI, bespoke ratings, automatic classifications, full
real-world lines.

**Verify:** adapter doubles, playbook/candidate/initial-state tests, full
board-game tests, typecheck, build.

---

## ON2-07 — Daily opponent and Rivalry Night selection

**Status:** IDEA

**Goal:** Provide varied deterministic matchups with scheduled opponents,
traditional-rival weighting, recent-repeat avoidance, and manual override.

**Read:** design “Opponent selection” and “Site-wide rivalries”; schedule API
boundary, board-game feature API/data, and daily persistence.

**Dependencies:** API-ON2-01 and API-ON2-02 for enabled team eligibility.
Reuse schedule data without importing another
feature's UI/domain internals.

**Scope:**

- Resolve today's scheduled opponent when normalized data provides one.
- Otherwise choose a seeded daily opponent using approved geographic/rivalry
  weights and bounded recent history.
- Mark primary-rival selections as Rivalry Night.
- Provide stable fallback and manual override.
- Limit every route to enabled playable opponents, excluding self; skip
  unavailable scheduled opponents and show an unavailable state for an empty pool.
- Persist only minimum recent-selection data; require no account.

**Acceptance:**

- Reloads preserve the matchup for local date/team.
- Scheduled opponents take priority without direct NHL calls from the frontend.
- Generated matchups avoid recent repeats when alternatives exist; real schedule
  priority can repeat an opponent. History updates do not reroll today's choice.
- A rival is special but not the permanent default.
- Manual selection works; Rivalry Night uses canonical data only.
- Missing schedule/rivalry data still yields a valid matchup when an eligible
  opponent exists; an empty pool produces an explicit unavailable state.

**Exclusions:** rivalry bonuses, historical series, notifications.

**Verify:** seeded selection/fallback/date tests, adapter tests, full board-game
tests, typecheck, build.

---

## ON2-08 — Product Owner team-content pilot

**Status:** IDEA

**Goal:** Prove the identity/playbook/star model with a small set of contrasting,
reviewed teams before league-wide entry.

**Read:** design “Product Owner content gates”; API contracts, identity packages,
rivalry contract, and candidate output.

**Dependencies:** API-ON2-01, API-ON2-02, ON2-04, ON2-06, ON2-07.

**Scope:**

- Product Owner chooses pilot teams; this ticket infers none.
- Team choices and provisional reviews may happen earlier to supply approved
  API pilot records; final enablement waits for this ticket's verification.
- Record approved identities, tradeoff, CPU tendency, rivals, and matchup copy.
- Review relevant roster players by canonical ID, archetype, appearance rank,
  compatible role, and enablement.
- Seed profiles through the backend's supported content path.
- Produce candidate/playbook reports for acceptance.
- Generate bounded follow-up content tickets for additional approved teams; do
  not silently enable the league.

**Acceptance:**

- Every enabled pilot team passes the team/player review checklist.
- Each produces a valid playbook and three choices when roster data permits.
- No unreviewed inferred data becomes enabled.
- Pilot matchups feel different without unequal action economies.
- Product Owner signs off before expansion.

**Exclusions:** all-team bulk inference, UI work, unrelated tuning.

**Verify:** backend seed/contract checks, candidate/playbook report, targeted
simulations, Product Owner review.

---

## ON2-09 — Pregame team, matchup, and star flow

**Status:** IDEA

**Goal:** Replace the utility game-length picker with a setup that communicates
team identity and produces a complete match configuration.

**Read:** design “Player journey”; board-game page/pregame components, ON2 API
adapters, and match configuration.

**Dependencies:** ON2-06, ON2-07, approved ON2-08 pilot content.

**Scope:**

- Add enabled-team selection with identity and visual information.
- Present default opponent/Rivalry Night with manual override.
- Present three daily star/game-plan cards with headshot fallback, archetype, and
  concise mechanical meaning.
- Add broadcast matchup card with both systems, stars, and one coaching key.
- Keep game-length choice only if meaningful; invent no clock/period system.
- Produce one validated match configuration.

**Acceptance:**

- Team, opponent, rivalry, and star choice are understandable before starting.
- Missing profile/headshot/schedule data is clear and recoverable.
- Same-day offers are stable; manual opponent choice remains available.
- Flow works at 390×844 and desktop without horizontal overflow.
- Keyboard, accessible names, and 44px touch targets pass.

**Exclusions:** match-shell redesign, league-wide content, accounts.

**Verify:** component tests with doubles, typecheck, build, browser QA in both
themes at phone/desktop sizes.

---

## ON2-09A — Dimensional arena and camera prototype

**Status:** IDEA

**Goal:** Evaluate React + Three.js for a tactical rink inside a stylized arena
before committing to production migration.

**Read:** design “Dimensional arena and camera direction” and “Accessibility and
performance”; architecture board-game invariant; RinkBoard, RinkOverlay,
useBoardGame, coordinate mapping, and current shot presentation.

**Dependencies:** existing playable game; no ON2 implementation prerequisite.

**Scope:**

- Build one playable rink/simple arena with tactical and close shot cameras;
  use simple tokens or illustrated cutouts.
- Reuse the reducer, legal actions, seeded rules, and CPU policy. Keep cards,
  scoreboard, and timing controls in React/HTML; do not add another game engine.
- Demonstrate selection, legal movement, and a shot-view transition; settle the
  camera before timing and restore the tactical view before the next board action.
- Demonstrate touch, keyboard/focus, accessible labels, responsive sizing, and
  static reduced-motion views.
- Measure load cost and rendering/input responsiveness on an identified phone
  or device profile; record limitations and distinguish emulation from hardware.

**Acceptance:**

- Tiles, occupancy, selection, and legal destinations remain clear at 390×844,
  landscape, and desktop sizes.
- Camera transitions do not interfere with selection or consume timing windows.
- Identical actions/seed produce identical rule outcomes across camera views.
- Product Owner reviews the playable prototype and evidence, then records a
  migration decision, visual treatment, device target, and rendering-failure
  behavior before production integration.
- Rejection records an approved current-renderer fallback direction for ON2-10;
  completing the prototype alone does not authorize production migration.

**Exclusions:** full migration, complete broadcast sequences, new gameplay,
realistic player models, bespoke team arenas, sound, and haptics.

**Verify:** focused rule/presentation checks, typecheck, build, browser QA for
phone portrait/landscape and desktop, keyboard, reduced motion, and measured
performance; Product Owner visual review and recorded decision.

---

## ON2-10 — Fullscreen broadcast match shell and arena integration

**Status:** IDEA

**Goal:** Present the rink as a focused responsive game with persistent broadcast
scoreboard and contextual coaching controls.

**Read:** design “Presentation” and “Responsive layouts”; BoardGame/Page,
RinkBoard, HUD, navigation/chrome, and theme tokens.

**Dependencies:** ON2-01, ON2-02, ON2-05, ON2-09, recorded ON2-09A decision.

**Scope:**

- Apply ON2-09A: integrate the accepted Three.js rink/arena with React/HTML
  controls, or the explicitly approved current-renderer fallback.
- Preserve the rules/CPU boundary; implement responsive coordinate picking,
  accessible selection/focus, renderer cleanup, and approved rendering-failure
  behavior. Keep the tactical camera stable during board input.
- Hide site chrome during a match and provide accessible pause/exit.
- Add team-logo/abbreviation/score scoreboard with possession, shift, initiative,
  and remaining activations; no fake clock.
- Replace MP/turn HUD with selected-skater context and legal actions.
- Support portrait stack and enhanced landscape/desktop layout.
- Avoid unnecessary document scrolling; allow content-region scrolling on short
  screens or enlarged text so safe areas, zoom, and controls remain usable.
- Apply team identity without reducing rink/token contrast.

**Acceptance:**

- Full loop works at 390×844 without rotation or tiny controls.
- Landscape/desktop use width without changing rules.
- Scoreboard remains visible in board, battle, faceoff, and shot states.
- Player, movement, actions, possession, and activation state are clear.
- Site chrome returns on exit and focus is preserved.
- Arena detail preserves readability and the ON2-09A device target; repeated
  entry/exit releases renderer resources.
- Canvas and accessible controls select the same engine coordinates in both
  orientations; rendering failures follow the approved behavior.

**Exclusions:** card-hand redesign, rivalry collision animation, broadcast camera
sequences (ON2-12), clock mechanics.

**Verify:** component tests, typecheck, build, browser interaction/screenshot QA at
phone, landscape, and desktop sizes in both themes.

---

## ON2-11 — Physical hand and battle stage

**Status:** IDEA

**Goal:** Replace tiny wrapped button cards and the stacked duel form with a
readable physical hand and single responsive battle stage.

**Read:** design “Responsive layouts,” “Battle stage,” and accessibility;
CardView, DuelScreen, reveal/queue components and styles.

**Dependencies:** ON2-03, ON2-04, ON2-10.

**Scope:**

- Redesign cards around readable cost, name, icon/art slot, concise effect, and
  role/star modifier; raw tags become secondary or disappear.
- Present three cards as a fanned hand with selected-card lift/expansion and an
  explicit commit control.
- Present participants, poise, calls, energy, hand, and Reveal in one stage.
- Keep cards/controls in React/HTML over the arena with readable contrast and
  correct focus/pointer handling across the rendering boundary.
- Move committed cards into call slots instead of duplicate card rows.
- Support multiple commitments and four-card faceoff offers without tiny text or
  required drag gestures.

**Acceptance:**

- Card copy uses the readable app scale, not current sub-10px typography.
- A complete battle fits at 390×844 at default text size with scoreboard visible;
  short screens and enlarged text retain readable, reachable controls via scrolling.
- Tap/select/commit, keyboard, focus, disabled reasons, removal, and reveal are
  accessible.
- CPU exact calls remain hidden while broad intent is understandable.
- A card is not duplicated in hand and call slot.

**Exclusions:** rivalry animation, commissioned art, new mechanics.

**Verify:** component/interaction tests, typecheck, build, browser QA for normal,
four-card, disabled, multi-commit, reveal, and narrow-height states.

---

## ON2-12 — Broadcast moments and Rivalry Night clash

**Status:** IDEA

**Goal:** Give ordinary and rivalry matches concise presentation without delaying
play or changing outcomes.

**Read:** design “Rivalry animation,” “Dimensional arena and camera direction,”
and reduced motion; accepted ON2-09A decision, match shell,
battle/reveal stage, matchup, and final presentation.

**Dependencies:** ON2-07, ON2-10, ON2-11.

**Scope:**

- Implement approved brief pregame sweep, faceoff/shot close views, and goal
  celebration view using ON2-10; review examples and durations with the Product
  Owner before implementing affected sequences.
- Settle the camera before timing, hold it during challenges, and restore the
  tactical view before board actions. Provide skippable intros/celebrations and
  immediate static reduced-motion equivalents.
- Add ordinary glide/settle/flip reveal.
- Add rivalry team-color slide, restrained clash/ice impact, rebound, and reveal
  within the approved duration.
- Make animation skippable; game resolution never waits on it.
- Add compact rivalry scoreboard/matchup/final treatments.
- Implement static reduced-motion equivalents.
- Use transform/opacity for HTML cards and the accepted renderer for arena
  effects; reuse assets/tokens and add no second rendering engine.

**Acceptance:**

- Rivalry and ordinary results match mechanically for the same seed.
- Repeated reveals remain responsive and skippable.
- Reduced motion communicates states immediately.
- Browser QA finds no rapid flash, layout shift, blocked input, or phone
  performance regression.
- Rivalry treatment appears only from canonical enabled data.
- Normal, skipped, and reduced-motion sequences preserve outcomes and complete
  timing windows; cameras stay still during decisions and timing input.
- Arena sequences meet the ON2-09A device target and Product Owner visual review.

**Exclusions:** sound, haptics, rivalry bonuses, long cinematics, replay viewer,
realistic player animation, and bespoke team arenas.

**Verify:** deterministic state tests, typecheck, build, phone/desktop performance
and visual QA with normal/reduced motion.

---

## ON2-13 — Coach's Report and 2.0 release gate

**Status:** IDEA

**Goal:** Prove the complete loop is understandable, fair, responsive, and
replayable before calling Opening Night 2.0 complete.

**Read:** approved design and implemented ON2 outcomes; engine event/state data.

**Dependencies:** all implementation/content tickets required for the Product
Owner's approved release set.

**Scope:**

- Add Coach's Report using existing events: final score, decisive tactical
  moment, star impact, battle/faceoff results, and one observation.
- Add rematch, change star, change team, and a decisive-play summary where event
  data exists; a replay viewer is out of scope.
- Run seeded symmetric simulations across enabled systems/archetypes for
  initiative advantage, win rates, length, shots/goals, battles, and distinct
  skater activation.
- Run human phone/desktop playtests for timing, comprehension, readability, pace,
  and fun.
- Tune only measured problems and record supported teams and known limits.

**Acceptance:**

- Complete flow works from team selection through report and rematch/change.
- No side/system/archetype has an unexplained material advantage under the
  agreed protocol.
- Matches meaningfully use multiple skaters rather than one carrier/chaser.
- Portrait, landscape, desktop, keyboard, screen reader, reduced motion, and both
  themes pass the browser matrix.
- Arena/camera behavior passes the accepted device target, rendering-failure
  behavior, repeated entry/exit, skip, and timing-window checks.
- Product Owner accepts supported content, match feel, and known limitations.

**Exclusions:** unreviewed teams, multiplayer, progression economy, clock
redesign, speculative analytics infrastructure.

**Verify:** full tests/typecheck/build/format; documented simulation report;
selective browser evidence; Product Owner playtest acceptance.

---

## AAR-01 — Favorite teams and After Action Report inbox

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

---

## AAR-02 — Mobile push for After Action Reports

**Status:** ACTIVE — implemented and QA-verified; awaiting Product Owner acceptance on a real phone

**Goal:** Ping a user's phone when a favorite's After Action Report is ready,
even with the site closed. Tapping the notification opens `#/game/<gameId>` and
marks the report read.

**Approved decisions (Product Owner, 2026-10-19):**

- Installable PWA with Web Push (not React Native). Android Chrome works
  directly; iOS 16.4+ only after Add to Home Screen, then sign-in and opt-in
  inside the installed app (its storage is separate from Safari).
- Target delay ~10–25 minutes after the final horn: GitHub Actions cron in the
  API repo every 10 minutes, 16:00–08:59 UTC. The workflow checks the public NHL
  scoreboard first and calls the API only when a game is live or recently final,
  so Render/Neon wake only on game nights. The dispatch bypasses the 10-minute
  current-week cache.
- Per-team push mute (inbox still shows muted teams' reports). A game whose
  favorites are all muted is recorded as handled, so unmuting later never pushes
  it. No quiet hours.
- Generated "HS" app icon (192, 512, maskable, Apple touch).
- One notification per game (tag per game). With push on, that device's
  tab-only browser alerts are off to avoid duplicates.
- Opt-in pushes nothing old: subscribing records every report currently in the
  user's inbox as already pushed. A dispatch also skips read reports and games
  that started more than 12 hours ago.
- Sign-out removes that device's subscription. Subscriptions otherwise outlive
  the 30-day session. Each push carries a single-purpose read token, so tapping
  it marks the report read even after the session expired.
- AAR-01 accepted, so AAR-02 builds on `main`.

**API contract (HockeyStatsAPI):**

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/push/config` | none | `{ enabled, publicKey }`; `enabled` false and `publicKey` null when VAPID env is unset |
| `POST /api/push/subscriptions` | session | Body is `PushSubscription.toJSON()` (`endpoint`, `keys.p256dh`, `keys.auth`). Upsert by endpoint to the caller, seed the sent ledger with current reports; 204 |
| `DELETE /api/push/subscriptions` | session | Body `{ endpoint }`; deletes only the caller's row; 204 |
| `PUT /api/favorites/:triCode/push-mute` | session | Body `{ muted: boolean }`; returns `{ favorites }` |
| `POST /api/push/read` | read token | Body `{ token }`; marks that user's game read; 204 (401 on bad token) |
| `POST /api/push/dispatch` | `Bearer CRON_SECRET` | Computes and sends new pushes; `{ users, sent, removed }`; 401 bad secret, 503 when unconfigured |

Favorites gain `pushMuted: boolean`. Push payload JSON:
`{ title, body, gameId, tag: "aar-<gameId>", readToken }`. Read tokens are JWTs
signed with `SESSION_JWT_SECRET`, `{ purpose: "aar-read", sub, gameId }`,
30-day expiry, and are rejected as session tokens (and vice versa). A game
pushes only when at least one of the user's favorites in it is unmuted. The
ledger row is claimed before sending so concurrent dispatches cannot double
send; 404/410 from a push service deletes that subscription. Migration 004 adds
`push_subscriptions`, `after_action_report_pushes`, and
`favorite_teams.push_muted`. New env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, `CRON_SECRET`; GitHub secrets `CRON_SECRET`, `AAR_PUSH_API_URL`.

**Frontend:** manifest + icons; hand-written `public/sw.js` (push and
notificationclick only, no fetch caching) registered at
`BASE_URL + "sw.js?api=<VITE_API_URL>"` with scope `BASE_URL`; notification click
posts the read token, focuses or opens `<scope>#/game/<gameId>`, and tells open
tabs to refresh the inbox; opt-in, iOS install hint, and per-team mute in the
bell inbox next to the browser-alerts button.

**Dependencies:** AAR-01 (DONE).

**Verification:** API (`963dcde`): 126 unit tests; QA ran the real server on
real Postgres 16 against a local fake push service with mocked NHL data. It
covered opt-in seeding, a decrypted payload matching the contract, single send
under concurrent dispatches, the 12-hour/read/mute filters, 410 cleanup, read
tokens in both directions, dispatch auth, and the cron script's
dispatch/fail-open/exit codes. Frontend (`fdab3e9`): 324 unit tests (including
the service worker click order), tsc, build. QA ran Playwright with the API and
NHL mocked and a stub PushManager. It covered the manifest/icons/service worker
scope, signed-out, on/off, mute, disabled, denied, the iOS hint, sign-out
cleanup (also when the DELETE fails), browser-alert suppression, SW messages,
the AAR-01 inbox, and 375px light/dark. Not verifiable here: a real OS
notification tap, real push services, iOS Safari, and the GitHub cron run.

**Deploy steps:** (1) `npx web-push generate-vapid-keys`; set `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` address) and a random
`CRON_SECRET` on Render. (2) In HockeyStatsAPI repo secrets set `CRON_SECRET`
(same value) and `AAR_PUSH_API_URL` (the Render origin). (3) Merge the API first
(start applies migration 004), then the frontend. The cron only runs from
`main`; GitHub disables scheduled workflows after 60 days without commits, so
re-enable it each October.

**Acceptance:** Product Owner installs the site on a phone (Android, or iPhone
via Add to Home Screen), signs in there, turns on phone notifications, and
confirms a real final arrives within ~25 minutes, tapping it opens the game and
clears it from the bell, and Mute stops a team's pushes.

---

## API-LINES-01 — Real line combinations from shift charts

**Status:** DONE (Product Owner approved 2026-10-19) (HockeyStatsAPI)

**Approved decisions (Product Owner):** Lines come from the team's most recent
completed game's NHL shift chart (`api.nhle.com/stats/rest/en/shiftcharts`).
Batch NHL calls: as fresh as possible, but never re-fetch immutable data, and
every response is pinned to one game so it is internally consistent.

**Contract:** `GET /team/lines/:triCode?season=` → `{ source: 'shifts'|'none',
game: { gameId, gameDate, opponent, homeAway } | null, forwardLines: [{ players:
[{ id, slot: 'LW'|'C'|'RW' }], togetherSeconds }] (≤4), defensePairs: [{
players: [{ id, slot: 'LD'|'RD' }], togetherSeconds }] (≤3), goalies: {
starterId: number|null } }`.

**NHL call budget:** latest completed game from the 10-minute `week/now` club
schedule (shared with After Action Reports), else the 12-hour season schedule;
positions from the 24-hour roster cache; shift chart cached forever once the
game is `OFF` (shared by both teams, single-flight via `GetOrFetch`), 5 minutes
while `FINAL` or empty. Lines are computed on read, never cached.

## TEAM-LINES-01 — "Line Change" roster view

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

---

## API-WPR-01 — Favorite players and the weekly player report (backend)

**Status:** ACTIVE — implemented and QA-verified (HockeyStatsAPI `f243cce`); awaiting deploy and Product Owner acceptance with WPR-01

**Approved decisions (Product Owner, 2026-10-19):**

- Report week is Monday 00:00 – Sunday 23:59 America/New_York; generated and
  pushed Monday about **9:00 ET** (cron 13:05 and 14:05 UTC; the script skips
  the run that lands before 9:00 ET and the ledger keeps it to one send).
- Break = **zero completed regular-season/playoff games league-wide** that
  week: no reports, no pushes. Users whose favorites' teams did not play are
  also skipped individually (design item 5).
- Stat lines as proposed in design item 6.
- **At most 10 favorite players** per user (409 on the 11th).
- **One on/off switch** (`users.weekly_report_push`, default on); no
  per-player mute. The report is still created for the inbox when it is off.
- Push wording: title `Weekly Player Report · Oct 13–19`; body is the best
  performer (skaters by points, else goalies by wins), e.g.
  `Connor McDavid: 2G 4A in 3 GP`, plus ` and N more` for the other players
  who played.

**Goal:** A signed-in user favorites players the same way they favorite teams.
Every Monday morning the API builds one Weekly Player Report per user covering
the previous Monday–Sunday and sends one push notification. If the league was
on a break that week, no report is created and nothing is sent.

**Requested by Product Owner (2026-10-19):** favorite a player like a team;
a weekly report arrives Monday morning with a notification; skip both when the
league is on a break.

**Read first:** this block and the WPR-01 block; AAR-01/AAR-02 blocks above;
HockeyStatsAPI `README.md` (favorites, After Action Reports, Web Push);
`src/slices/afterActionReports/*`, `src/slices/pushNotifications/*`,
`src/platform/migrations/003_*.sql` and `004_*.sql`,
`src/presentation/routes/{afterActionReports,push,player}.js`,
`bin/aar-push-cron.js`, `.github/workflows/after-action-push.yml`,
`src/platform/cacheManager.js` (`GetOrFetch`), `src/platform/nhlApiClient.js`.

**Facts from shared discovery (verify, don't re-derive):**

- Favorites today: `favorite_teams(user_id, team_tri_code, created_at,
  push_muted)`; routes `GET/PUT/DELETE /api/favorites/:triCode` and
  `PUT /api/favorites/:triCode/push-mute`, all behind the session token.
- Push: `push_subscriptions` + VAPID env; `POST /api/push/dispatch` is
  secured by `Bearer CRON_SECRET`; a per-item sent ledger
  (`after_action_report_pushes`) guarantees once-only sends; read tokens are
  30-day JWTs (`purpose: "aar-read"`).
- The hosted API sleeps; nothing may run on an in-process timer. The existing
  GitHub Actions cron (`after-action-push.yml`, UTC only) wakes it.
- The NHL hosts are unreachable from the cloud dev container. Every NHL
  payload shape below is an assumption the worker must code defensively
  against and the Product Owner should spot-check after deploy.

**Proposed design (PM recommendation; confirm at the checkpoint):**

1. **Data model** (migration `005_*`): `favorite_players(user_id, player_id,
   created_at)` (PK user+player, max 25 per user);
   `weekly_player_reports(user_id, week_start date, created_at, read_at,
   payload jsonb)` (PK user+week) holding the frozen report so reopening it
   never re-fetches; `weekly_player_report_pushes(user_id, week_start)` sent
   ledger; `users.weekly_report_push` boolean (default true) as the one
   on/off switch.
2. **Routes:** `GET /api/favorite-players`, `PUT/DELETE
   /api/favorite-players/:playerId` (validate the id against the NHL player
   landing, cached 24h, and store name/team/position for display);
   `GET /api/weekly-player-reports` (newest first, at most 12) and
   `POST /api/weekly-player-reports/:weekStart/read`; extend
   `GET /api/push/config` or add `PUT /api/push/weekly-report` for the
   toggle; `POST /api/push/weekly-dispatch` secured like `/dispatch`.
3. **Report week:** Monday 00:00 to Sunday 23:59 **America/New_York**; the
   report is generated Monday at about 8:00 ET. GitHub cron is UTC, so
   schedule both `12:05` and `13:05` UTC on Mondays; the script computes the
   ET hour and the ledger keeps it idempotent across DST.
4. **Break detection (league-wide, one call):** fetch the NHL league schedule
   for the report week (`/schedule/{monday}` returns a 7-day `gameWeek`;
   assumed shape). Count completed games with gameType 2 (regular season) or
   3 (playoffs). **Zero games means a break:** no report rows, no pushes,
   return `{ skipped: "league-break" }`. This covers the offseason, the
   All-Star/holiday breaks, and any Olympic-style pause; preseason games
   (gameType 1) do not count. A week with at least one game is not a break.
5. **Per-user skip:** a user with no favorited players, or whose favorites'
   teams played zero games that week, gets no report and no push.
6. **Report content, per player:** GP that week, then skaters G, A, PTS,
   +/-, SOG, TOI/GP, and the week's best game ("2G 1A vs BOS, Oct 18");
   goalies GP, W-L-OTL, SV%, GAA, SO. A player who did not play shows "Did
   not play (team played N games)". The push says "Your weekly player
   report: <best performer line>" and opens the report.
7. **NHL call batching:** one league schedule call for the break check, then
   stats for **all distinct favorited players across all users at once**,
   not per user. Preferred: the stats REST summary endpoints filtered by
   date range and game type with per-game rows
   (`/stats/rest/en/skater/summary` and `/goalie/summary` with a
   `cayenneExp` on `gameDate` and `gameTypeId`, `isGame=true` to get game
   rows; assumed). Fallback: per-player `/player/{id}/game-log/now`, one call
   per distinct player, cached for the week. Raw payloads go through
   `GetOrFetch` with keys that include the week, so a retried dispatch
   reuses them; computed reports are persisted in `weekly_player_reports`,
   never in the cache.
8. **Sending:** reuse the AAR-02 push sender, VAPID config, 404/410
   subscription cleanup, and the claim-before-send ledger. One push per
   user per week, to all of that user's devices; never to users with the
   toggle off.

**Edge cases to test:** DST weeks (both cron runs, exactly one send); a
traded player (report under the team(s) he played for that week); a player
with zero games; goalie and skater on one report; dispatch run twice; NHL
stats call failing (no reports created, non-2xx so the workflow shows red;
nothing half-sent); a break week (nothing created or sent); a user who
favorited a player mid-week (include the whole week).

**Product Owner decisions needed before implementation:** the send time and
timezone (recommended Monday 8:00 ET); whether break means zero league games
(recommended) or "no games for my favorites" only; the stat lines above;
the 25-favorite cap; the single on/off toggle versus per-player mute.

**Implemented (`f243cce`):** migration `005_create_favorite_players_and_weekly_reports.sql`;
`slices/weeklyPlayerReports` (pure `weeklyReportBuilder`, repository, service);
push slice gains the weekly ledger, switch, `weeklyDispatch`, and `wpr-read`
read tokens accepted by `POST /api/push/read`; routes `/api/favorite-players`,
`/api/weekly-player-reports`, `GET/PUT /api/push/weekly-report`,
`POST /api/push/weekly-dispatch` (optional `{ weekStart }` for manual reruns);
`bin/weekly-report-cron.js` + `.github/workflows/weekly-player-report.yml`.
Contract details are in the API README. Push payload: `{ kind: "weekly-report",
title, body, weekStart, tag: "wpr-<weekStart>", readToken }`.

**Verification so far:** 161 API unit/route tests; a real Postgres 16 run of
the new SQL (cap under 12 concurrent adds, break week, concurrent double
dispatch sends once, read token, cascade). Independent QA ran the real app on
real Postgres with stubbed NHL and a local HTTPS fake push service (payloads
decrypted): favorites, cap, normal/break/DST weeks, cron script end to end,
sequential and concurrent double runs, switch, read tokens both directions,
NHL failure (502, nothing written, recovers), 410 cleanup, week validation,
and an AAR dispatch smoke — all PASS. Not verifiable here: real NHL payload
shapes, the real cache/rate limiter, and the GitHub workflow.

**Deploy:** run migration 005; add the Monday schedule to the workflow (or a
new `weekly-player-report.yml`) using the existing `CRON_SECRET` and
`AAR_PUSH_API_URL` secrets; scheduled workflows run only from `main`.

**Verification:** API unit and route tests with stubbed NHL payloads; a
real-Postgres run of the new SQL; QA drives `/api/push/weekly-dispatch`
against a fake push service for a normal week, a break week, a DST week and
a double run.

## WPR-01 — Favorite players and the weekly report (frontend)

**Status:** ACTIVE — implemented and QA-verified (`909cf01`, fixes `2f53aee`); awaiting Product Owner screenshot review and deploy acceptance

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

---

## HOME-FAV-01 — Favorite players row on the home page

**Status:** ACTIVE — implemented, QA PASS (all criteria, 375/1280 light/dark), readability pass done; awaiting Product Owner screenshot review

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

---

## API-FAN-01 — Fan categories for favorite teams (and players) (backend)

**Status:** ACTIVE — implemented, QA PASS on real Postgres (label-length fix included), readability pass done; awaiting deploy (`pnpm run db:migrate` adds migration 006)

**Approved decisions (Product Owner, 2026-10-20):** fixed tiers named
**Diehard / Fan / Curious** (values `diehard`, `fan`, `curious`; new favorites
start as `fan`) plus an optional free-text label (emoji allowed, e.g. "❤️",
"Prospect", "My West Coast team") on **both** teams and players. Categories
are display-only: no effect on After Action Reports, Weekly Player Reports, or
push.

**Goal:** Store a fan category with each favorite so the frontend can group
and label favorites (e.g. Diehard, Curious, "My West Coast team").

**Proposed contract (PM recommendation, confirm at checkpoint):**

- Migration 006: `favorite_teams.tier` and `favorite_players.tier` text,
  `NOT NULL DEFAULT 'fan'`, `CHECK (tier IN ('diehard','fan','curious'))`;
  `label` text NULL, at most 24 characters, trimmed.
- `GET /api/favorites` and `GET /api/favorite-players` add `tier` and `label`
  to each favorite.
- `PATCH /api/favorites/:triCode` and `PATCH /api/favorite-players/:playerId`
  with body `{ tier?, label? }` (`label: null` clears); returns the full list;
  400 on a bad tier or label, 404 when not a favorite.
- Adding a favorite keeps today's routes; it starts at the default tier.
- No change to After Action Report or Weekly Player Report eligibility unless
  the Product Owner decides categories affect push.

**Verify:** route/service unit tests, migration run on real Postgres, README
route table updated.

---

## FAN-01 — Favorite teams on home and fan categories (frontend)

**Status:** ACTIVE — implemented, QA PASS (11/11 after a focus-trap fix), readability pass done; awaiting Product Owner screenshot review. Team logos follow the light/dark theme (Product Owner)

**Goal:** Favorite teams join the home favorites area, and a user can put each
favorite in a category and see favorites grouped or badged by it.

**Proposed design (PM recommendation, confirm at checkpoint):**

- Home: a "Your teams" row of logo cards (link to `/team/<triCode>`) next to /
  above the HOME-FAV-01 players row, sharing its section styling.
- Category control: tapping a favorited star (team or player) opens a small
  menu: Diehard / Fan / Curious, optional custom label, Unfavorite.
  Unfavorite stays one extra tap away instead of the current one-tap toggle.
- Card layout (Product Owner, 2026-10-20, applies to both home rows): the
  headshot or team logo is centered at the top and straddles the card's top
  border (the border meets the middle of the image), with name, "TEAM · POS",
  and the badge centered underneath. The star stays on the image corner.
- Home rows order Diehard first, then Fan, then Curious; each card
  shows a small badge (custom label if set, else the tier name).
- Degrade gracefully until API-FAN-01 deploys (missing `tier` = Fan,
  menu hides category options).
- Fix (Product Owner, 2026-10-21: "you cannot change fan level"): home team
  cards had no star, so their tier could only be changed on the team page;
  they now carry the same corner star as player cards. The menu opens above
  its star when there is not enough room below, so it is no longer squeezed
  into a scrolling sliver on phones. Saving still needs API-FAN-01 deployed.

**Verify:** unit tests for ordering/badges; Playwright against a mocked API
for the menu, row grouping, 375/1280 light/dark.

## HOME-LEAD-01 — Stat leaders use the favorite card on the home page

**Status:** DONE — Product Owner accepted 2026-10-21. Chose Option B on 2026-10-21 from the phone
mockups (today / A swipe row / B 2×2 grid / C list). Implemented; QA PASS
(10/10 browser criteria + checks, after fixing an empty modal wrapper that took
a grid cell); readability pass done.

**Goal:** On phones all four leaders of a group are visible without swiping,
and stat leaders look like the favorite rows above them.

**Approved design (Product Owner, Option B):**

- Each leader is a `FavoriteCard`: headshot straddling the top border with the
  favorite star on its corner, then the category (small caps, accent colour),
  the stat value large, the player name and "TEAM · POS" when known. The badge
  slot shows the value instead of a fan tier. Tapping the card still opens the
  category's leaderboard dialog.
- Phones (< 768px): one "Stat leaders" section with a Skaters / Goalies
  segmented switch (Skaters default) over a 2×2 grid of that group's cards. No
  horizontal swipe row.
- PM default (Product Owner may revise at review): from 768px both groups show
  with their own left-aligned headings, each a 2-column grid of the same cards;
  no switch.
- Headings left-aligned at the favorite rows' size; loading, error, empty-group
  and missing-category behaviour unchanged.

**Verify:** unit tests for the card variant and the switch; Playwright against
a mocked API at 375 and 1280, light/dark: 4 cards visible per group on phone
without horizontal scroll, switch toggles groups, card opens dialog, star works
independently of the card.


---

## STAR-01 — Favorite star in leaderboards and box scores

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

---

## NAV-01 — Header nav fits at 1024px

**Status:** DONE — accepted by the Product Owner from 1001/1024/1200
screenshots 2026-10-21.

**Measured (2026-10-21):** the overflow is the signed-out header (Google
"Sign in" button) between the 1000px icon-only breakpoint and ~1100px: ~55px at
1001px and ~33px at 1024px with a 130px-wide button; the signed-in corner (bell
+ avatar) overflowed 6px at 1001px only. The search box is already hidden in
this range.

**Decision (Product Owner, 2026-10-21):** Option A. From 1001–1199px the header
gap drops to `--ds-space-2`, item padding to 2px and pill padding to
`6px 10px` (`PageHeader.module.css`); labels and items are unchanged. It fits
with a Google button up to at least 160px wide.

**Goal:** Fix the global header nav overflowing the viewport by ~35px at 1024px
(found during TEAM-LINES-01, pre-existing).

**Dependencies:** none.

**Proposed scope (PM recommendation, confirm at checkpoint):**

- Measure the overflow in `components/PageHeader.tsx` /
  `PageHeader.module.css` at 992–1280px with signed-out and signed-in
  (`AccountCorner` bell + avatar) headers, since the signed-in corner is wider.
- Options to bring to the Product Owner: (A) tighten gaps and padding in the
  992–1199px range; (B) shorter labels in that range; (C) move the
  lowest-traffic items into a "More" menu. Recommend A, falling back to C if A
  can't absorb the signed-in corner.
- No change to the phone bottom nav or the search FAB.

**Acceptance:** at 992, 1024, 1100, 1200 and 1280px, signed in and out, light
and dark: `document.documentElement.scrollWidth <= innerWidth`, no clipped or
wrapped nav items, focus outlines fully visible.

**Verify:** build; Playwright width sweep asserting no horizontal overflow, with
screenshots for the Product Owner.

---

## FEED-01 — "My Hockey" personal feed

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

---

## PREVIEW-01 — Pre-game preview on the matchup page

**Status:** ACTIVE — implemented and verified; pending Product Owner acceptance
from screenshots.

**Goal:** Before puck drop, a game opens a useful preview instead of an empty
box score: the `/matchup` page for its two teams with the game's date, arena and
puck drop, the season series, a Team DNA card per team, and recent form.

**Approved design (Product Owner, 2026-10-22):**

- **Entry (option A):** `lib/gamePath.ts` routes every game link: future or
  pregame with the start still ahead → `/matchup?teamA=<away>&teamB=<home>&game=<id>`,
  anything else → `/game/:id`. Schedule day cards, calendar chips, the team
  schedule strip and the Up next rows use it; future and live cards become
  clickable. Search keeps listing finished games only.
- **Redirect:** `/game/:id` redirects (history replace) from the loaded season
  list, with a box-score fallback in the game page; past the scheduled start it
  never redirects, so a stale list cannot bounce a started game.
- **Team DNA:** one card per team, tinted in the team color; side by side from
  768px, a team switch (also swipe) on phones. Order: series summary, Team DNA,
  form, played, upcoming. Shown on every matchup, preview or not.
- **Puck drop:** plain "Puck drop 7:00 PM" before the start; at the start a
  local timer turns it into "Game on · open the game page" (finished games:
  "Final · open the game page"). The page makes no requests and never polls.
- **Architecture:** `TeamDna` and `FormStrip` move to `components/` (own CSS
  modules, optional `teamColor`, otherwise they inherit `--color-primary`);
  `teamDna`, `teamForm`, `teamColor` helpers move to `lib/` with structural
  types; recorded in `architecture.md`.
- **Dropped from the original idea:** projected lines, goalies, and the team
  comparison section.

**Acceptance:**

- Future game cards open the preview; live/final cards and `/game/:id` for
  started games open the game page; `/game/:id` for a future game redirects.
- No new API calls (season games and league team list only); no polling.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** unit tests for the routing helper (`lib/gamePath.test.ts`) and game
context parsing (`matchup/utils/matchupGameContext.test.ts`); Playwright against
a mocked API for future/live/final games and a plain `/matchup`, with
screenshots.

**Evidence (2026-10-22):** tsc, Prettier, Vitest 50 files / 206 tests pass (14 new); build
passes; Playwright 29/29 against a mocked API (schedule card and team strip →
preview; live card → game page; warm and cold `/game/:id` redirect with history
replace; live and final stay; puck-drop flip after 120 simulated minutes with
zero requests; link opens the game page without bouncing; plain `/matchup`;
team change drops `game=`; phone switch; no horizontal scroll at 375/1280
light/dark). Up next links are covered by unit tests only (they need sign-in).

---

## COMPARE-01 — Player comparison

**Status:** DONE — accepted by the Product Owner from 375/1280 light/dark screenshots 2026-10-22. QA PASS 1–9; dialog Compare link checked in source only. Release needs API-COMPARE-01 deployed first (league-wide summaries return every player).

**Goal:** A user can pick two or three players and compare their season stats
side by side.

**Dependencies:** WPR-01 (headshots and stars), API-COMPARE-01 (every player
in the league-wide summaries). Career comparison is out of scope (would need
an API ticket for the NHL player landing).

**Data (approved 2026-10-22, option A):** The checkpoint check failed: team
summaries (`?teamId=`) hold the whole team, but the league-wide call held only
100 unsorted rows, and the contract had no team, shots, S% or PP goals.
API-COMPARE-01 fixes both on the existing endpoints. The page makes two calls,
`/player/skater/summary` and `/player/goalie/summary` with no `teamId`, which
serve both the picker and the table. Reading season stats from the database
was considered and rejected: `player_season_stats` is filled only as a side
effect of summary reads, so it has the same gaps, and nothing reads it yet.

**Approved design (2026-10-22; Product Owner left presentation to the PM):**

- Route `/compare?players=<id>,<id>[,<id>]` (plus the app's `season=`) so a
  comparison is shareable. Non-numeric ids dropped, duplicates removed, max 3;
  picking or removing replaces the URL. Unknown id: "not found this season"
  with Remove, in that slot only.
- Entry point: a "Compare" button beside Close in `PlayerStatsDialog`, which
  covers roster rows and favorite player cards; opens `/compare?players=<id>`
  with the picker focused. Leaderboards deferred; no header nav link.
- Player picker: ARIA combobox over the cached summaries, from 2 letters,
  case- and accent-insensitive, matching first- or last-name prefixes (last
  name first, then by GP), up to 8 rows, picked players excluded; ↑/↓, Enter,
  Esc, Tab. The first player sets the group; with none picked a Skaters |
  Goalies `SlidingToggle` chooses it. A mismatched slot in a shared URL shows
  a message instead of joining the table.
- Layout: headshot column per player, then stat rows (skaters: GP, G, A, P,
  PPG = points per game, +/-, SOG, S%, TOI/GP; goalies: GP, W, GAA,
  SV%, SO). Best value per row highlighted (bold, tint, dot, and hidden text):
  GAA lower-is-better, GP not highlighted, ties all marked at displayed
  rounding, all-tied rows unmarked, missing values skipped. Table only, no
  bars.
- Phones: sticky stat-label column, ~116px player columns; two players fit,
  the third peeks and scrolls inside the table, never the page.
- Shared pieces: `lib/comparePath.ts` (build/parse, used by the teams dialog
  and the page), `lib/playerHeadshot.ts` gains the season mug URL; the rest in
  `features/player-compare/`, which renders `favorite-players`
  `PlayerHeadshot` as a listed exception.

**Acceptance:**

- Opening a shared URL rebuilds the same comparison; unknown ids show a
  message for that slot only.
- Leaders highlight correctly, including ties and lower-is-better stats (GAA).
- 375/1280, light/dark, no page horizontal scroll; the picker is keyboard
  usable.

**Verify:** unit tests for best-value highlighting and URL parsing; Playwright
against a mocked API (shared URL rebuild, unknown id in one slot, skater and
goalie comparisons, keyboard picker) with 375/1280 light/dark screenshots.

---

## API-COMPARE-01 — Every player in the season summaries (backend)

**Status:** ACTIVE — implemented and tested on HockeyStatsAPI branch `ccr-ed30da63-xt8i5s`; pending merge and deploy

**Approved 2026-10-22 (option A):** no new endpoint.

- `GET /player/skater/summary` and `/player/goalie/summary` page through the
  NHL stats API (`platform/nhlStatsPages.js`, shared with the weekly report),
  sorted by points/wins then player id. Without `teamId` they return every
  player; league-wide entries use a new cache key (`*_summary_league_<season>`)
  so the old 100-row entries are never served. Team keys are unchanged.
- Skater contract adds `teamTriCodes` (string[]), `shots`, `shootingPct`
  (fraction, null with no shots) and `powerPlayGoals`; goalie contract adds
  `teamTriCodes`. Additive only; mapping still runs after the cache read.
- Rows are persisted when fetched from the NHL, not again on each cache hit.

**Verify:** `pnpm test` (mapper fields, pager, league paging/cache key,
persist-on-fetch). NHL field names were not checked live (the dev
environment blocks api.nhle.com); confirm on the first deploy.

---

## HOME-LOAD-01 — Home sections load and fail on their own

**Status:** IDEA

**Context:** `app/LandingPage.tsx` shows one full-page spinner until skater
leaders, goalie leaders and standings have all loaded, and replaces the whole
page with "Couldn't load stat leaders" when either leader call fails, hiding
standings and the draft lottery too. One slow or failed call (a waking API, a
fresh incognito window with no cache) makes the home page look broken.
Found 2026-10-22 alongside the Firefox private-window crash fix (service
worker guard) and the signed-out Up next prompt, both done.

**Proposed (confirm at checkpoint):**

- Each section (stat leaders, draft lottery, standings) shows its own loading
  placeholder and its own error with Try again; the rest of the page renders
  as soon as its data arrives.
- Keep the intro and Up next strip visible throughout.

**Verify:** Playwright with one endpoint failing or delayed at a time;
375/1280 screenshots.

---

## API-CACHE-01 — Cache resilience (backend)

**Status:** IDEA

**Context:** With `CACHE_DATABASE_URL` set the cache already lives in Postgres
(`app_cache`); confirm production does not set `CACHE_STORAGE=filesystem`.

**Proposed (confirm at checkpoint):**

- Serve-stale on error: when an entry has expired and the NHL fetch fails,
  return the expired entry instead of failing.
- Stale-while-revalidate (or a daily warm-up cron) for large entries such as
  the league-wide summaries, so the first visitor after expiry does not wait
  on a multi-page NHL fetch.
- Never expire completed seasons' summaries, standings and leaders (like
  official shift charts).
- Optional, only if timings show it: a short in-memory layer in front of
  Postgres for large entries.

---

## API-PBP-01 — Play-by-play events for shot maps and game flow (backend)

**Status:** IDEA — backend-owned dependency

**Goal:** Expose a normalized, cached list of a game's shot and goal events so
the frontend can draw a shot map and game flow chart.

**Proposed contract (PM recommendation, confirm at checkpoint):**

- `GET /schedule/playbyplay/:gameID` → `{ gameId, gameState, homeTeam,
  awayTeam, events: [{ eventId, period, timeInPeriod, elapsedSeconds,
  type: 'goal'|'shot'|'miss'|'block', teamTriCode, shooterId, goalieId|null,
  x, y, shotType|null, strength: 'ev'|'pp'|'sh'|null }] }`.
- Source: NHL `gamecenter/{id}/play-by-play`, cached raw through `GetOrFetch`
  (forever once the game is `OFF`, about 30 seconds while live); mapping runs
  after the cache read in `slices/schedule/mappers/`, per the Mapping
  Boundary.
- Coordinates normalized so each team always shoots toward the same end in the
  response (the NHL flips sides by period); document the convention.
- Unknown event types are dropped, not failed.

**Verify:** mapper unit tests from a recorded payload (including a period side
flip and missing coordinates), route test, README route table updated.

---

## GAME-SHOTS-01 — Shot map and game flow on the game page

**Status:** IDEA

**Goal:** `/game/:gameId` shows where each team shot from and how the game
swung over time.

**Dependencies:** API-PBP-01 contract (the page must work before it deploys:
hide both views when the call 404s).

**Proposed design (PM recommendation, confirm at checkpoint):**

- **Shot map:** a half-rink SVG per team (or one full rink), goals as filled
  markers, other shots as outlines, team colours that pass contrast in light
  and dark. Tap/hover a marker for shooter, time, shot type. Filters: period,
  strength (all / even / PP).
- **Game flow:** cumulative shot attempts per team over elapsed time, with
  goal markers and period dividers. Built per the `dataviz` skill.
- New components inside `features/game-detail`; inline SVG, no new chart
  dependency unless the Product Owner approves one.
- Live games refresh with the existing game-detail polling.

**Acceptance:**

- Marker counts match the API events for the selected filters.
- Goals, period boundaries and the side normalization render correctly for a
  recorded game, including overtime.
- Keyboard and screen-reader users get a text summary (shots and goals by
  period) in place of the charts.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** unit tests for filtering and the flow series; Playwright against a
mocked API with screenshots.
