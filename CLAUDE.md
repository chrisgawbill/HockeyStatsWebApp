# Working on HockeyStatsWebApp with Claude Code

Read and follow [AGENTS.md](AGENTS.md) and
[docs/agent-development.md](docs/agent-development.md) first. They define the
workflow, context budget, verification and Product Owner rules.

## Skills

Use [Ponytail](.claude/skills/ponytail/SKILL.md) for implementation: understand the
flow, reuse existing components, helpers and design tokens, and make the smallest
complete fix. It is also available as `/ponytail full`. Its upstream MIT license is
bundled alongside it.

A "ponytail sweep" means running Ponytail over the branch's diff and trimming what
it finds before the hand-off to Spotter. The Product Owner rules in
`docs/agent-development.md` (readability pass, commits and branches) take
precedence where they differ from Ponytail.

## Spotter

Spotter is a general QA tool and stays project-agnostic. This repository owns its
browser specs in `react/qa/`; Spotter's per-project config lives with Spotter.
Never add Spotter packages, imports or config here, and never put HockeyStats
logic into Spotter outside its project config.
