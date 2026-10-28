# AAR-02 — Mobile push for After Action Reports

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** PWA vs. React Native, alert timing after the final horn, and the external scheduler before any push work; accepted by the Product Owner 2026-10-24

**Status:** DONE — Product Owner accepted 2026-10-24 by explicitly closing tickets awaiting acceptance. Previously recorded: implemented and QA-verified.

**Goal:** Ping a user's phone when a favorite's After Action Report is ready,
even with the site closed. Tapping the notification opens `#/game/<gameId>` and
marks the report read.

**Approved decisions (Product Owner, 2026-10-19):**

- Installable PWA with Web Push (not React Native). Android Chrome works
  directly; iOS 16.4+ only after Add to Home Screen, then sign-in and opt-in
  inside the installed app (its storage is separate from Safari).
- Target delay ~10–25 minutes after the final horn: GitHub Actions cron in the
  API repo every 10 minutes, 16:00–08:59 UTC. The workflow checks the public NHL
  scoreboard first and calls the API only when a game is live or recently final,
  so Render/Neon wake only on game nights. The dispatch bypasses the 10-minute
  current-week cache.
- Per-team push mute (inbox still shows muted teams' reports). A game whose
  favorites are all muted is recorded as handled, so unmuting later never pushes
  it. No quiet hours.
- Generated "HS" app icon (192, 512, maskable, Apple touch).
- One notification per game (tag per game). With push on, that device's
  tab-only browser alerts are off to avoid duplicates.
- Opt-in pushes nothing old: subscribing records every report currently in the
  user's inbox as already pushed. A dispatch also skips read reports and games
  that started more than 12 hours ago.
- Sign-out removes that device's subscription. Subscriptions otherwise outlive
  the 30-day session. Each push carries a single-purpose read token, so tapping
  it marks the report read even after the session expired.
- AAR-01 accepted, so AAR-02 builds on `main`.

**API contract (HockeyStatsAPI):**

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/push/config` | none | `{ enabled, publicKey }`; `enabled` false and `publicKey` null when VAPID env is unset |
| `POST /api/push/subscriptions` | session | Body is `PushSubscription.toJSON()` (`endpoint`, `keys.p256dh`, `keys.auth`). Upsert by endpoint to the caller, seed the sent ledger with current reports; 204 |
| `DELETE /api/push/subscriptions` | session | Body `{ endpoint }`; deletes only the caller's row; 204 |
| `PUT /api/favorites/:triCode/push-mute` | session | Body `{ muted: boolean }`; returns `{ favorites }` |
| `POST /api/push/read` | read token | Body `{ token }`; marks that user's game read; 204 (401 on bad token) |
| `POST /api/push/dispatch` | `Bearer CRON_SECRET` | Computes and sends new pushes; `{ users, sent, removed }`; 401 bad secret, 503 when unconfigured |

Favorites gain `pushMuted: boolean`. Push payload JSON:
`{ title, body, gameId, tag: "aar-<gameId>", readToken }`. Read tokens are JWTs
signed with `SESSION_JWT_SECRET`, `{ purpose: "aar-read", sub, gameId }`,
30-day expiry, and are rejected as session tokens (and vice versa). A game
pushes only when at least one of the user's favorites in it is unmuted. The
ledger row is claimed before sending so concurrent dispatches cannot double
send; 404/410 from a push service deletes that subscription. Migration 004 adds
`push_subscriptions`, `after_action_report_pushes`, and
`favorite_teams.push_muted`. New env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, `CRON_SECRET`; GitHub secrets `CRON_SECRET`, `AAR_PUSH_API_URL`.

**Frontend:** manifest + icons; hand-written `public/sw.js` (push and
notificationclick only, no fetch caching) registered at
`BASE_URL + "sw.js?api=<VITE_API_URL>"` with scope `BASE_URL`; notification click
posts the read token, focuses or opens `<scope>#/game/<gameId>`, and tells open
tabs to refresh the inbox; opt-in, iOS install hint, and per-team mute in the
bell inbox next to the browser-alerts button.

**Dependencies:** AAR-01 (DONE).

**Verification:** API (`963dcde`): 126 unit tests; QA ran the real server on
real Postgres 16 against a local fake push service with mocked NHL data. It
covered opt-in seeding, a decrypted payload matching the contract, single send
under concurrent dispatches, the 12-hour/read/mute filters, 410 cleanup, read
tokens in both directions, dispatch auth, and the cron script's
dispatch/fail-open/exit codes. Frontend (`fdab3e9`): 324 unit tests (including
the service worker click order), tsc, build. QA ran Playwright with the API and
NHL mocked and a stub PushManager. It covered the manifest/icons/service worker
scope, signed-out, on/off, mute, disabled, denied, the iOS hint, sign-out
cleanup (also when the DELETE fails), browser-alert suppression, SW messages,
the AAR-01 inbox, and 375px light/dark. Not verifiable here: a real OS
notification tap, real push services, iOS Safari, and the GitHub cron run.

**Deploy steps:** (1) `npx web-push generate-vapid-keys`; set `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` address) and a random
`CRON_SECRET` on Render. (2) In HockeyStatsAPI repo secrets set `CRON_SECRET`
(same value) and `AAR_PUSH_API_URL` (the Render origin). (3) Merge the API first
(start applies migration 004), then the frontend. The cron only runs from
`main`; GitHub disables scheduled workflows after 60 days without commits, so
re-enable it each October.

**Acceptance:** Product Owner installs the site on a phone (Android, or iPhone
via Add to Home Screen), signs in there, turns on phone notifications, and
confirms a real final arrives within ~25 minutes, tapping it opens the game and
clears it from the bell, and Mute stops a team's pushes.
