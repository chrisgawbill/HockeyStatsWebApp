# Cleanup Backlog

Only current cleanup work is kept here. Design work is tracked in `docs/design-polish-tickets.md`.

## [ ] C-DOC1 — RinkQuest comment/JSDoc cleanup

**Goal:** Remove comment archaeology/noise while preserving concise, useful TypeScript hover documentation and unrecoverable design rationale. Zero behavior change.

### Agent protocol

**PM = brain. Coding agents = hands.** This ticket runs in one fresh PM session.

PM responsibilities:
- Inspect RinkQuest comments/JSDoc and classify them before dispatching edits.
- Own every KEEP / TIGHTEN / STRIP / MOVE decision.
- Batch work by area: `engine/` → `data/` → `components/` → `ai/`.
- Give coding agents exact files/comments or an unambiguous mechanical rule for that area.
- Review diffs and tests. PM writes no application code.
- If a comment contains uncertain measured data, design rationale, or unrecoverable information, PM asks Chris before authorizing deletion.

Coding-agent contract:
- **Do not decide what documentation is valuable. Do not plan or reinterpret the taxonomy.** Execute the PM's classifications.
- Make only comment/JSDoc/doc edits explicitly authorized by PM. No code logic, renames, reorderings, formatting churn, or opportunistic fixes.
- Run only PM-specified checks.
- Return: `DONE`/`BLOCKED`; changed files; checks + result; uncertain item only if execution exposes something outside PM instructions. No narrative.

Maximum 3 correction cycles. On PASS, PM marks this ticket complete, commits, reports in <=3 sentences, and stops.

### PM classification rules

**STRIP**
- Ticket archaeology (`BG-A13`, `A14a`, `B20`, etc.). Git history owns when/why a ticket changed something.
- Narrative history: “was X, now Y”, “used to”, “replaces old”.
- PM/agent process notes.
- `//` comments that merely restate nearby code.

**KEEP / TIGHTEN**
- Declaration JSDoc that adds useful hover information: units, ranges, scales, invariants, ordering, failure modes, safety rails, or non-obvious usage.
- Non-obvious local `//` rationale that prevents a real mistake and would be hard to discover elsewhere.
- `data/balance.ts` is intentionally conservative: every tunable constant keeps concise meaning plus unit/range where useful.

**MOVE to `docs/board-game-design.md`, then remove source history**
- Measured results/provenance such as shot conversion, scrum rate, or average-turn simulations.
- Design rulings such as perfect-shot save chance, difficulty changing band/window width rather than speed, genuine centre competition, and scrum-on-tie behavior.
- Derivations such as the human-reaction-time basis for faceoff windows.

A MOVE must land in docs before its source rationale is removed.

### JSDoc standard

TypeScript carries types; JSDoc carries only information the type/name cannot.

- Prefer one-line JSDoc; ~3 prose lines maximum unless a genuine contract needs more.
- Lead with useful meaning, not “This function…” or “Helper that…”.
- Do not restate the signature/type.
- Keep units, ranges, direction, invariants, ordering, and failure behavior when useful.
- `@param`/`@returns` only when adding information not obvious from name/type.
- `@example` only for genuinely non-obvious flows such as ordered multi-step interactions or seed threading.
- Each exported declaration needing a tooltip gets its own immediately attached JSDoc; grouped comments do not count. Check cases such as `MIN_SAVE_CHANCE` / `MAX_SAVE_CHANCE`.

### Scope and execution

PM processes one area at a time and sends an execution-only coder contract. Commit/review by area so mistakes are easy to isolate.

Out of scope:
- Test-file descriptive comments.
- Stats-app/API comments.
- Any runtime behavior change.

### PASS

- `engine/`, `data/`, `components/`, and `ai/` have been reviewed under the taxonomy.
- Ticket/history/restatement noise authorized by PM is removed.
- Useful declaration JSDoc is concise and correctly attached.
- All moved rationale exists in `docs/board-game-design.md` before source removal.
- No measured/design fact was deleted without PM certainty; uncertain high-value facts were escalated to Chris.
- Full existing test/type/build checks requested by PM pass with no behavior change.
- PM reviews the final diff specifically for accidental code edits and confirms none.
