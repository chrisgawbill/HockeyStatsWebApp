# API-PUSH-03 — Account-level push settings and automatic device subscription (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-25: one account-wide notifications switch over everything; per-player toggle controls only the weekly push (see block).

**Status:** DONE — Product Owner accepted 2026-10-25 by explicitly closing tickets awaiting acceptance. Previously recorded: requested and decided 2026-10-25; merged to HockeyStatsAPI `main` (`39080a8`) and deployed 2026-10-25 (migration 010 applied, routes live).

**Requested by Product Owner (2026-10-25):** subscriptions are automatic, tied
to the account, and governed by whether notifications are on in general, per
team and per player.

**Decisions (Product Owner, 2026-10-25):**

- One account-wide notifications switch (default on) is the master: off sends
  nothing (After Action Reports and the weekly report); on, the team mutes,
  player toggles and the weekly switch each apply.
- Each favorite player gets a weekly-push toggle (default on). It decides only
  whether that player counts in the Monday weekly push; game pushes and their
  player highlights are unchanged, and the stored report and inbox still list
  every favorite.
- The weekly report switch stays.

**PM decisions:** a week whose included players all did not play (or are all
toggled off) is claimed without a push, like a game whose teams are all muted,
so turning a toggle back on never pushes an old week. Turning the account
switch back on records the current inbox as sent for the same reason.
Re-sending an existing subscription (the frontend re-syncs it automatically)
does not reseed the sent ledger; only a device new to the account does, so an
automatic re-sync cannot swallow a push another device is waiting for.

**Contract:**

- Migration 010: `users.push_enabled boolean NOT NULL DEFAULT true`;
  `favorite_players.push_muted boolean NOT NULL DEFAULT false`.
- `GET` / `PUT /api/push/notifications` (session): `{ enabled }`; 400 unless
  boolean.
- `PUT /api/favorite-players/:playerId/push-mute` (session): body
  `{ muted: boolean }`; returns `{ favorites }`; 400 bad body or id, 404 if not
  a favorite. Favorite players gain `pushMuted`.
- Both dispatches skip users with the account switch off. The weekly push body
  is the headline built from the user's unmuted players.

**Verify:** route and service unit tests (switch, player mute, dispatch
filtering, weekly body from unmuted players, re-sync does not reseed),
migration on Postgres, README route tables updated.
