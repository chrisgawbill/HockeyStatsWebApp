# GAME-STORY-01 — Game-winning goal in the game story

Delivery rules: [development workflow](../agent-development.md).

**Status:** DONE — accepted by the Product Owner 2026-11-02 and merged to
`main`. Spotter did not run before acceptance.

**Goal:** A finished game's story names the goal that won it.

**Dependencies:** GAME-SHOTS-02 (DONE; the story boxes).

**Read:** `features/game-detail/utils/gameStoryHelper.ts`,
`components/GameStory.tsx`.

**Product Owner checkpoint:** Requested 2026-11-02. Experiential review of
the screenshot.

**Decisions (2026-11-02, PM defaults under the Product Owner's request):**

- The game winner is the winner's goal that took their score to one more
  than the loser's final score (the NHL definition: ahead for good).
- Only for completed games (`OFF`/`FINAL`). A game tied after its scored
  goals, which a shootout decided, has no game-winning goal; shootout
  attempts are never counted.
- The box reads "Game winner", the score with the leader first, and the
  scorer, period, time and PP/SH/EN, in game order with the other boxes.
  When the winner is also another story goal (the only goal of a 1–0
  game), it is shown once, as the game winner.

**Scope:** `gameStoryHelper` gains `gameWinnerEventIndex` and the
`game-winner` turning point; `GameStory` gains its label. No API change.

**Acceptance:** Correct winner for regulation and overtime finals, including
a winner that is not the first lead; no box while live or for a shootout.

**Verify:** unit tests in `gameStoryHelper.test.ts`.

**Evidence:** Typecheck, unit tests (72 files, 339 tests), format check and
build PASS. Screenshot at 375 px (overtime winner, "TOR up 4–3") taken
locally against a mocked API. Spotter NOT RUN.

**Product Owner acceptance:** 2026-11-02, from the screenshots.

**Release follow-ups:** none.
