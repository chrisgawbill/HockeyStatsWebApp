# GAME-SHOTS-02 — Clearer game flow, shot map and game story

Delivery rules: [development workflow](../agent-development.md).

**Status:** DONE — accepted by the Product Owner 2026-11-02 and merged to
`main`. Spotter did not run before acceptance.

**Goal:** The game page's charts read at a glance, and the game story says
something the scoring summary doesn't.

**Dependencies:** GAME-SHOTS-01 (DONE).

**Read:** `features/game-detail` components `GameFlowChart`, `ShotMap`,
`ShotRink`, `GameStory`, `GameDetailPage`; `GameShots.module.css`,
`GameDetailPage.module.css`; `utils/gameStoryHelper.ts`.

**Product Owner checkpoint:** Experiential review of the screenshots.

**Decisions (Product Owner, 2026-11-02):**

- Game flow: thinner goal-dot rings in the card color; the gap between the
  lines is shaded in the color of the team ahead on attempts; the
  away/home legend is removed (end labels name the lines, the subtitle
  explains dots and shading).
- Shot map: attack-direction labels move under the rink (no overlap with
  markers or the blue line); goals are larger and misses smaller and lighter
  (shots on goal unchanged); the totals line becomes an aligned two-row grid
  that also shows blocked shots.
- Game story: the goal-by-goal timeline is removed (it repeated the scoring
  summary) and the Scoring Summary moves up directly under the story. Each
  story box shows a label (First goal, Largest lead, Lead change, Tied up),
  the score with the leader first ("PHI up 5–1", "Tied 1–1"), and the scorer,
  period, time and PP/SH/EN. Boxes are in game order.

**Scope:** HTML/CSS/SVG inside `features/game-detail`. No data, API or
dependency change. Charts stay `aria-hidden`; the period table remains the
text version. Team colours stay decorative: every box, label and row names
the team.

**Exclusions:** Score labels at goal dots, attacking-zone tints, density/heat
layers, a shot-share view, a game-winning-goal box.

**Acceptance:**

- The GAME-SHOTS-01 behaviour holds: marker counts and filters, goal and
  period markers, OT, empty, 404 and no-scroll states.
- Direction labels never overlap markers; the shading follows the leader,
  including when the lead in attempts changes hands.
- The game story shows no timeline; the Scoring Summary follows it; box
  scores never wrap mid-score.
- 375/1280, light/dark, no page horizontal scroll.

**Verify:** `react/qa/game-shots.spec.mjs` (unchanged); a unit check for the
game order of story boxes.

**Evidence:** Typecheck, unit tests (72 files, 337 tests), format check and
build PASS. `qa/game-shots.spec.mjs` 8/8 PASS locally against a stand-in for
the Spotter test module and a mocked API. Before/after screenshots at
375/1280, light/dark, taken locally (not committed). Spotter NOT RUN.

**Product Owner acceptance:** 2026-11-02, from the before/after screenshots.

**Release follow-ups:** none.
