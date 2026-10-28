# Agent Ticket Index

Each ticket file is authoritative for its status, scope, Product Owner decisions,
acceptance criteria, and verification evidence. Update the ticket, not this index,
when its state changes. Add a link here only when adding a ticket.

Follow the [development workflow](agent-development.md) for the shared delivery
contract. New tickets use the [ticket template](tickets/TEMPLATE.md).
Opening Night 2.0 direction lives in [the design](opening-night-2-design.md).

Historical closure decisions are preserved. DONE is not evidence that a pending
check ran; consult each ticket's recorded checks and release follow-ups.
Imported overview records preserve evidence from the former summary table and
are historical notes, not a second status field.

## Tickets

| Ticket | Title |
| --- | --- |
| [ON2-01](tickets/ON2-01.md) | Alternating shift activation engine |
| [ON2-02](tickets/ON2-02.md) | Ranged diagonal skating and pass lanes |
| [ON2-03](tickets/ON2-03.md) | Contextual card contracts and offers |
| [ON2-04](tickets/ON2-04.md) | Hockey card library and identity packages |
| [ON2-05](tickets/ON2-05.md) | Screens and Clear Crease battles |
| [API-ON2-01](tickets/API-ON2-01.md) | Site-wide rivalry records and contract |
| [API-ON2-02](tickets/API-ON2-02.md) | Rink Quest team and player profiles |
| [ON2-06](tickets/ON2-06.md) | Team playbook and featured-star integration |
| [ON2-07](tickets/ON2-07.md) | Daily opponent and Rivalry Night selection |
| [ON2-08](tickets/ON2-08.md) | Product Owner team-content pilot |
| [ON2-09](tickets/ON2-09.md) | Pregame team, matchup, and star flow |
| [ON2-09A](tickets/ON2-09A.md) | Dimensional arena and camera prototype |
| [ON2-10](tickets/ON2-10.md) | Fullscreen broadcast match shell and arena integration |
| [ON2-11](tickets/ON2-11.md) | Physical hand and battle stage |
| [ON2-12](tickets/ON2-12.md) | Broadcast moments and Rivalry Night clash |
| [ON2-13](tickets/ON2-13.md) | Coach's Report and 2.0 release gate |
| [AAR-01](tickets/AAR-01.md) | Favorite teams and After Action Report inbox |
| [AAR-02](tickets/AAR-02.md) | Mobile push for After Action Reports |
| [API-LINES-01](tickets/API-LINES-01.md) | Real line combinations from shift charts |
| [TEAM-LINES-01](tickets/TEAM-LINES-01.md) | "Line Change" roster view |
| [API-WPR-01](tickets/API-WPR-01.md) | Favorite players and the weekly player report (backend) |
| [WPR-01](tickets/WPR-01.md) | Favorite players and the weekly report (frontend) |
| [API-WPR-02](tickets/API-WPR-02.md) | Favorite teams in the weekly report (backend) |
| [WPR-02](tickets/WPR-02.md) | Favorite teams and their form in the weekly report |
| [HOME-FAV-01](tickets/HOME-FAV-01.md) | Favorite players row on the home page |
| [API-FAN-01](tickets/API-FAN-01.md) | Fan categories for favorite teams (and players) (backend) |
| [FAN-01](tickets/FAN-01.md) | Favorite teams on home and fan categories (frontend) |
| [HOME-LEAD-01](tickets/HOME-LEAD-01.md) | Stat leaders use the favorite card on the home page |
| [STAR-01](tickets/STAR-01.md) | Favorite star in leaderboards and box scores |
| [NAV-01](tickets/NAV-01.md) | Header nav fits at 1024px |
| [FEED-01](tickets/FEED-01.md) | "My Hockey" personal feed |
| [HOME-LEAD-02](tickets/HOME-LEAD-02.md) | Swipe between phone stat leader groups |
| [HOME-LOTTERY-01](tickets/HOME-LOTTERY-01.md) | Draft lottery matches the landing page |
| [FEED-02](tickets/FEED-02.md) | Favorites move to My Hockey |
| [PREVIEW-01](tickets/PREVIEW-01.md) | Pre-game preview on the matchup page |
| [COMPARE-01](tickets/COMPARE-01.md) | Player comparison |
| [API-COMPARE-01](tickets/API-COMPARE-01.md) | Every player in the season summaries (backend) |
| [HOME-LOAD-01](tickets/HOME-LOAD-01.md) | Home sections load and fail on their own |
| [API-CACHE-01](tickets/API-CACHE-01.md) | Cache resilience (backend) |
| [API-PBP-01](tickets/API-PBP-01.md) | Play-by-play events for shot maps and game flow (backend) |
| [GAME-SHOTS-01](tickets/GAME-SHOTS-01.md) | Shot map and game flow on the game page |
| [SHARE-01](tickets/SHARE-01.md) | Share button in the phone top bar |
| [API-AUTH-02](tickets/API-AUTH-02.md) | Discord sign-in and account linking (backend) |
| [SIGNIN-01](tickets/SIGNIN-01.md) | Account icon and sign-in modal (frontend) |
| [A11Y-01](tickets/A11Y-01.md) | Accessibility fixes from the Spotter baseline |
| [API-PUSH-02](tickets/API-PUSH-02.md) | Reliable push delivery and scheduling (backend) |
| [API-PUSH-03](tickets/API-PUSH-03.md) | Account-level push settings and automatic device subscription (backend) |
| [PUSH-03](tickets/PUSH-03.md) | Automatic device subscription and account push settings (frontend) |
| [SCHED-STATUS-01](tickets/SCHED-STATUS-01.md) | Live and final states on the schedule from cached game data |

## Dependency outline

```text
ON2-01 -> ON2-02, ON2-03
ON2-03 -> ON2-04
ON2-02 + ON2-03 + ON2-04 -> ON2-05
ON2-04 + API-ON2-02 -> ON2-06
API-ON2-01 + API-ON2-02 -> ON2-07
API-ON2-01 + API-ON2-02 + ON2-04 + ON2-06 + ON2-07 -> ON2-08
ON2-06 + ON2-07 + ON2-08 -> ON2-09
existing rules -> ON2-09A prototype (may run before ON2-01)
ON2-01 + ON2-02 + ON2-05 + ON2-09 + ON2-09A decision -> ON2-10
ON2-03 + ON2-04 + ON2-10 -> ON2-11
ON2-07 + ON2-10 + ON2-11 -> ON2-12
approved implementation/content release set -> ON2-13
WPR-01 -> STAR-01, FEED-01, COMPARE-01
API-COMPARE-01 -> COMPARE-01
FAN-01 -> FEED-01
API-LINES-01 -> PREVIEW-01
API-PBP-01 -> GAME-SHOTS-01
WPR-01 + API-WPR-02 -> WPR-02
API-AUTH-02 -> SIGNIN-01
```

ON2-09A may run early using the existing game; it gates production presentation
work, not 2.0 rules or team-content delivery. Existing ticket IDs are preserved.
Recording this direction does not start implementation tickets.

`API-*` tickets are backend-owned dependencies for the independent
HockeyStatsAPI repository. Copy/adapt them to that repository's workflow before
implementation; starting them here does not authorize backend edits.
