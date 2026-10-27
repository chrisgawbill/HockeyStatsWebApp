# Rink Quest: Opening Night 2.0

Status: approved product direction; not yet implemented.

This document defines the intended Opening Night 2.0 experience. The currently
implemented rules remain documented in `board-game-design.md` until individual
2.0 tickets replace them. Numeric values here are starting points, not balance
claims.

Delivery follows `agent-development.md`. The human owns product
decisions; the PM proposes options, coordinates workers, and interprets evidence.
See `agent-development.md` and the decision checkpoints in
`agent-ticket-index.md`. Approved direction does not settle every rule below.

## Product thesis

Rink Quest is a tactical hockey card battler in which the player coaches an NHL
team on a board-like rink. Positioning creates matchups, cards represent plays
called during hockey battles, and timing-based faceoffs and shots are shaped by
the selected playbook, player roles, and featured star.

The player controls the team, not one athlete. A good turn should feel like
reading the rink, moving several skaters across a shift into a coordinated play, choosing the
right tactical card, and reacting to the opposing coach.

## Goals

- Make several skaters matter during every shift instead of repeatedly moving
  only the puck carrier or nearest defender.
- Make every card a recognizable hockey action legal in its situation.
- Let NHL team choice affect presentation and tactical style without making
  favorite teams objectively weak.
- Give repeat players varied daily opponents and featured stars even when they
  always choose the same team.
- Present the match like a broadcast and the playbook like a physical card hand.
- Remain fully playable in phone portrait orientation; make landscape an enhanced
  tactical layout, not a requirement.
- Apply the same action economy, card rules, and mechanical budgets to user and
  CPU.

## Non-goals

- Accurate full NHL lines, line changes, injuries, contracts, or roster
  simulation.
- Hundreds of individually tuned player ratings.
- Thirty-two unrelated decks with bespoke mechanics.
- Automatic player-archetype classification without Product Owner review.
- A fake period clock disconnected from game rules.
- Multiplayer, monetization, or a permanent progression economy.
- Rivalry stat bonuses or hidden CPU advantages.

## Player journey

1. Choose an enabled NHL team.
2. Receive a featured matchup. Prefer a real scheduled opponent when available;
   otherwise choose a deterministic daily opponent with rivalry and geographic
   weighting while avoiding recent repeats.
3. Choose one of three featured-player/game-plan options drawn from the team's
   reviewed Rink Quest player profiles.
4. See a broadcast matchup introduction with team systems, featured stars, and
   one concise coaching key.
5. Play alternating three-activation shifts using movement plus actions.
6. Resolve contested hockey through small contextual card offers. Resolve
   faceoffs and shots through timing mechanics with card/player buffs.
7. Finish on a traditional final scoreboard and Coach's Report highlighting the
   decisive tactical moment, featured-star impact, and useful match totals.

## Match structure

### Alternating shifts

Each team receives three skater activations per shift. Starting with the team
that owns initiative, teams alternate one activation at a time. A non-goalie
skater may normally activate only once in the shift. After both teams use three
activations, eligibility resets and the next shift begins.

An activation permits optional movement up to the skater's allowance and then at
most one legal hockey action. Actions include passing, shooting, checking,
setting a screen, clearing the crease, collecting a loose puck, or holding
position. A battle triggered during movement consumes the activation's action.
Passing does not activate the receiver; the coach decides whether to activate
that receiver later.

There is no movement die and no shared movement-point pool.

Approved 2026-10-27 (ON2-01): the faceoff winner opens the shift after a
faceoff, and each later shift opens with the team that went second in the
previous one. A whistle ends the shift. A team with activations left but no
eligible skater forfeits them. A stunned skater sits out the rest of the
current shift. Possession changes do not change the alternation: after any
battle, the next activation goes to the other team if it has one left.

### Movement

- Normal non-goalie movement starts at up to two tiles per activation.
- Skaters may move horizontally, vertically, or diagonally.
- Skaters may not pass through occupied or unplayable tiles.
- A defenseman may initially move up to three tiles when the entire path remains
  within that defenseman's defensive zone.
- Goalies remain fixed unless a later approved ticket creates a requirement.
- Puck carriers entering an opponent's pressure area may trigger a deke battle.
- A defender moving beside the carrier may spend its action to check.
- Passing initially supports unobstructed horizontal, vertical, and straight
  diagonal lanes. Arbitrary-angle geometry is not required.

These ranges are playtest values. Changes require evidence from match pace,
first-activation advantage, shots, goals, and player-usage measurements.

### Off-puck play and screens

Off-puck movement matters by opening or occupying passing lanes, threatening an
interception, supporting the carrier, collecting loose pucks, and creating or
clearing a screen.

