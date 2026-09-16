# Agent Ticket Index

Short execution queue for agent-driven development. Detailed ticket requirements stay in the linked backlog files.

See `docs/agent-development.md` before dispatching any agent.

## Queue rules

- The human developer decides what becomes `READY`.
- Agents work one `READY` ticket at a time.
- The PM may recommend a next ticket but may not silently promote or start it.
- Keep this file short. Do not copy full ticket prompts here.
- If a detailed backlog ticket contains an old mentoring/persona prompt, use its goal/scope/acceptance criteria but follow `docs/agent-development.md` for agent behavior.

## Current candidates

| Status | Ticket | Source | Notes |
|---|---|---|---|
| IDEA | D1 — Visual foundation | `docs/design-feature-backlog.md` | Foundation for the Aero/MD3 direction; human selects when ready. |
| IDEA | D1B — Condense CSS | `docs/design-feature-backlog.md` | Do after D1; mechanical work suited to a low-cost coding model. |
| IDEA | D2 — Home → Game → Team visual consistency | `docs/design-feature-backlog.md` | Depends on D1. |
| IDEA | F1 — Game Story | `docs/design-feature-backlog.md` | Distinctive product feature; existing game-detail data. |
| IDEA | F2 — Team DNA | `docs/design-feature-backlog.md` | Distinctive product feature; keep derivation client-side where possible. |
| IDEA | F3 — Playoff What-If | `docs/design-feature-backlog.md` | Higher reasoning/logic burden; likely stronger coder/QA tier. |
| IDEA | E1 — Playoff race command center | `docs/exciting-features-backlog.md` | Pure derivation; no new fetches. |
| IDEA | E2 — Team form and momentum | `docs/exciting-features-backlog.md` | Pure helper + small SVG UI; good bounded ticket. |
| IDEA | E3 — Head-to-head matchup explorer | `docs/exciting-features-backlog.md` | Reuses loaded schedule data. |

## Active

None. The human developer should explicitly promote the next ticket to `READY`.

## Completed

Use existing progress/backlog completion markers as historical truth. Do not duplicate the full Phase 2 progress log here.
