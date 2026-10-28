# HockeyStatsWebApp Agent Entry Point

Keep startup context small. Read in this order:

1. [Development workflow](docs/agent-development.md): authority, delegation,
   verification, delivery, and completion reporting.
2. The selected `docs/tickets/<ID>.md`; use the
   [ticket index](docs/agent-ticket-index.md) only to find a ticket or dependency.
3. For code changes, [code conventions](docs/code-conventions.md), then only
   ticket-relevant headings in [architecture](docs/architecture.md) and designs.
4. Search for relevant symbols and inspect the smallest useful source ranges.

The human is Product Owner. Follow the workflow's decision gates and carry
forward existing approvals. Starting a ticket authorizes only that ticket.

## Context budget

- Tier 0: this entry point, development workflow, and selected ticket.
- Tier 1: code conventions, relevant architecture/design sections, named sources.
- Tier 2: neighboring files/types/helpers needed to resolve a specific uncertainty.
- Tier 3: legacy docs/history only when current sources lack a required fact.

Stay at the lowest useful tier. Do not recursively browse for context, reread
unchanged files without a verification reason, or retain successful raw logs.
Once the implementation path is known, keep searches targeted. A requested
documentation review may read the documents in scope.

Use the workflow's delegation criteria and task-specific worker packets.
Completion reporting is defined there; do not duplicate it in tickets.
