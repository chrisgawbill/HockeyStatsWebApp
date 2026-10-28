# API-ON2-02 — Rink Quest team and player profiles

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-27: profiles enabled by default; five team identities; six skater archetypes, skaters only, rank 1–3; TOR/MTL pilot; `/rink-quest` routes that refresh the roster (see block).

**Status:** ACTIVE — merged to HockeyStatsAPI `main` (`bb084dd`) 2026-10-27.
Pending: deploy check, pilot player ID check, Product Owner acceptance.

**Goal:** Link reviewed Rink Quest identities to canonical teams and players
without duplicating factual records.

**Owner:** HockeyStatsAPI repository.

**Dependencies:** Product Owner approves vocabularies and pilot records.

**Scope:**

- Team profile keyed to canonical team ID: primary identity, optional secondary
  identity, enabled state.
- Player profile keyed to canonical player ID: primary archetype, appearance
  rank, enabled state.
- Join canonical name, position, current team, and headshot in read contracts;
  do not copy them into profile tables.
- Return enabled active-roster candidates by team.
- Validate supported identity, archetype, and rank values.

**Acceptance:**

- Trades affect team eligibility through canonical roster membership while the
  player's profile persists.
- Missing headshots are nullable.
- Disabled/non-roster profiles are ineligible.
- Contracts expose stable IDs without engine details.
- Migrations, contract tests, and existing API checks pass.

**Exclusions:** automatic inference, secondary player archetypes, gameplay
ratings, full-line construction.

**Decisions (Product Owner, 2026-10-27):**

- Tables `rink_quest_team_profiles` (team_id PK, `primary_identity`, optional
  `secondary_identity` that must differ, `enabled`) and
  `rink_quest_player_profiles` (player_id PK, `archetype`, `appearance_rank`,
  `enabled`). No team column on player profiles; the team comes from the
  roster. Values enforced by database CHECKs. `enabled` defaults to **true**.
  The seed stubs missing player rows (teams come from migration 011).
- Team identities (five): `forecheck`, `transition`, `possession`, `physical`,
  `structure`. No goaltending or shooting identity.
- Skater archetypes: `finisher`, `playmaker`, `power_forward`,
  `two_way_center`, `mobile_defenseman`, `defensive_anchor`. Skaters only;
  goalies get no profile and are filtered out of candidates. Archetype is not
  checked against position.
- Appearance rank 1–3: 1 headliner, 2 regular, 3 occasional; lower is offered
  more often, never stronger. Ties are left to ON2-06's seeded choice.
- Pilot, seeded enabled: TOR `possession`/`structure` — Matthews 8479318
  finisher 1, Nylander 8477939 finisher 2, Tavares 8475166 playmaker 1, Domi
  8477503 playmaker 2, Knies 8482720 power_forward 1, Rielly 8476853
  mobile_defenseman 1, Tanev 8475690 defensive_anchor 1, McCabe 8476931
  defensive_anchor 2. MTL `transition`/`forecheck` — Suzuki 8480018
  two_way_center 1, Caufield 8481540 finisher 1, Laine 8479339 finisher 2,
  Slafkovsky 8483515 power_forward 1, Hutson 8483457 mobile_defenseman 1,
  Matheson 8476875 mobile_defenseman 2, Guhle 8482087 defensive_anchor 1.
  IDs were written without NHL API access; a wrong or traded ID is simply not
  a candidate.
- Read contract:
  - `GET /rink-quest/teams` → `{ teams: [{ teamId, triCode, name, logoUrl,
    primaryIdentity, secondaryIdentity }] }`, enabled teams by tri-code.
  - `GET /rink-quest/teams/:triCode/candidates` → `{ team, candidates:
    [{ playerId, name, positionCode, sweaterNumber, headshotUrl, archetype,
    appearanceRank }] }`, ordered by archetype, rank, name. 400 for a bad
    tri-code, 404 when the team has no enabled profile. Name, logo, position,
    number and headshot are joined at read time and may be `null`.
  - The candidates read first refreshes the team's current-season roster
    through the cached roster service; if that fails it answers from the
    stored roster.

**Implementation facts:** `roster_entries` is upsert-only and its `team_id`
is often null, so the read joins by `tri_code`. One roster refresh writes a
team's rows in one transaction with one `updated_at`, so a team's active
roster is its current-season rows from its newest refresh. A player found in
two teams' newest refreshes counts for the more recent one.

**Verification (2026-10-27):** `pnpm test` 160/160 (six new contract tests in
`src/test/rinkQuestProfiles.test.js`). Real Postgres 16: migrations 001–012
apply on a fresh database; CHECKs reject an unknown identity, a matching or
unknown secondary, an unknown archetype, rank 4 and an unknown player id; a
null secondary and the enabled default work. Through the real roster write
path: a player traded MTL→TOR shows only on TOR and keeps his profile, a
player dropped from TOR's newest refresh leaves, goalie and disabled profiles
are excluded, and missing headshots are `null`. Not run: the NHL roster
fetch (host blocked here), the pilot ID check and the deploy check.

**Imported overview record (2026-10-28):** ACTIVE — merged to HockeyStatsAPI `main` (`bb084dd`) 2026-10-27, which starts the Jenkins deploy (not confirmed from here); 160 API tests pass; checked on real Postgres. Pending: pilot player ID check, Product Owner acceptance. Not run: deploy check.
