# HockeyStatsWebApp Agent Entry Point

Keep startup context small.

1. Read `docs/agent-development.md` for authority, model routing, adaptive orchestration, and completion rules.
2. Read `docs/agent-ticket-index.md` for ticket state and the compact contract.
3. Read `docs/architecture.md` only for the sections relevant to the selected ticket.
4. Inspect directly relevant source files before editing.
5. Do not preload legacy backlog/progress docs unless the compact ticket explicitly requires missing detail from them.

The human developer is Product Owner. A command such as "start E2" is approval for that ticket, not permission to broaden its scope or start another ticket.

Prefer the smallest reliable execution shape. Do not spawn subagents just because PM/Coder/QA roles exist; use separate agents only when independent context or verification adds value.

At completion, follow the reporting format in `docs/agent-development.md`, including the `EXECUTION:` line so the human can see whether work was single-agent or multi-agent.
