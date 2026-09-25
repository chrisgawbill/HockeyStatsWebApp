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
| ON2-10 | Portrait/landscape layout and broadcast treatment, then rendered review. |
| ON2-11 | Readable hand/battle mockup, then touch and keyboard interaction review. |
| ON2-12 | Ordinary/rivalry reveal examples and reduced-motion treatment. |
| ON2-13 | Simulation protocol and material-advantage threshold before evaluation; final playtest and release acceptance. |

## Dependency outline

```text
ON2-01 -> ON2-02, ON2-03
ON2-03 -> ON2-04
ON2-02 + ON2-03 + ON2-04 -> ON2-05
ON2-04 + API-ON2-02 -> ON2-06
API-ON2-01 + API-ON2-02 -> ON2-07
API-ON2-01 + API-ON2-02 + ON2-04 + ON2-06 + ON2-07 -> ON2-08
ON2-06 + ON2-07 + ON2-08 -> ON2-09
ON2-01 + ON2-02 + ON2-05 + ON2-09 -> ON2-10
ON2-03 + ON2-04 + ON2-10 -> ON2-11
ON2-07 + ON2-10 + ON2-11 -> ON2-12
approved implementation/content release set -> ON2-13
```

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

## ON2-10 — Fullscreen broadcast match shell

**Status:** IDEA

**Goal:** Present the rink as a focused responsive game with persistent broadcast
scoreboard and contextual coaching controls.

**Read:** design “Presentation” and “Responsive layouts”; BoardGame/Page,
RinkBoard, HUD, navigation/chrome, and theme tokens.

**Dependencies:** ON2-01, ON2-02, ON2-05, ON2-09.

**Scope:**

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

**Exclusions:** card-hand redesign, rivalry collision animation, clock mechanics.

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

**Read:** design “Rivalry animation” and reduced motion; match shell,
battle/reveal stage, matchup, and final presentation.

**Dependencies:** ON2-07, ON2-10, ON2-11.

**Scope:**

- Add ordinary glide/settle/flip reveal.
- Add rivalry team-color slide, restrained clash/ice impact, rebound, and reveal
  within the approved duration.
- Make animation skippable; game resolution never waits on it.
- Add compact rivalry scoreboard/matchup/final treatments.
- Implement static reduced-motion equivalents.
- Use transform/opacity and existing assets/tokens; add no dependency without a
  measured CSS gap.

**Acceptance:**

- Rivalry and ordinary results match mechanically for the same seed.
- Repeated reveals remain responsive and skippable.
- Reduced motion communicates states immediately.
- Browser QA finds no rapid flash, layout shift, blocked input, or phone
  performance regression.
- Rivalry treatment appears only from canonical enabled data.

**Exclusions:** sound, haptics, rivalry bonuses, cinematics.

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
- Product Owner accepts supported content, match feel, and known limitations.

**Exclusions:** unreviewed teams, multiplayer, progression economy, clock
redesign, speculative analytics infrastructure.

**Verify:** full tests/typecheck/build/format; documented simulation report;
selective browser evidence; Product Owner playtest acceptance.
