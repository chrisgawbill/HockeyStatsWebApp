# API-PUSH-02 — Reliable push delivery and scheduling (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Requested 2026-10-24 ("make notification pushes more reliable … a project-agnostic notification service on my dev server, so be it"). Product Owner accepted 2026-10-24: notifier stays in `HockeyStatsAPI/notifier/`; 5-minute AAR cadence; weekly runs 9:00 + 12:00 ET with catch-up; merge both to main. Product Owner checks the first live game night and Monday report.

**Status:** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Not run: deleting the old GitHub secrets. Previously recorded: ACTIVE (merged to `main` 2026-10-24; notifier installed and running on the dev server, scheduled runs succeeding, checked 2026-10-25; first Monday weekly push reached the Product Owner's phone 2026-10-26; pending deletion of the old GitHub secrets)

**Problem:** pushes depended on GitHub Actions cron (runs late, skips runs,
disables itself after 60 quiet days) and on one send attempt: the ledger row was
claimed before sending, so a push-service 5xx/429 or network error lost that
push for good.

**Change:** a project-agnostic `notifier` service on the dev server
(`HockeyStatsAPI/notifier/`, its own README; SQLite, systemd). It provides (1) a
Web Push queue with per-app VAPID keys, dedupe keys, exponential-backoff
retries until the TTL, and a `subscription.gone` webhook back to the app; and
(2) a cron-style HTTP scheduler with time zones, retries, run history and
catch-up after downtime. The API queues pushes there when `NOTIFIER_URL` and
`NOTIFIER_TOKEN` are set, and otherwise sends directly as before. If no device
got a push, its ledger claim is released so the next dispatch retries it.
`POST /api/push/dispatch` now gates itself on the NHL scoreboard (the logic
from the removed `bin/aar-push-cron.js`). The new `POST /api/push/notifier-events`
deletes gone subscriptions. The GitHub workflows and cron scripts are removed;
the schedules are AAR every 5 minutes from 16:00 to 08:59 UTC, and weekly on
Mondays at 9:00 and 12:00 America/New_York. Frontend unchanged.

**Deploy order:** install and start the notifier (README "Install on the dev
server"), set `NOTIFIER_URL`, `NOTIFIER_TOKEN` and `NOTIFIER_CALLBACK_SECRET`
in the API `.env`, then merge the API to `main` (Jenkins deploys it). Once
`/health` shows runs succeeding, delete the `CRON_SECRET`/`AAR_PUSH_API_URL`
GitHub secrets.

**Verify:** API and notifier unit tests. A local smoke run of the notifier
covered startup, a scheduled authenticated call, an enqueue with real Web Push
encryption, and a network failure left queued for retry. Not yet verified: the
systemd install, real push services, and a real game night or Monday report.


**Live check (2026-10-25 00:30 UTC, dev server):** `notifier.service` runs from
`~/projects/notifier` (`81da435`) on 127.0.0.1:9100 under Node 24.22.1, config in
`/etc/notifier`; the API `.env` points `NOTIFIER_URL` at it, and its app token,
callback secret, VAPID keys and schedule bearer match the API values. `/health`:
`ok`, 0 queued messages, `oldestQueuedAgeSeconds` null, 0 pending events.
`after-action-push` ran 18 times from 23:05 to 00:30 UTC, all `ok`/200
(`{"users":0,"sent":0,"removed":0}`); `weekly-player-report` first runs
2026-10-26 13:00 UTC. Journals since 23:00 UTC show no notifier errors and one
API 401 on `POST /api/push/notifier-events` at 23:03:09 that the notifier did not
send (no rejected event in its log or queue). `push_subscriptions` is empty, so
no device can receive a push yet. Pending: subscribe a device and confirm a real
push arrives, the first Monday run, then delete the `CRON_SECRET` and
`AAR_PUSH_API_URL` GitHub Actions secrets.

**Imported overview record (2026-10-28):** DONE — Product Owner accepted 2026-10-27 by explicitly closing the ticket. Previously recorded: ACTIVE (merged to `main` 2026-10-24; notifier installed and running on the dev server, scheduled runs succeeding, checked 2026-10-25; first Monday weekly push reached the Product Owner's phone 2026-10-26; pending deletion of the old GitHub secrets) Not run: deleting the old GitHub secrets.
