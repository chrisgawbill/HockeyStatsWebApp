# API-FAN-01 — Fan categories for favorite teams (and players) (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-20: tiers Diehard/Fan/Curious + optional label on teams and players, display only (see block).

**Status:** DONE — Product Owner accepted 2026-10-25 by explicitly closing tickets awaiting acceptance. Previously recorded: implemented, QA PASS on real Postgres (label-length fix included), readability pass done; deployed to the dev server (migration 006 applied, routes live; checked 2026-10-25).

**Approved decisions (Product Owner, 2026-10-20):** fixed tiers named
**Diehard / Fan / Curious** (values `diehard`, `fan`, `curious`; new favorites
start as `fan`) plus an optional free-text label (emoji allowed, e.g. "❤️",
"Prospect", "My West Coast team") on **both** teams and players. Categories
are display-only: no effect on After Action Reports, Weekly Player Reports, or
push.

**Goal:** Store a fan category with each favorite so the frontend can group
and label favorites (e.g. Diehard, Curious, "My West Coast team").

**Proposed contract (PM recommendation, confirm at checkpoint):**

- Migration 006: `favorite_teams.tier` and `favorite_players.tier` text,
  `NOT NULL DEFAULT 'fan'`, `CHECK (tier IN ('diehard','fan','curious'))`;
  `label` text NULL, at most 24 characters, trimmed.
- `GET /api/favorites` and `GET /api/favorite-players` add `tier` and `label`
  to each favorite.
- `PATCH /api/favorites/:triCode` and `PATCH /api/favorite-players/:playerId`
  with body `{ tier?, label? }` (`label: null` clears); returns the full list;
  400 on a bad tier or label, 404 when not a favorite.
- Adding a favorite keeps today's routes; it starts at the default tier.
- No change to After Action Report or Weekly Player Report eligibility unless
  the Product Owner decides categories affect push.

**Verify:** route/service unit tests, migration run on real Postgres, README
route table updated.

**Deploy check (2026-10-25, dev server, read-only):** migration
`006_add_favorite_tiers_and_labels.sql` is applied; `GET /api/favorites` and
`GET /api/favorite-players` answer 401 without a session and serve signed-in
requests (journal). Stored favorites already hold non-default tiers (`diehard`,
`curious`), so tier writes work on the live database. Not yet checked: an
authenticated response body showing `tier` and `label`.
