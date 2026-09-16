# ARCH1B REST client audit

## Observed request paths

| Representative flow | Independent REST resources | Observed behavior |
| --- | --- | --- |
| Standings | 1 | One season-wide standings request from the shared context. |
| Schedule | 1, plus stale-score refreshes | One season-wide schedule request; completed games missing scores request their existing boxscore individually. |
| Team | 6 | Summary, roster, schedule, skater summary, Corsi, and optional goalie summary are loaded in parallel. The page also reuses shared standings and schedule context data. |
| Game | 2 | Boxscore and landing payloads are loaded together; live polling repeats that same pair intentionally. |
| Matchup | 0 direct | Derives its view from the already loaded schedule context. |

## Findings

- **KEEP:** Team's six resources represent distinct view needs, and the request count/parallelism was unchanged. Game's two resources support separate boxscore and story views. No accidental duplicate caller or duplicate client implementation was found.
- **CLIENT CLEANUP:** All frontend transport now passes through `src/lib/apiClient.ts`; Axios constructs query parameters and shared transport errors there. Feature API modules define DTOs, while existing feature utilities retain domain/view-model mapping.
- **NOT WORTH CHANGING:** No payload sizes or timing evidence was available to establish meaningful over-fetching. The browser app is the only observed data consumer; the board-game's explicit sign-in sync carve-out remains separate. No endpoint proliferation or demonstrated consumer-composition failure was found.

## GraphQL signal report

**REVISIT LATER.** One representative screen (Team) composes six independent REST resources and Game composes two; Standings and Schedule each load one, while Matchup adds no direct request. There is no measured over-fetching, repeated overlapping payload/request evidence, or multiple distinct consumer requirement, and no concrete REST limitation was observed that GraphQL would plausibly solve today. Re-evaluate only if measured Team/Game latency or payload waste, additional independently shaped consumers, or recurring endpoint-composition pain appears.
