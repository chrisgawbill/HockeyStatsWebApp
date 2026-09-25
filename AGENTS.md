# HockeyStatsWebApp Agent Entry Point

Keep startup context small.

1. Read `docs/agent-development.md`.
2. Read the shared delivery contract, the selected ticket's decision-checkpoint row, and its block in `docs/agent-ticket-index.md`; do not read unrelated ticket blocks when a ticket ID is known.
3. Search `docs/architecture.md` for ticket-relevant headings/terms and read only those sections; do not dump the whole file.
4. Search for relevant symbols/files, then inspect the smallest useful ranges before editing.
5. Do not preload legacy backlog/progress docs unless the compact ticket has a specific missing requirement.

The human stakeholder is Product Owner and stays involved in product decisions.
"Start <ticket>" approves that ticket only. Carry forward decisions already made;
bring unresolved gameplay, presentation, and scope choices to the human with
concrete options and a recommendation before implementing affected work.

Workflow and model routing live in `docs/agent-development.md`: the PM owns
scope, shared discovery, bounded dispatch, and evidence review. Use the smallest
team appropriate to the task; pass task-specific context instead of full history.

## Context budget

Use progressive disclosure:
- **Tier 0:** this file + selected compact ticket.
- **Tier 1:** relevant architecture section(s) + directly named source files.
- **Tier 2:** neighboring files/types/helpers only when an unresolved dependency requires them.
- **Tier 3:** legacy docs/history only when a concrete missing fact cannot be found in current code/docs.

Stay at the lowest tier that permits correct work. Do not recursively browse "for context."

Prefer targeted search/ranges over full-file reads for large files. Do not reread unchanged files after editing unless verification exposes a reason. Do not paste or retain successful command logs; keep only the result needed for the ticket. Avoid broad repo-wide searches after the implementation path is known.

Apply the delegation criteria in `docs/agent-development.md`. Small, low-risk
changes may stay single-agent; substantial implementation uses separate coding
and QA workers. Required ticket checks and human acceptance still apply.

At completion follow `docs/agent-development.md` and report:
- `EXECUTION: single-agent | multi-agent — <roles only if multi>`
- `CONTEXT: targeted | expanded`
- `EXPANSION: none | <one short reason>`
