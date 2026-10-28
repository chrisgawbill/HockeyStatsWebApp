# Agent-Driven Development

## Authority and stakeholder involvement

Default workflow: **Human stakeholder → Luna PM → bounded workers when needed**.
The human is Product Owner and final decision-maker. The PM is the reasoning and
coordination lead; coding agents are workers with bounded instructions.
Frontend QA is Spotter, the in-house tester, which runs against a pushed branch.

Work inside the human-approved request or ticket. `Start <ticket>` approves that
ticket only. Carry forward earlier approvals without asking again. Routine
implementation choices belong to the PM and coder; unresolved gameplay rules,
visual direction, balance tradeoffs, team/player identities, scope expansion,
and architecture or data-contract changes outside approved scope belong to the
human. Bring a concrete example, options, and a recommendation before affected
implementation. Continue independent approved work while awaiting a decision.

Keep the human involved throughout: explain the intended player experience at
ticket kickoff, raise material choices before committing to them, and provide a
playable result or selective screenshots for experiential acceptance. Passing
tests does not establish that a mechanic is fun or a layout feels right.

## Context and documentation ownership

[AGENTS.md](../AGENTS.md) owns startup and progressive disclosure.
[Code conventions](code-conventions.md) own readability rules; apply them during
implementation and review. [Architecture](architecture.md) owns boundaries and
current system behavior. Product designs own intended behavior. Each
[ticket](agent-ticket-index.md) owns its scope, decisions, state and evidence.
Link to these sources instead of copying their rules.

The PM performs shared discovery once. Give workers the ticket, approved
decisions, minimum file list, and acceptance criteria, not full conversation
history. Workers expand only for a specific missing fact. Documentation reviews
may read the documents in scope.

## Delegation criteria

PM handles documentation and small, low-risk, localized changes directly when
acceptance is clear and targeted verification is sufficient. Use a separate coder
for substantial implementation, gameplay/state changes, data contracts, or
changes spanning coupled components. Do not add QA, planning, discovery, or
summarization agents. Parallelize only substantial independent tasks with
explicit ownership.

## Model routing and responsibilities

| Role | Preferred model | Responsibility |
| --- | --- | --- |
| PM | Luna | Reason through rules and dependencies, prepare human decisions, write worker contracts, hand the branch to Spotter, interpret its results, and own delivery. |
| Coder | Luna, separate worker | Implement the approved contract, add relevant tests, run the repo checks, and report changes and uncertainties. |
| Escalation | Sol | Help the PM with difficult interactions, architecture questions, or reasoning-related failures; perform a bounded repair when assigned. |
| Frontend QA | Spotter (in-house, not an agent) | Tests a pushed branch in the browser against the ticket's acceptance criteria. |

Use available Luna/Sol model IDs rather than assuming a release number. If Luna
or Sol is unavailable, report the available equivalent used without silently
changing responsibilities; never claim a model ran when it did not. This
document does not switch an already running agent's model.

PM reasoning defaults to medium; raise it for ambiguous decisions. Coder effort
should match the ticket. Sol is an escalation within approved scope, not
permission to change the product.

## Execution loop

1. PM confirms scope, dependencies, prior approvals, and unresolved decisions.
2. PM defines expected behavior, edge cases, and verification before dispatch.
3. PM or Luna coder implements the bounded task and runs the repo checks.
4. PM reviews the diff against the contract and does the readability pass (see
   [code conventions](code-conventions.md)), re-running the checks if anything changed.
5. PM commits and pushes the work to the ticket's branch for Spotter to test,
   and tells the human the branch, commit, and what Spotter should check.
6. On a Spotter or check failure, send the failing result to the coder.
7. Use Sol when deeper reasoning is needed; do not merely repeat a failed plan.
8. After three repair cycles, return the remaining problem and smallest required
   decision to the human before a fourth cycle.
9. Present the result and obtain any human acceptance required by the ticket.
10. Record decisions, verification evidence, and acceptance in the ticket branch,
    then merge through a pull request using squash merge. Use one descriptive
    commit on main per completed ticket (or approved standalone change), following
    the commit rules below.

Choose direct or delegated work using the delegation criteria above. Parallelize
independent tasks only; do not let workers edit tightly coupled files
concurrently.

## Verification

A green build alone cannot verify new rules, fairness, or visual behavior.
The coder runs the ticket's required tests and these frontend checks from `react/`:
`pnpm tsc`, `pnpm test`, `pnpm format:check`, and `pnpm build`.
See [test documentation](../react/src/test/README.md) for coverage requirements.
Documentation-only changes use link, content-preservation, and diff checks;
frontend builds and Spotter are unnecessary unless behavior is affected.

