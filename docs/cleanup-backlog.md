# Cleanup Backlog

Only currently relevant cleanup work is kept here. Completed/stale C1–C9 tasks were removed after the repository and API architecture changed. Design cleanup remains tracked separately in `docs/design-polish-tickets.md`.

## C-DOC1 Strip comment archaeology, move rationale to docs (Chris, 2026-09-14)

**Goal (Chris):** rip out code comments and relocate the ones that matter into `docs/`. The board-game feature especially has accumulated heavy JSDoc, much of it narrating tickets rather than explaining code.

**PM framing — this is a taxonomy, not a blanket delete.** A blanket strip would destroy real information. Several constants are indefensible without their rationale (`FACEOFF_CLEAN_WINDOW_BASE_MS = 190` is derived from human reaction time; `BASE_SAVE_BY_BAND.perfect = 20` is Chris's explicit ruling), and `data/balance.ts`'s JSDoc is the surface Chris actually tunes against. Work the three buckets below. If a comment doesn't clearly fall in one, leave it and list it in your report rather than guessing.

### STRIP — delete outright
- [ ] **Ticket archaeology.** References to BG-A13/A14a/A14b/A15a/A15b/A16/B20/B22/B25 etc. explaining *when* or *by which ticket* something changed. Git history holds this. Example: `// BG-A14b: one of each of the 4 shot-pool cards (was wrist_shot x2 + slapshot x1)`.
- [ ] **Narrative history.** "was X, now Y", "this used to...", "replaces the old...". The current state is what a reader needs.
- [ ] **PM process notes** embedded in code — split rationale, "Chris's call" attributions where the *what* is already clear from the code, agent-to-agent instructions.
- [ ] **Restatement.** Comments that say what the next line plainly says.

### KEEP — leave in place, these are contracts
- [ ] **Units, ranges, scales.** `accuracy` is 0–100; widths are fractions of the `[0,1]` track; save chances are percent.
- [ ] **Invariants a caller can violate.** "never returns `miss`"; "mutually exclusive with `rebound`"; "must not hardcode geometry in the UI".
- [ ] **Safety rails.** "all RNG through `engine/rng.ts`, never `Math.random`" — these prevent real bugs and belong where the code is.
- [ ] **Non-obvious *why* for a specific line**, where moving it to a doc would mean a reader never finds it.

### MOVE — relocate to `docs/board-game-design.md`, then delete from source
- [ ] **Measured values and their provenance.** Shot conversion 56.0% → ~50%; scrum 11.8%; average game 9.6 → 8.2 → 8.6 turns. Record what was measured, when, and by what method — these took real sim work to establish and are unreproducible from the code alone.
- [ ] **Design rulings.** A perfect shot is still saved ~20% of the time. Difficulty lives in band/window width, never in speed. Centres genuinely compete; the draw is not shaped like the shot. A scrum fires only on a genuine tie.
- [ ] **Derivations.** The human-reaction anchor (~250ms median, ~200ms trained) behind the faceoff windows, including the fact that an 80ms window made a clean win unreachable.

### Constraints
- [ ] **`data/balance.ts` is the exception — treat it conservatively.** Every constant keeps a one-line JSDoc saying what it does and its unit or scale. Chris tunes this file by reading it; a bare list of numbers is unusable. Move the *history* out, keep the *meaning* in.
- [ ] **Zero behaviour change.** Comments and JSDoc only. No renames, no reordering, no logic edits, no "while I'm here" fixes. The full suite must stay green with an identical pass count.
- [ ] **Every MOVE lands in docs before its comment is deleted.** Do not delete first and reconstruct later. If you cannot find a home for something, keep the comment and flag it.
- [ ] **Do it per-area, not repo-wide in one pass** — `engine/`, then `data/`, then `components/`, then `ai/`. One commit per area, so a bad judgement call is easy to revert.
- [ ] **Report every comment you deleted that carried a fact not now in docs.** That list is the review surface; if it's empty, say so explicitly.

### Out of scope
- [ ] Don't touch test files' descriptive comments — a test's reasoning belongs beside the assertion.
- [ ] Don't touch `api/` or the stats app in the same pass.

### Escalation rule (Chris, 2026-09-14) — applies to every C-DOC1 area
- [ ] **If you are unsure whether a comment carries real information, ASK THE PM. Do not guess, and do not delete-and-mention-it-later.** Message the orchestrator with the file, the comment verbatim, and which bucket you think it falls in, then wait for a ruling before touching it.
- [ ] Batch your questions — collect the uncertain cases for an area and ask once, rather than a message per line.
- [ ] "I wasn't sure so I kept it" is always an acceptable outcome and needs no permission. Only deletion needs certainty.
- [ ] **And the PM escalates to Chris.** If a ruling isn't the PM's to make — anything touching a measured balance figure, a design ruling, or a fact that would be unrecoverable if wrong — it goes to Chris rather than being decided by the PM. The chain is: agent unsure → PM; PM unsure → Chris. Nobody guesses at a deletion.

### C-DOC1 retarget (Chris, 2026-09-14) — JSDoc is the tooltip, so keep it and tighten it

TypeScript's language server already does what an internal doc tool would: a `/** */` block attached to a declaration is the hover tooltip at every call site. There is nowhere else to "move" a definition to — strip the JSDoc and you delete the mechanism. This supersedes the blanket-strip framing above.

Two populations, opposite treatment:

- **`/** */` JSDoc on a declaration (~292 in the board-game feature) — KEEP, but TIGHTEN.** This is the asset. Trim it; don't remove it.
- **`//` line comments inside function bodies (~158) — the real strip target.** Invisible to hover, and mostly restate the line below. These are what "rip out the comments" should mean.

**Concision standard — the point is a tooltip you can read at a glance, not an essay:**
- [ ] One line if it fits on one line. That is most of them.
- [ ] Multi-line only where a caller can actually get it wrong: units, ranges, invariants, ordering, a non-obvious failure mode.
- [ ] Lead with what it *is*. No "This function...", no "Helper that...", no restating the name or the type signature in prose.
- [ ] Never explain the obvious. `/** The board's column count. */` on `BOARD_COLS` is noise; `/** Board width in columns (col 0-14). */` earns its place by adding the range.
- [ ] Hard cap of ~3 lines outside genuine multi-part contracts. If it needs more, the reasoning belongs in `docs/` with a one-line pointer.
- [ ] **Readable still beats short.** Cutting a unit, a range, or a direction to save a word is a bad trade — those are the whole reason the tooltip exists.

**Tooltip correctness — a new check:**
- [ ] JSDoc only attaches to the declaration *immediately* below it. A block above a group documents only the first member. `MIN_SAVE_CHANCE` / `MAX_SAVE_CHANCE` is the live example: one comment covers "this range", so `MIN_` has a tooltip and `MAX_` has none. Give each exported declaration its own, however short.

**Division of labour (Chris, 2026-09-14): TS carries the types, JSDoc carries the description and the examples.** Neither does the other's job.
- [ ] **Never restate a type in prose.** No `@param {number}`, no "takes a string and returns a boolean". TS already shows it in the tooltip, and duplicated types go stale when a signature changes and the prose doesn't.
- [ ] **`@param`/`@returns` only when they add what the name and type cannot** — a unit, a range, an invariant, an ordering guarantee, a failure mode. `@param seed - the seed` is noise; `@param seed - advances on every roll; pass the returned one forward` earns its place. Nothing to add means omit the tag, not pad it.
- [ ] **`@example` where a call site is genuinely non-obvious, and it does NOT count against the ~3 line cap** — that cap governs prose. Worth one: multi-step flows whose order can't be inferred from types (`createFaceoffDuel` → `pickFaceoffCard` → `resolveFaceoffBand`, the shot equivalent), and seed-threading where the returned seed must be passed forward. Not worth one: anything obvious from the signature.
