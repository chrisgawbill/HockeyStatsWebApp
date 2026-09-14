# Rink Quest — Board Game Design (MVP)

Single-player hockey board game at `/#/board-game`. You (Blue) play the CPU (Red). Movement uses dice, and contact is settled by a Slay-the-Spire-style card duel. **The first goal wins.** Every tunable number lives in `react/src/features/board-game/data/balance.ts`. Chris owns the balance numbers.

Status key: **[C]** = decided by Chris, **[PM]** = PM default that Chris may override.

## 1. Board
- 15 columns × 7 rows (`col 0..14`, `row 0..6`). **[C]** rink surface.
- Unplayable corners: `(0,0) (0,6) (14,0) (14,6)`.
- Goalie tiles: Blue G at `(0,3)`, Red G at `(14,3)`. Skaters can't enter them.
- Markings (visual only): Blue's blue line at col 4|5, red line at col 7, Red's blue line at col 9|10.
- **Offensive zone:** for Blue it's `col >= 10`, for Red it's `col <= 4`. Shots can only be taken from here.
- One skater per tile.
- Movement is orthogonal only. **[PM]**

## 2. Teams
Six players per team: `LW, C, RW, LD, RD, G`. Blue attacks to the right. **[C]**

| Role | Blue start | Red start |
|---|---|---|
| G  | (0,3)  | (14,3) |
| LD | (3,2)  | (11,4) |
| RD | (3,4)  | (11,2) |
| LW | (6,1)  | (8,5)  |
| C  | (6,3)  | (8,3)  |
| RW | (6,5)  | (8,1)  |

Goalies never move.

## 3. Match flow
0. **Game length [C]:** before the match, the user picks **Short** or **Long**. The only difference is goalie poise:

   | Length | Goalie poise | Sim results (200 fair games) |
   |---|---|---|
   | Short | 43 | ~11 turns, ~36% of shots score |
   | Long | 44 | ~14 turns, ~23% of shots score |

   Values come from `GOALIE_POISE_BY_LENGTH` in `data/balance.ts`. Above ~50, the goalie becomes a wall and games may never end.
1. **Faceoff:** a C-vs-C duel. The user's C is the attacker. The winner's C gets the puck, and the winner's team takes the first turn.
2. **Turn** (teams alternate) **[C]**:
   - `ROLL_DICE` rolls 2d6. The total becomes the turn's MP. **[C]**
   - Spend MP on any of your non-goalie, non-stunned skaters:
     - `MOVE`: 1 MP for one orthogonal step onto a free, playable tile. Entering the loose puck's tile picks it up.
     - `PASS`: 2 MP. Carrier to a teammate in the same row or column, with no goalies involved. The first non-stunned opponent strictly between them starts an **intercept** duel. With no opponent in the lane, the pass completes.
     - `SHOOT`: 3 MP. Carrier must be in the offensive zone. Starts a **shot** duel against the opposing G.
     - `CHECK`: 1 MP. A non-carrier next to (orthogonally) the enemy carrier starts a **check** duel.
   - **Deke trigger (automatic):** when the carrier's `MOVE` ends next to a non-stunned opposing skater (not the goalie), a **deke** duel starts. If several opponents qualify, the defender is the first in role order `C, LW, RW, LD, RD`.
   - `END_TURN`: leftover MP is lost.
