# API-ON2-01 — Site-wide rivalry records and contract

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Rivalry pairs, tiers, and shared read contract.

**Status:** DONE — merged to HockeyStatsAPI `main`; Product Owner accepted
2026-10-27 without a deploy check (none possible at the time).

**Approved decisions (Product Owner, 2026-10-27):**

- Table `team_rivalries` keyed by (`team_a_id`, `team_b_id`) → `teams.team_id`,
  lower id first (one check rejects self-pairs and reversed duplicates);
  `tier` `primary`/`secondary`, optional `display_name`, `enabled`. The seed
  migration stubs missing `teams` rows so a fresh database satisfies the keys.
- Read contract: `GET /rivalries` and `GET /rivalries/:triCode` →
  `{ rivalries: [{ teams: [triCode, triCode], tier, displayName }] }`, teams
  alphabetical; disabled pairs are never returned; a team with none gets `[]`.
- Primary: BOS–MTL, MTL–TOR, EDM–CGY "Battle of Alberta", PIT–PHI "Battle of
  Pennsylvania", NYR–NYI, CHI–DET, COL–DET, TOR–OTT "Battle of Ontario",
  FLA–TBL "Battle of Florida", ANA–LAK "Freeway Face-Off", VGK–LAK.
- Secondary: BOS–TOR, NYR–NJD "Hudson River Rivalry", WSH–PIT, MTL–OTT,
  NYR–PHI, CHI–STL, VAN–CHI, LAK–SJS.

**Verification (2026-10-27):** API tests pass (154). On a local Postgres 16,
all migrations apply, 19 pairs seed, self and reversed inserts are rejected,
lookup from either side matches, a disabled pair is hidden, and SEA returns
`[]`. Not run: deploy check.

**Goal:** Provide one normalized source of traditional team rivalries for Rink
Quest and later site-wide consumers.

**Owner:** HockeyStatsAPI repository.

**Dependencies:** Product Owner approves initial rivalry records.

**Scope:**

- Add an unordered relation with team A/B foreign keys, primary/secondary tier,
  optional display name, and enabled state.
- Enforce no self-pairs and no reversed duplicate.
- Expose a normalized read contract not tied to the board game.
- Seed only Product Owner-reviewed relationships.

**Acceptance:**

- Lookup from either team returns the same relationship.
- Constraints reject self and reversed duplicates.
- Unknown/disabled rivalries are explicit, not fabricated.
- Tests cover zero, one, and multiple rivalries per team.
- Existing migration/API verification passes.

**Exclusions:** series statistics, automated inference, frontend presentation.

**Imported overview record (2026-10-28):** DONE — merged to HockeyStatsAPI `main`; Product Owner accepted 2026-10-27. Not run: deploy check.