Browser verification (responsive layout,
screenshots, interaction, accessibility) is Spotter's: push the branch and list
the acceptance criteria Spotter should check. Spotter is a general tool; its
per-project config lives with Spotter, outside this repo, and points at the
project's specs. A ticket's browser specs (Playwright, plain `.spec.mjs`) live
in `react/qa/`, named after the flow, with test titles that start with the
ticket ID and "Verify:". Do not add Spotter packages, imports, or config to
either repo; pushing the branch is the whole hand-off. Report every check that
did not run instead of inferring a pass.

Human playtests decide feel and fun. Never substitute source inspection for
required rendered checks or automated tests for stakeholder acceptance. Repeat
checks when code, environment, or failures justify it. Preserve all
ticket-required checks and human acceptance gates.

Repair dispatches contain the failure, relevant evidence, and changed decisions;
do not resend the full task history. Keep detailed logs in referenced artifacts.

## Worker contracts

Coder dispatch:

```text
TICKET: <id/title>
GOAL: <observable result>
APPROVED DECISIONS: <rules and human choices already settled>
READ: <minimum files and design headings>
CHANGE: <bounded implementation and owned files>
KEEP: <critical invariants>
DO NOT: <scope traps>
DONE: <acceptance criteria and important edge cases>
RUN: <repo checks; browser checks are left to Spotter>
RETURN: outcome, changed files, check results, unresolved issues; concise
EVIDENCE: <artifact paths for detailed logs or reports when needed>
```

Workers report missing decisions or scope conflicts to the PM. They do not invent
rules to finish a ticket. PM turns unresolved product questions into concrete
choices for the human and records the resulting decisions in the relevant docs.

## Commits and branches (Product Owner rule)

Branch names describe the work (`feature/<short-topic>`). Do not mention
Claude or any AI tool in code, comments, commit messages, or pull requests,
and commit as the repository owner.

Preserve existing main history. All future changes reach main through pull
requests using **squash merge only**; do not push changes directly to main or
create merge commits there. Repository merge settings should allow squash merge
only, and branch protection should require pull requests into main.

Keep implementation, fixes, ticket decisions, QA evidence, and acceptance updates
on the work branch until the required checks and human acceptance are complete.
Squash them into one descriptive commit per completed ticket (or approved
standalone change). Name the squash commit for the delivered behavior and include
the ticket ID when applicable; avoid generic branch names or administrative
messages such as "record merge". Intermediate branch commits may remain granular
for development and Spotter testing.

If acceptance or new verification evidence arrives after a merge, record it in a
meaningful follow-up pull request and squash that change. Do not rewrite main to
fold it into the earlier commit, and do not create a commit solely to record that
a merge happened. Rewriting published main history requires separate explicit
Product Owner approval.

Keep shared project instructions (`AGENTS.md` and the development/ticket docs)
tracked. Personal assistant settings, credentials, session history, caches, logs,
and generic installed skills belong outside version control. The local `.claude/`
directory is ignored; install generic skills through personal tooling instead of
vendoring them into this repository. Project-specific instructions remain shared
documentation.

## Ticket states and completion

Each `docs/tickets/<ID>.md` records one state: IDEA, READY, ACTIVE, BLOCKED, DONE. Human
approval moves an idea into approved work; PM may record that approval and start
only the authorized ticket. DONE requires verification and any stated human
acceptance, including a passing Spotter run on the pushed branch for tickets
with required browser checks. Record each required check as PASS, FAIL, or NOT RUN, with evidence
and the tested commit where available. Keep release/deployment follow-ups
separate from implementation status. Historical explicit Product Owner closures
remain valid, but do not imply missing checks passed or waive future gates.
Do not silently start another ticket.

Report what changed, what was verified, and any caveat or pending human decision.
Append:

```text
EXECUTION: single-agent | multi-agent — <actual roles/models if multi-agent>
CONTEXT: targeted | expanded
EXPANSION: none | <one short reason>
```

Report model substitutions once. Never describe a planned worker as executed.

## Efficiency measurement

Optimize total tokens per accepted ticket, including PM, workers, and repairs. When usage is available, append one compact ticket record: total tokens,
worker count, repair cycles, and accepted/pending outcome. Otherwise mark tokens
as unavailable; do not estimate from response length. Reuse existing usage
reports rather than building tracking infrastructure. Compare similar completed
tickets and adjust delegation or context only while preserving acceptance quality.
