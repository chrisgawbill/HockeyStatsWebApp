# Handoff: BG-A15b cycle 2 — symmetric faceoff contest

**Status:** incomplete. Compiles clean, **203 tests pass / 3 fail.**
**Last known-good commit:** `bb0ef430` (green, QA-verified, pushed).
**WIP commit:** the commit immediately following `bb0ef430` on `claude/tpm-protocol-wzj2iu`, marked `WIP — DO NOT MERGE`.

Written 2026-09-14 by the outgoing PM session. Read this before touching the faceoff code.

---

## 1. What the feature is

Rink Quest (`react/src/features/board-game/`) has three set pieces: shots, faceoffs, and card duels (deke/check/intercept).

The **shot** is a solved, shipped pattern: pick 1 of 3 ante cards → time a sweeping bar → a seeded roll resolves it. See `engine/shotModel.ts` (pure model) and `engine/shotDuel.ts` (integration). **These two files are the template for everything below — the faceoff code is deliberately their sibling and should read like them.**

The **faceoff** was a generic card duel and felt inert. It has been replaced with an ante-plus-reaction minigame: the linesman holds the puck 700–1800ms, drops it, and the centre reacts. Reaction time buckets into a band — `clean | scrum | late | jump` — and a seeded contest resolves possession.

- `engine/faceoffModel.ts` — pure model (windows, bands, contest roll)
- `engine/faceoffDuel.ts` — integration (ante draw, pick, resolve)
- `data/balance.ts` — every tunable constant
- `data/cards.ts` — six faceoff cards

## 2. What is DONE and committed (`bb0ef430`, green)

- Faceoff card duel fully replaced. `createDuel` is never called with kind `'faceoff'`.
- Three outcomes: **clean win** (carry + card effect fires), **scrum** (puck loose adjacent to the dot), **loss**.
- Five `faceoffEffect` behaviours: `backDraw`, `stunLoser`, `bonusMp`, `scrumOnLoss`, `freeJump`.
- Faceoff spot table (`data/rink.ts`, `FACEOFF_SPOTS`): centre ice plus two end-zone dots flanking each net. A centre-ice draw resets the full formation; an **end-zone draw moves only the two centres**.
- Covered-puck routing (a smothered save whistles play dead and draws at the correct end-zone dot).
- Goalie buff: shot conversion measured down from 56.0% to ~50%.
- 204 tests, QA-verified as substantive (not vacuous).

## 3. What the UNFINISHED rework is trying to do

Chris ruled: **"centres should compete, shouldn't be like shot."**

The committed version resolves the draw *asymmetrically* — the user's contest decides possession, and the CPU's contest only gates whether its own buff fires. That was a reasonable reading of an underspecified ticket, and it is **rejected**. The draw must be genuinely head-to-head.

Target design (the WIP is partway here — `rollFaceoffHeadToHead` exists in `faceoffModel.ts`):

- Both centres ante a card and both produce a reaction band.
- **One symmetric contest function, both sides through it. No user/CPU fork, no privileged path for either.**
- Both bands `clean` → contested roll, grip difference decides.
- One band strictly better → that side favoured; `winChance = band edge + (own grip − opponent grip)`, clamped, seeded.
- **Neither side lands `clean`** (both `scrum` or `late`) → SCRUM. This is now the natural scrum trigger, rather than one side's band.
- `scrumOnLoss` converts its holder's loss into a scrum.
- The winner's `faceoffEffect` fires **only if their band was `clean`**.
- Jump/re-drop is per-side; each centre can false-start independently; `freeJump` exempts its holder.

Reuse `BASE_WIN_BY_BAND` — do not invent a second table.

## 4. The 3 failing tests — your actual task

### Failure A (2 tests) — headless sim hangs
```
ai/cpuBoardAgent.test.ts
  "200 seeded headless games per length > all 200 short games end in gameOver within 400 turns"
  "... > all 200 long games end in gameOver ..."
  expected 'roll' to be 'gameOver'   (line ~57)
```
Games stall in phase `'roll'` and never finish.

**Untested hypothesis from the outgoing PM — verify before trusting it.** `ai/autoplay.ts` is **not** in the WIP's modified-file list, but the rework changed the faceoff action sequence: a faceoff now needs *both* centres to ante and react where before only one side did. If `autoplay.ts` still drives the old single-sided sequence, the faceoff never completes and the game stalls. One cause would explain both failures. Read `ai/autoplay.ts` and `engine/faceoffDuel.ts` side by side and compare the dispatch sequence against what the reducer now requires.

### Failure B (1 test) — CPU band not varying
```
engine/faceoffDuel.test.ts
  "the CPU centre goes through the identical head-to-head contest as the user
   (no privileged path) > the CPU's own card effect fires on some of its wins
   and not others - proof its band genuinely varies rather than being fixed"
  expected false to be true   (line ~446, sawNotFired never true across 4000 seeds)
```
The CPU's card effect fires (or doesn't) invariantly across 4000 seeds, which means its band isn't genuinely varying. **This test is the guard against exactly the asymmetry Chris rejected — it is asserting the right thing. Do not weaken it to get green.**

