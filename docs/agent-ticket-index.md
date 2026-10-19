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

**Status:** ACTIVE (HockeyStatsAPI)

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

**Status:** ACTIVE (frontend)

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
