# HockeyStatsWebApp Agent Entry Point

Keep startup context small.

1. Read `docs/agent-development.md`.
2. Read only the selected ticket block in `docs/agent-ticket-index.md`; do not read the whole index when a ticket ID is known.
3. Search `docs/architecture.md` for ticket-relevant headings/terms and read only those sections; do not dump the whole file.
4. Search for relevant symbols/files, then inspect the smallest useful ranges before editing.
5. Do not preload legacy backlog/progress docs unless the compact ticket has a specific missing requirement.

The human developer is Product Owner. "Start <ticket>" approves that ticket only.

## Context budget

Use progressive disclosure:
- **Tier 0:** this file + selected compact ticket.
- **Tier 1:** relevant architecture section(s) + directly named source files.
- **Tier 2:** neighboring files/types/helpers only when an unresolved dependency requires them.
- **Tier 3:** legacy docs/history only when a concrete missing fact cannot be found in current code/docs.

Stay at the lowest tier that permits correct work. Do not recursively browse "for context."

Prefer targeted search/ranges over full-file reads for large files. Do not reread unchanged files after editing unless verification exposes a reason. Do not paste or retain successful command logs; keep only the result needed for the ticket. Avoid broad repo-wide searches after the implementation path is known.

Prefer the smallest reliable execution shape. Separate agents are optional and should be used only when independent context/verification adds value.

At completion follow `docs/agent-development.md` and report:
- `EXECUTION: single-agent | multi-agent — <roles only if multi>`
- `CONTEXT: targeted | expanded`
- `EXPANSION: none | <one short reason>`
