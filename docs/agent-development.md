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
   "Readability pass"), re-running the checks if anything changed.
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
The coder runs the repo's own checks (unit tests, typecheck, build, format) and
the ticket's required tests. Browser verification (responsive layout,
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

## Readability pass (Product Owner rule)

Code ships readable by a person new to the file. On the passed diff, the PM:

- splits long or deeply nested functions into small, well-named ones;
- removes duplication, dead code, and speculative options;
- gives a UI piece used in more than one place (or a large component's
  distinct parts) its own component file: cross-feature ones in
  `components/`, feature-only ones in the feature's `components/`;
- reuses before it adds: search for an existing component that shows the
  same thing and extend it (a prop or a slot) instead of writing a near-copy
  file or an inline component that duplicates one; merge duplicates found
  in the diff;
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

Optimize total tokens per accepted ticket, including PM, workers, and repairs. When usage is available, append one compact ticket record: total tokens,
worker count, repair cycles, and accepted/pending outcome. Otherwise mark tokens
as unavailable; do not estimate from response length. Reuse existing usage
reports rather than building tracking infrastructure. Compare similar completed
tickets and adjust delegation or context only while preserving acceptance quality.
