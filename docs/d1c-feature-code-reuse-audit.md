# D1C — Audit React feature code for reuse and simplification

- **Depends on:** D1B — CSS consolidation
- **Data:** none

## Goal

Go through **every feature under `react/src/features`** and look for opportunities to reuse existing code or safely condense logic.

This is a **reuse and simplification pass**, not a rewrite. The goal is less duplication and simpler code while retaining the full existing behavior and logic.

## Look for

- duplicated helpers or calculations
- repeated data transformation logic
- repeated date, season, team, player, game, or standings logic
- components that perform nearly the same job
- repeated loading, error, or empty-state handling
- duplicated formatting logic
- repeated constants or configuration
- feature-local utilities that could be shared
- shared utilities that are unnecessarily duplicated
- dead or redundant code
- small functions that can be simplified without hiding their purpose

## Important rules

- Preserve **all existing behavior**.
- Do not redesign the UI.
- Do not change API behavior or routes.
- Do not change product requirements.
- Do not create abstractions just to make the code look cleaner.
- Only move code into shared utilities/components when **at least two real features benefit**.
- Prefer small, obvious helpers over clever abstractions.
- Keep feature boundaries clear.
- Do not combine code merely because it looks similar; confirm that it has the same responsibility and behavior.
- If duplication is intentional, leave it alone and explain why.
- If a refactor is risky or difficult to verify, leave it alone and record it for later.
- Work one feature and one small refactor at a time.

## Prompt for the developer

```text
You are mentoring me while I audit the React code in HockeyStatsWebApp. I am a junior developer and I will make the changes.

Explain things in plain English. Work through one feature at a time. Do not perform a giant refactor in one response.

Goal: find code we can reuse and logic we can safely simplify without changing what the app does.

Before changing anything:
1. Read docs/architecture.md.
2. Inspect the current react/src structure.
3. Identify every feature under react/src/features.
4. Identify shared components, hooks, helpers, types, constants, and feature-local utilities.
5. Look for the same or nearly the same logic appearing in multiple features.

For each feature, ask:
- Is this logic already implemented somewhere else?
- Can an existing helper/component/hook be reused?
- Are two components doing essentially the same job?
- Is the same data transformed more than once?
- Are date, season, team, player, game, or standings calculations duplicated?
- Are loading/error/empty patterns unnecessarily repeated?
- Are constants or formatting rules duplicated?
- Is there dead or redundant code?
- Can a small piece of logic be simplified while keeping it completely equivalent?

When you find an opportunity:
1. Explain the duplication in plain English.
2. Point to the existing code that can be reused, if applicable.
3. Explain the smallest safe change.
4. Make only that change.
5. Run the appropriate build/typecheck/tests.
6. Confirm the behavior is unchanged.
7. Only then move to the next opportunity.

Do not:
- rewrite entire features
- change product behavior
- change routes or URLs
- change API contracts
- add libraries for refactoring convenience
- create generic abstractions without a real reuse case
- merge code that has different responsibilities
- optimize prematurely

If you are unsure whether code should be shared, leave it alone and explain why.

For each completed feature, give me a short result:
- Reuse found
- Logic simplified
- Safe duplication left alone
- Nothing worth changing

At the end, report briefly:
- what was consolidated
- which existing helpers/components were reused
- whether any new shared helpers/components were created
- roughly how much duplication or unnecessary code was removed
- whether build/typecheck/tests still pass

Done when every current React feature has been reviewed and useful reuse/simplification has been applied without changing behavior.
```