An eligible attacking forward in the net-front area may spend its action to set
a screen. Only one screen affects a shot. It remains until the screener moves,
possession leaves the offensive zone, play stops, or the screen is cleared. A
nearby defenseman may use Clear Crease to begin a contextual card battle.

The first screen effect is one small, visible goalie save-chance penalty. Do not
also change timing width, power, cover chance, rebound chance, and poise in the
first implementation. Both teams use identical screen rules.

## Card system

### Playbook composition

A team playbook is composed rather than authored from scratch:

```text
universal hockey core
+ primary team-identity package
+ smaller secondary-identity package
+ one selected-star signature card
```

Identity packages replace cards in equivalent functional slots. They do not
simply add stronger cards. Initial identity vocabulary:

- Rush Attack
- Possession Cycle
- Heavy Forecheck
- Net-Front Pressure
- Structured Defense
- Counterattack

Each team receives a Product Owner-reviewed primary identity and optional
secondary identity. Code maps identities to balanced packages; the database does
not store thirty-two complete card lists.

### Contextual offers

The playbook is conceptually one deck, but every offer is filtered by battle type
and participant side before drawing:

- ordinary deke, check, interception, and net-front battle: draw three eligible
  cards and spend the round's energy across one or more;
- shot: draw three shot cards and choose one;
- faceoff: draw three faceoff cards and choose one;
- center faceoff perk: draw four and choose one.

The CPU draws from its own playbook and obeys the same energy and eligibility
rules. Its exact commitment stays hidden until reveal, while a broad intent such
as Conservative, Balanced, Aggressive, or Heavy Commitment may be shown.

Played cards enter discard, exhaust cards remain unavailable for the match, and
ineligible cards are not discarded because the current context cannot use them.
A selected star's signature card is guaranteed in that star's first relevant
offer, then follows normal discard/reshuffle rules.

The guarantee replaces one offered card; it does not enlarge the hand or waive
energy costs. ON2-03 must settle what happens to unplayed offered cards and how
to handle fewer than three eligible cards without duplicating cards or defeating
exhaust rules. The PM presents the proposed lifecycle for human approval.

Initial context means battle type and participant side. Zone, archetype, and
board state may grant visible conditional effects but should not over-filter
offers into empty or deterministic pools.

### Hockey meaning

Every card must describe a plausible action for the acting participant:

| Context | Possession/attacking side | Challenging/defending side |
| --- | --- | --- |
| Deke | Deke, Toe Drag, Protect Puck, Drive Wide, Cutback | Poke Check, Angle Out, Gap Control, Body Check |
| Check | Protect Puck, Slip the Check, Quick Dish, Brace for Contact | Finish the Check, Pin to Boards, Stick Lift |
| Interception | Saucer Pass, Bank Pass, Quick Touch, Thread the Needle | Read the Lane, Active Stick, Step Up, Deflect Pass |
| Net front | Establish Position, Hold Your Ground, Find the Rebound | Clear the Crease, Box Out, Lift the Stick, Front the Shooter |

Shot and faceoff cards remain buffs for timing mechanics rather than ordinary
pressure battles. The UI uses hockey language: pressure, resistance, poise,
battle won, and puck protected. It should not lead with damage, armor, or
knockout terminology.

More cards alone do not create better decisions. The expanded library needs
situational tradeoffs: reliability versus ceiling, pressure versus resistance,
position changes after victory, draw/exhaust effects, role synergy, and
context-sensitive counters. Avoid cards that are always optimal by
value-per-energy.

## Teams, rivalries, and featured players

### Team profiles

The independently deployed HockeyStatsAPI owns database migrations and contracts.
Rink Quest consumes normalized team profiles through its own feature API boundary.
A profile identifies a team's primary and optional secondary system and whether
the team is enabled for Opening Night 2.0.
The supported systems are Heavy Forecheck, Speed & Transition, Puck
Possession, Heavy Game and Defensive Structure (API-ON2-02).

Systems distribute a comparable mechanical budget differently. Real NHL
performance may inform identity but must not make current standings a raw power
ranking. CPU coaching policy uses the team system as a decision preference, not
permission to break rules.

### Site-wide rivalries

Rivalries are site-wide hockey-domain data, not Rink Quest-only data. Store each
unordered team pair once with primary/secondary tier, optional display name, and
enabled state. Prevent self-rivalries and reversed duplicates.

Rink Quest uses this data for opponent weighting and Rivalry Night presentation.
Other features may later use it for schedule badges, matchup context, and team
pages without depending on board-game code.

Rivalry Night changes atmosphere only. It does not add energy, stats, movement,
cards, or CPU strength.

