# Agent-Driven Development

## Authority and stakeholder involvement

Default workflow: **Human stakeholder → Luna PM → bounded workers when needed**.
The human is Product Owner and final decision-maker. The PM is the reasoning and
coordination lead; coding and QA agents are workers with bounded instructions.

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

## Context policy

1. Read `AGENTS.md`, the backlog's shared delivery contract, the selected ticket's
   decision-checkpoint row, and its ticket block.
2. Read only relevant design and architecture sections.
3. Inspect directly relevant source files using targeted searches and ranges.
4. Expand to neighboring files only to resolve a concrete uncertainty.
5. Consult legacy docs/history only when current sources lack a required fact.

A requested design/backlog review may read the full documents in scope. Avoid
unrelated discovery, repeated unchanged reads, and successful raw logs. Give each
worker the selected ticket, approved decisions, minimum file list, and observable
acceptance criteria rather than the entire conversation.

The PM performs shared discovery once and records reusable facts and approved
decisions in the selected ticket. Workers read applicable repository instructions
and their task packet, expanding only for a specific missing fact. Do not forward
full conversation history by default. Reference authoritative sections instead
of duplicating them across docs or asking each worker to repeat discovery.

## Delegation criteria

PM handles documentation and small, low-risk, localized changes directly when
acceptance is clear and targeted verification is sufficient. Use a separate coder
and independent QA for substantial implementation, gameplay/state changes, data
contracts, or changes spanning coupled components. Ticket-required independent
review still applies. Do not add planning, discovery, or summarization agents by
default. Parallelize only substantial independent tasks with explicit ownership.

## Model routing and responsibilities

| Role | Preferred model | Responsibility |
| --- | --- | --- |
| PM | Luna | Reason through rules and dependencies, prepare human decisions, write worker contracts, interpret QA evidence, and own delivery. |
| Coder | Luna, separate worker | Implement the approved contract, add relevant tests, and report changes and uncertainties. |
| QA | Mini, separate worker | Run specified tests and browser checks, compare results against acceptance criteria, and report evidence. |
| Escalation | Sol | Help the PM with difficult interactions, architecture questions, or reasoning-related failures; perform a bounded repair when assigned. |

Use available Luna/Sol model IDs rather than assuming a release number. Mini is
the preferred QA model when available. If it cannot be selected, use a separate
Luna QA worker and report the substitution; never claim a model ran when it did
not. If Luna or Sol is unavailable, report the available equivalent used without
silently changing responsibilities. This document does not switch an already
running agent's model.

PM reasoning defaults to medium; raise it for ambiguous decisions. Coder effort
should match the ticket. QA may use low reasoning for deterministic checks, but
must report unverified criteria instead of inferring a pass. Sol is an escalation
within approved scope, not permission to change the product.

## Execution loop

1. PM confirms scope, dependencies, prior approvals, and unresolved decisions.
2. PM defines expected behavior, edge cases, and verification before dispatch.
3. PM or Luna coder implements the bounded task and runs relevant checks.
4. For delegated implementation, independent Mini QA verifies the contract; for
   direct work, PM performs the required verification.
5. PM interprets the evidence and checks that meaningful criteria were covered.
6. On failure, send the failing assertion and relevant trace to the coder.
7. Use Sol when deeper reasoning is needed; do not merely repeat a failed plan.
8. After three repair cycles, return the remaining problem and smallest required
   decision to the human before a fourth cycle.
9. After QA passes, the PM does a readability pass on the ticket's diff (see
   "Readability pass") and re-runs the coder-owned checks if anything changed.
10. Present the result and obtain any human acceptance required by the ticket.

Choose direct or delegated work using the delegation criteria above. Parallelize independent tasks only; do not
let workers edit tightly coupled files concurrently. QA does not fix application
code or decide product tradeoffs. The PM owns those follow-ups.

## Verification