## 5. Also outstanding (approved, not started)

**The reduced-motion auto-resolve is close to a forfeit.** The last sim measured the user-side auto-resolve landing `late` **50.9%** of the time, from `rollBandFromAnticipation`'s pre-existing sampling domain. That path is the `prefers-reduced-motion` accessibility fallback, and it must be *genuinely competitive, not a forfeit*. Fix it the way the CPU's sampling was fixed: sample from a human-plausible reaction range anchored on the documented ~250ms median / ~200ms trained figures, behind a **named constant**, not a literal. Report the auto-resolve and CPU distributions side by side on the same cards to show they're comparable.

## 6. Settled — do NOT change these

Each was measured or explicitly ruled on. Changing one silently undoes real work.

| Constant | Value | Why |
|---|---|---|
| `BASE_SAVE_BY_BAND` | perfect 20 / good 48 / weak 73 / miss 96 | Tuned to land shot conversion at ~50%, down from a measured 56.0%. `perfect: 20` is Chris's anchor — a perfect shot is still saved ~20% of the time. |
| `SHOT_COVER_CHANCE` | 25 | Placeholder, Chris-tunable by feel. |
| `POISE_SAVE_PENALTY_MAX` | 15 | Untouched second lever if conversion plays high. |
| `SHOT_YELLOW_BASE_WIDTH` | 0.03 | Chris shrank the default perfect zone from 0.05. |
| `SHOT_YELLOW_WIDTH_PER_ACCURACY` | 0.0015 | |
| `SHOT_BLUE_BAND_WIDTH` | 0.32 | |
| `FACEOFF_CLEAN_WINDOW_BASE_MS` | 190 | **Anchored on human reaction time.** An earlier pass used 80ms, which put a clean win below the ~250ms median / ~200ms trained floor and made it unreachable for any human at any card. Do not lower it without re-deriving from that anchor. |
| `FACEOFF_WINDOW_PER_ANTICIPATION_MS` | 1.0 | |
| `FACEOFF_SCRUM_WINDOW_MS` | 420 | |

Also standing:
- **Difficulty lives in window/band width, never in speed.** Chris's explicit ruling, first for the shot bar and carried to the drop. Never make the game harder by speeding something up.
- **All RNG through `engine/rng.ts` with the seed in state. Never `Math.random`.** Determinism is tested.
- **No new `DuelKind`, `Phase`, or `Puck` variant.** A scrum reuses the existing `{ kind: 'loose', pos }` shape.
- **No magic numbers in engine code.** Tunables are named constants in `data/balance.ts` — Chris owns that file.
- `STARTER_DECK` is 19 entries, each of the six faceoff cards once.

## 7. Known side effects already absorbed

- A pre-existing bug was found and fixed: `ruleBlockReason` only recognised `shotOnly`/`checkOnly`, so faceoff-only cards leaked into deke/check/intercept hands once they entered `STARTER_DECK`. The fix moved the `check` duel's attacker-win split from 46% → 35%. Correctness fix, but it shifted balance — worth a playtest.
- Average game length dropped 9.6 → 8.2 turns (~15% shorter) because faceoffs now genuinely resolve.
- Scrum rate measured 15.1%, under the ~35% threshold that would mean the windows are too tight.

## 8. How to verify

From `react/`:
```
npm test            # target: all green, currently 203 pass / 3 fail
npm run tsc         # must stay clean
npm run format:check
```
`format:check` has **3 known pre-existing failures** in files unrelated to this work — `clinchStatus.ts`, `teamPageTypes.ts`, `teamPageHelper.ts`. Leave them alone; they predate all of it.

Balance claims are measured with `playHeadlessGame` from `ai/autoplay.ts` (returns `duelOutcomes`, each with `kind` and `goal`). Use ≥300 games across distinct seeds, both `'short'` and `'long'`. Write any measurement harness as a throwaway **outside** `react/src` and delete it — do not leave one behind.

## 9. If you'd rather start over

`git reset --hard bb0ef430` returns you to the verified-green integration and discards the symmetric rework entirely. The design spec in §3 is complete enough to rebuild from scratch, and roughly half the WIP is test churn. That is a legitimate choice, not a failure.

## 10. Still unbuilt after this

**BG-B25**, the faceoff UI, specced in `docs/board-game-backlog.md`. It builds against whatever contest contract §3 settles on, so **finish the symmetric rework before starting it** — an underspecified contract is exactly what produced the rejected asymmetric version. The backlog ticket carries the full UI requirements, including the reduced-motion fallback that §5 depends on.