### Player profiles

Rink Quest player profiles link to canonical database players by player ID. Do
not duplicate name, position, current team, or headshot in the game profile. The
first profile contains one primary archetype, an appearance rank, and enabled
state. Current roster membership determines team eligibility.

Initial skater archetypes:

- Finisher
- Playmaker
- Power Forward
- Two-Way Center
- Mobile Defenseman
- Defensive Anchor

Goalies remain team-level identity in the first 2.0 release. A Franchise Goalie
archetype requires a later approved design decision.

Appearance rank controls candidate frequency, not mechanical strength. All
players with the same archetype use the same passive/signature-card template.
Real identity supplies name, headshot, position, team, and presentation; the
archetype supplies rules.

### Daily featured choices

For the selected team, group enabled active-roster profiles by archetype, prefer
the top two or three candidates per group, and offer three distinct archetypes
when possible. Seed selection by local date and team so reloads do not reroll the
offer. Avoid repeating the previous day's exact trio when alternatives exist.
Missing data uses an explicit fallback rather than inventing a star.

The selected player occupies a compatible board role. Other tokens may remain
team-labeled positions in 2.0; accurate full lines are out of scope.

The CPU also receives one eligible featured player under the same mechanical
budget. ON2-06 defines a reproducible choice and explicit handling of teams with
too few reviewed candidates; fewer real choices are preferable to invented ones.

## Opponent selection

Default opponent priority:

1. an actual scheduled opponent for the selected team that day, when existing
   normalized schedule data supplies one;
2. a deterministic daily league-tour opponent weighted toward divisional,
   conference, and traditional-rival matchups;
3. a stable fallback when schedule or rivalry data is unavailable.

Avoid recent repeats when alternatives exist. Always allow manual opponent
selection. A primary traditional rival should appear periodically, not every day.
The same selected team should encounter varied opponent systems and stars.

All choices use enabled, playable teams and exclude the selected team. An
unavailable scheduled opponent falls through to the daily pool. Schedule
priority may legitimately repeat a matchup; repeat avoidance applies to the
generated pool. If no eligible opponent exists, show an unavailable state.
Keep a generated matchup stable for the local date/team once selected; recent
history must not reroll it on reload. Primary-rival matchups, including manual
choices, receive Rivalry Night presentation.

## Presentation

### Dimensional arena and camera direction

Product Owner-approved direction: combine a readable tactical board with a
stylized dimensional arena and selective perspective shots. React + Three.js is
the preferred approach to prototype before committing to production migration.
The existing TypeScript rules, seeded randomness, and CPU policy remain the
source of truth; cameras and animations belong to presentation only.

Three.js would render the rink, skaters/tokens, puck, arena, and lighting. React
and HTML retain the scoreboard, cards, menus, timing controls, and report.
Do not add PixiJS or Phaser alongside Three.js for this direction.

Start with simple stands/crowd sections, team colors, an arena scoreboard, and
restrained lighting. Illustrated cutouts or simple 3D tokens are sufficient;
realistic player models, full skeletal animation, and bespoke arenas for every
team are outside the initial scope.

| Moment | Intended view |
| --- | --- |
| Tactical decisions | Stable overhead or gently angled rink with clear tiles, occupancy, selection, and passing lanes. |
| Pregame | Brief arena sweep establishing the rink, stands, and team identity. |
| Faceoff or shot | Closer perspective framing participants; camera settles before timing begins. |
| Goal | Brief celebration angle with restrained lighting and crowd movement. |
| Card battle | Readable HTML cards in the foreground with the arena behind them. |

The camera stays still during tactical decisions and timing challenges. Restore
the tactical view before the next board action. Intros and celebrations are
skippable; reduced motion uses immediate static views without sweeps, shake, or
flashing. Sequences never change outcomes, consume timing windows, or become
mandatory waits. The 500–700 ms card-reveal target remains specific to reveals;
other camera durations require Product Owner review.

First deliver one playable rink with a simple arena, tactical view, and close
shot view using existing rules. Review portrait/landscape readability, touch,
keyboard, reduced motion, and measured phone performance before approving
production integration. Record the supported-device target and rendering-failure
behavior at that checkpoint. If rejected, retain the current renderer and agree
on revised presentation scope before dependent work.

### Match shell and scoreboard

Entering a match uses a fullscreen game shell that hides normal HockeyStats
navigation, avoids unnecessary document scrolling, respects safe areas, and provides its
own pause/exit control.

A persistent broadcast scoreboard shows team logos/abbreviations, score,
possession, current shift, and each side's remaining activations. Do not show a
fake clock. Rivalry Night adds a compact label and team-color treatment. The rink
remains the stage; controls appear only when useful for the selected skater.