3. **Whistle [C]:** on `END_TURN`, the ref blows the whistle if the puck carrier (either team) is **boxed in**, meaning all 3 of these are true:
   - no free, playable orthogonal neighbor
   - no eligible pass receiver (ignoring MP)
   - not in its offensive zone
   
   On a whistle: all skaters return to formation, stuns clear, the puck is placed loose at center, and phase goes to `faceoff` (the user's C attacks as usual). The turn still increments.
4. **Game over:** the first goal ends the game.

## 4. Duels [C: encounter battles]
- **Sides:** each duel has an **attacker** and a **defender**. Each side has `poise` (skater 20, goalie 30), `block`, and a stun/possession stake. The user always plays cards, whichever team's turn it is.
- **CPU deck [C]:** the CPU has its own 12-card deck (same `STARTER_DECK`, separate piles, cycling across the match). At the start of each round, the CPU draws a hand (same size rules) and plans cards with 3 energy. Its **planned cards are shown face-up** as its intent. On `END_DUEL_ROUND`, it plays them in order. Position perks apply to the CPU duelist's role too. Draw effects add cards to its hand, but those aren't played that round. Its planning policy lives in `engine/cpuDuelPolicy.ts` (a deterministic game rule, not a board heuristic).
- **Round loop: secret commit, simultaneous reveal [C]:**
  1. **Round start.** Both sides reset energy to 3 and draw 5 cards (a C in a faceoff draws 6). Red secretly commits its plan. Red's cards are always **hidden**; the user only sees how many are committed.
  2. **User queues cards** with `PLAY_CARD`. Queuing a card:
     - spends its energy and moves it to the user's queue face-down, with no combat effect yet
     - resolves `draw` effects immediately (drawing isn't combat)
     
     `UNQUEUE_CARD` returns a queued card to hand and refunds its energy. A card that already drew stays drawn.
  3. **`END_DUEL_ROUND` resolves the round:**
     1. Both queues flip face-up.
     2. Both sides' block resets to 0, then all block effects from both sides apply.
     3. All damage from both sides applies (block absorbs first, then poise). Perks apply. Exhausted cards go to exhaust, the rest to discard, and both hands are discarded.
     4. The result is recorded in `lastReveal` for the UI.
  4. **KO check:**
     - Only one side at poise ≤ 0: the other side wins by KO.
     - **Both** sides ≤ 0: the higher remaining poise wins (a tie goes to the defender), and it counts as a KO.
  5. **Timeout:** otherwise `round++`. After `MAX_ROUNDS` (3) the defender wins. In a faceoff the higher poise wins, and a tie goes to Red.
- **Block** never carries over between rounds.
- **Deck:** the user's 12-card deck is shared across the whole match. When the draw pile runs out, the discard pile is shuffled back in. Exhausted cards are gone for the match.
- **Position perks:**
  - LW/RW add +2 damage on `shot`-tagged cards.
  - LD/RD add +2 on `check`- and `block`-tagged cards.
  - C draws +1 card in faceoffs.

### Outcomes
| Duel | Attacker | Defender | Attacker wins | Defender wins |
|---|---|---|---|---|
| faceoff | user C | cpu C | user C gets the puck | cpu C gets the puck |
| deke | carrier | adjacent opponent | carrier keeps the puck, defender stunned | defender takes the puck, carrier stunned |
| check | checker | carrier | checker takes the puck, carrier stunned | checker stunned |
| intercept | passer | lane opponent | pass completes to the receiver | lane opponent takes the puck |
| shot | carrier | opposing G | **GOAL** (G poise reaches 0), game over | Timeout, two cases. **Clean save** (the G lost no poise all duel): G freezes the puck, and the goalie's team gets possession at the tile in front of the crease **[PM]**. **Otherwise rebound:** the puck goes loose on that tile, and a skater standing there gets it. |

- **Goalies only block [C]:** in a shot duel, the goalie side may only play cards that have a `block` effect. For the user that means other cards show as unplayable, and for the CPU its plan only picks block cards. Goalie cards deal no damage, so the shooter can't be KO'd.

- The tile in front of the crease is `(1,3)` for the Blue net and `(13,3)` for the Red net.
- **Stun:** a stunned skater skips its team's next turn, meaning the next turn where its team is active, not the current one. Stunned skaters can't move, don't set off contact, and can't receive passes.
- **Possession change during your own turn:** your remaining MP stays. You can keep moving, but you no longer have the puck.

## 5. Starter deck (12 cards, user)
| Card | Cost | Effect | Tags | Allowed in |
|---|---|---|---|---|
| Deke ×2 | 1 | 6 damage | skill | any |
| Toe Drag ×1 | 2 | 10 damage | skill | any |
| Protect Puck ×2 | 1 | 5 block | block | any |
| Stickhandle ×2 | 1 | 3 damage, draw 1 | skill | any |
| Wrist Shot ×2 | 1 | 7 damage | shot | shot |
| Slapshot ×1 | 2 | 14 damage, exhaust | shot | shot |
| Body Check ×1 | 2 | 9 damage | check | check |
| Poke Check ×1 | 1 | 5 damage | check | any |

Cards that aren't allowed in the current duel stay in hand and show as unplayable.

## 6. CPU intent scripts — removed
Replaced by the CPU deck (§4, decided by Chris). Red's cards are **hidden** from the user [C]. Round timing is being decided (see §4).

## 7. CPU board AI (heuristic, no search)
Each call returns exactly **one** action. Priority order:
1. In the `roll` phase, roll.
2. If the carrier is in the offensive zone and MP ≥ 3, shoot.
3. If the carrier has MP, step toward the opponent's net. Pick the neighbor that cuts distance and has the fewest adjacent opponents. A pass forward to a free teammate is allowed if it gains ≥ 3 columns.
4. If the CPU doesn't have the puck, the non-stunned skater closest to the puck either steps toward it, or `CHECK`s if it's adjacent to the carrier.
5. If there's no useful step, `END_TURN`. It must never loop forever: stop once MP is 0 or after 20 actions in the turn.

## 8. Shot & faceoff minigames — band mechanics

`SHOOT` and the faceoff resolve through a two-band minigame instead of a card duel: an ante card sets a *width*, then a timed press (or its seeded auto-resolve fallback) lands in one of several nested bands. See `engine/shotModel.ts`/`engine/shotDuel.ts` and `engine/faceoffModel.ts`/`engine/faceoffDuel.ts`.

### Shot (`ShotBand`: perfect / good / weak / miss)
- The timing bar has two concentric zones measured from center: a **yellow** (perfect) zone and a **blue** (good) zone. `miss` is a UI-only "no press" state — the engine's own band roll (CPU, or the reduced-motion/headless fallback) never produces it.
- **[C] Difficulty lives in band width, never in press speed.** A card's `accuracy` widens the yellow (perfect) zone only; the blue (good) zone stays a constant width, so a low-accuracy card still reliably lands at least `good`.
- The wing (LW/RW) perk adds accuracy, not power, and applies identically whether the human or the CPU shoots.
- **Wing perk tuning.** `PERK_WING_SHOT_ACCURACY` (15, on the same 0-100 accuracy scale as a card) widens the yellow/perfect band by roughly 0.023 of the `[0,1]` track - noticeable on a press without letting the perk override the card choice.
- Save resolution is one shared function (`rollShotSave`) for both the human and CPU shooter: `saveChance = BASE_SAVE_BY_BAND[band] + poiseFactor(goaliePoise) - power`, clamped and rolled through `engine/rng.ts`.
- A `good`/`perfect` save additionally rolls a separate "covered" chance (`SHOT_COVER_CHANCE`); `covered` and `rebound` are mutually exclusive, and `covered` is never rolled on a `weak`/`miss` save.
- **[C] A perfect shot is still saved ~20% of the time.** `BASE_SAVE_BY_BAND.perfect` is Chris's explicit ruling, not a tuning accident - goaltending stays real even on a perfectly-timed press. The full per-band save chances (`good`/`weak`/`miss`) live with `BASE_SAVE_BY_BAND`'s own doc comment in `data/balance.ts`.

### Faceoff (`FaceoffBand`: clean / scrum / late / jump)
- **[C] Centres genuinely compete — the faceoff draw is not shaped like the shot.** Unlike the shooter/goalie split, both centres ante a card and produce a real reaction band; the exact same symmetric contest function (`rollFaceoffHeadToHead`) decides the draw for both sides. There is no separate, privileged resolution path for the human or the CPU.
- **[C] Difficulty lives in the reaction-window widths, never in how long the linesman holds the puck.** The pre-drop hold (`rollDropDelayMs`) only decides *when* the puck drops.
- Anticipation widens the `clean` window only; the `scrum` window is a constant width, so a slow draw is never a complete write-off.
- **[C] A scrum fires only on a genuine tie**: when both centres land the *same* non-`clean` band (`scrum`/`scrum` or `late`/`late`), the result is an automatic scrum — no roll, `winChance` is 0. Otherwise (either side `clean`, or the bands differ): `winChance = 50 + (BASE_WIN_BY_BAND[userBand] - BASE_WIN_BY_BAND[cpuBand]) + (userGrip - cpuGrip)`, clamped to `[0, 100]`. When both bands are equal (including both `clean`), the band terms cancel and grip alone decides it around a fair 50/50.
- A `jump` (pressing before the drop) is human-only — the engine's own seeded band roll never produces one; it's a genuine false start only possible from a live timed press. A second jump in the same faceoff forfeits the draw outright to the opponent.
- **Derivation — the human-reaction anchor.** `FACEOFF_CLEAN_WINDOW_BASE_MS` (190ms) is anchored on human simple-visual-reaction-time research: median untrained reaction ~250ms, a trained player ~200ms, ~150ms is exceptional and often a guess. 190ms sits just under the trained-player mark, so a clean win at 0 anticipation is a real ask, not a given. An earlier pass used 80ms, which sat below every one of those floors and made a clean win unreachable for any human at any card - don't lower this constant without re-deriving from the same anchor. The CPU's (and the reduced-motion/headless fallback's) simulated reaction time is sampled up to `FACEOFF_REACTION_SAMPLE_CEILING_MS`, anchored on the same research (twice the median), not as a self-referential multiple of the window widths.

## 9. Out of scope (MVP) [C]
Deckbuilding and rewards, run maps, relics, persistence, real NHL teams, sound, and multiplayer.