QA is an execution and evidence role, not merely a test-command launcher. A green
build alone cannot verify new rules, fairness, or visual behavior. PM specifies
the checks and expected results; QA reports PASS, FAIL, or BLOCKED for each
criterion, including checks that could not run. PM resolves missing coverage.

Tickets involving responsive layout, screenshots, interaction, or accessibility
require browser verification. Use selective evidence tied to acceptance criteria.
Human playtests decide feel and fun. Never substitute source inspection for
required rendered checks or automated tests for stakeholder acceptance.

Assign verification ownership before dispatch: coder runs focused checks; QA
checks acceptance and owns the broader required suite and browser scenarios.
PM reviews evidence and verifies integration once without rerunning every passing
command. Repeat checks when code, environment, failures, or missing coverage
justify it. Independent QA must exercise behavior, not merely accept the coder's
report. Preserve all ticket-required checks and human acceptance gates.

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
RUN: <coder-owned checks; identify checks reserved for QA>
RETURN: outcome, changed files, check results, unresolved issues; concise
EVIDENCE: <artifact paths for detailed logs or reports when needed>
```

QA dispatch:

```text
TICKET: <id/title>
READ: <applicable instructions, relevant files, and approved decisions>
VERIFY: <criteria and expected behavior, including edge cases>
RUN: <commands and any browser scenarios>
DO NOT: modify application code or redefine acceptance criteria
RETURN: PASS|FAIL|BLOCKED per criterion; concise evidence and unverified items
ON FAILURE: failing assertion and at most 10 relevant log lines
```

Workers report missing decisions or scope conflicts to the PM. They do not invent
rules to finish a ticket. PM turns unresolved product questions into concrete
choices for the human and records the resulting decisions in the relevant docs.

## Readability pass (Product Owner rule)

Code ships readable by a person new to the file. On the passed diff, the PM:

- splits long or deeply nested functions into small, well-named ones;
- removes duplication, dead code, and speculative options;
- names things for what they mean in the domain, not how they are computed;
- gives every variable, parameter, and function a name that says what it
  holds or does (`favoriteTeams`, `updatedRowCount`, `isLabelTooLong`), not
  `data`, `res`, `e`, `tmp`, `x`, or a bare `updated`/`normalized`;
- keeps data flow one-directional and obvious (no hidden mutation, no flags
  that change a function's meaning, no reaching across layers);
- names functions for what they do, as a verb phrase (`listFavoriteTeams`,
  `parseCategoryUpdate`), not `handle`, `process`, `doStuff`, or `helper`;
- writes idiomatic code for the language and the file's existing style
  (e.g. CommonJS and `async`/`await` in the API, typed React function
  components and hooks in the frontend); no patterns borrowed from another
  language;
- puts comments on functions to say what they do; inline comments inside a
  function body are rare and only explain a non-obvious why.

Behavior must not change: the same checks must still pass afterwards.

## Commits and branches (Product Owner rule)

Branch names describe the work (`feature/<short-topic>`). Do not mention
Claude or any AI tool in code, comments, commit messages, or pull requests,
and commit as the repository owner.

## Ticket states and completion

Use `docs/agent-ticket-index.md`: IDEA, READY, ACTIVE, BLOCKED, DONE. Human
approval moves an idea into approved work; PM may record that approval and start
only the authorized ticket. DONE requires verification and any stated human
acceptance. Do not silently start another ticket.

Report what changed, what was verified, and any caveat or pending human decision.
Append:

```text
EXECUTION: single-agent | multi-agent — <actual roles/models if multi-agent>
CONTEXT: targeted | expanded
EXPANSION: none | <one short reason>
```

Report model substitutions once. Never describe a planned worker as executed.

## Efficiency measurement

Optimize total tokens per accepted ticket, including PM, workers, repairs, and
QA. When usage is available, append one compact ticket record: total tokens,
worker count, repair cycles, and accepted/pending outcome. Otherwise mark tokens
as unavailable; do not estimate from response length. Reuse existing usage
reports rather than building tracking infrastructure. Compare similar completed
tickets and adjust delegation or context only while preserving acceptance quality.