### Responsive layouts and hand

Portrait is fully supported. Board play stacks scoreboard, rink, and selected-player
actions. During a battle, the battle stage and contextual hand take priority over
the full rink; the scoreboard stays visible. Landscape and desktop place the rink beside a
coaching rail/hand where space permits. Rotation may be suggested but never
required.

At default text size, target a complete battle at 390×844. On short screens or
with enlarged text, allow a scrollable content region with reachable controls
instead of shrinking text or clipping content.

The hand is three slightly overlapping/fanned cards. A card rises and expands
when selected. A clear button commits it; drag/double-tap may be shortcuts but
never the only controls. Four-card faceoff offers may overlap more or use a
compact horizontal rail.

Cards prioritize readable hierarchy: energy cost, action name, illustration/icon,
concise effect, and visible role/star modifier. Raw implementation tags are not
primary content. Use the pixel font for identity and short labels, not tiny body
copy. Interactive text must not use the current sub-10px card typography.

### Battle stage

Replace the vertically stacked duel form with one battle stage: two participants,
poise, a Your Call slot, hidden CPU Call slot, one contextual hand, and a Reveal
action. Committed cards move from the hand into the call slot rather than being
duplicated in another full-size row. Revealed calls resolve together in the
center; previous results do not permanently consume vertical space.

### Rivalry animation

On ordinary reveals, opposing calls glide to the center, settle, and flip. On
Rivalry Night, team-colored stacks accelerate from opposite sides, briefly clash
over a restrained ice-impact treatment, rebound, and reveal. Target duration is
roughly 500–700 ms, is skippable, and does not delay rule resolution.

Reduced motion replaces translation, collision, shake, and flashing with an
immediate side-by-side reveal, opposing color borders, and a static impact mark.
Animation state lives in presentation code and never changes outcomes.

### Coach's Report

The postgame surface shows the final broadcast scoreboard, decisive tactical
moment, featured-star impact, card-battle record, faceoff result, and one useful
coaching observation using events already produced by the engine. It offers
rematch, change star, change team, and a decisive-play summary when recorded events
support it. A replay viewer is not required. Do not build a new
analytics platform solely for the report.

## Balance and fairness

- User and CPU receive the same activations, movement rules, context filters,
  screen limits, energy rules, and card-template budgets.
- CPU cards come from its real playbook; hidden information is not extra power.
- Team packages exchange equivalent functional slots and expose tradeoffs.
- One screen, one featured-star modifier, one team-system modifier, and existing
  role bonuses form the initial stacking ceiling.
- That ceiling limits effects already approved; it does not introduce a new
  passive team-stat bonus in addition to the playbook. Any such bonus needs an
  explicit tradeoff and human approval.
- Final chances remain clamped and all applied modifiers are visible.
- Difficulty changes decision quality or documented timing behavior, not
  undisclosed stats.

Seeded simulations should measure first-activation advantage, team-system and
star-archetype win rates, match length, shots/goals, battle results, and how many
distinct skaters are activated. Simulations inform tuning but do not replace
human timing, touch, comprehension, and fun playtests.

## Accessibility and performance

- Maintain keyboard operation and visible focus for board, hand, and battle.
- Provide complete accessible card names/effects; never encode state by color.
- Keep touch targets at least 44 CSS pixels where controls permit.
- Support reduced motion, zoom/text scaling, safe areas, and portrait play.
- Keep HTML animations transform/opacity based. Measure arena rendering and
  camera transitions on phones; reduce detail before sacrificing readability.
- Preserve accessible board names, keyboard navigation, and visible focus across
  the canvas/HTML boundary; canvas graphics alone do not provide these controls.
- Headshots are progressive enhancement; fall back to initials or sprites.

## Product Owner content gates

No team or player becomes enabled merely because code can infer a value.

For each team, the Product Owner reviews primary/secondary identity, package
tradeoff, rivals, matchup copy, visual treatment, and CPU tendency.

For each player, the Product Owner reviews canonical player ID, active roster,
primary archetype, appearance rank, compatible role, and whether the standard
archetype passive/signature card represents that player well enough.

## Decisions deferred to playtests

- Final movement ranges and activation-count tuning.
- Exact screen save-chance modifier.
- Card energy, pressure, resistance, draw, exhaust, and position-change values.
- Identity package contents and CPU preference weights.
- Daily opponent weighting and no-repeat window.
- Animation timing inside the approved short/skippable envelope.
- Whether a real period/clock structure belongs later. Opening Night 2.0 reports
  shifts and preserves existing scoring unless separately approved.
