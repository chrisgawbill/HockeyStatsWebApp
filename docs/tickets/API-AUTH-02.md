# API-AUTH-02 — Discord sign-in and account linking (backend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22, narrowed same day: Discord sign-in beside Google (PKCE); emails encrypted at rest with a keyed lookup hash; a `user_identities` table links Google and Discord on a verified email only. Microsoft and emailed codes dropped. No Apple. Accepted 2026-10-22.

**Status:** DONE — accepted by the Product Owner 2026-10-22. API merged to
`main` (`8f99a1d`) and deployed by Jenkins 2026-10-22; Google sign-in confirmed
working. The Discord button shipped in SIGNIN-01's modal; Spotter passed the
Discord success, cancel, mismatched-state, rejected and expired-session specs
against recorded API responses (`feature/signin-dialog`, `2a45e8d`). Follow-up:
one live Discord sign-in after the web app deploys.

**Decided (Product Owner, 2026-10-22):** no interim Discord button; it ships
with SIGNIN-01's modal. The end-to-end Spotter run waits for that modal.

**Approved (Product Owner, 2026-10-22; narrowed the same day):**

- Providers: Google (existing) and Discord. Microsoft, emailed codes (Brevo)
  and Apple are out of scope. No provider on/off config endpoint in this
  ticket.
- Discord sign-in and email encryption landed on `main` first (API `d6deb7c`,
  migrations 007/008, `emailCrypto.js`); this ticket builds on them.
- Discord: OAuth authorization code plus PKCE, exchanged on the API with
  `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`; `identify` and `email`
  scopes; `verified` flag. `POST /api/auth/discord` body is
  `{ code, codeVerifier, redirectUri }` (redirect URI on
  `DISCORD_REDIRECT_URIS`).
- A `user_identities` table maps `(provider, subject)` to a user and replaces
  `users.google_sub` and `users.discord_id`; user ids are unchanged, so
  favorites, push subscriptions and reports stay attached.
- Email is encrypted at rest (AES-256-GCM, `EMAIL_ENCRYPTION_KEY`) and found by
  a keyed hash (HMAC-SHA256 of the trimmed, lowercased address,
  `EMAIL_LOOKUP_KEY`). Migration 009 encrypts any plaintext left and drops
  `users.email`. Emails never appear in logs or error messages; auth errors
  are fixed strings.
- Accounts link only on a verified email (Google `email_verified`, Discord
  `verified`). Existing Google emails count as verified. Accounts that
  already share an email are not merged: the oldest keeps the lookup and is
  the one new sign-ins link to. A verified sign-in updates the account email
  when no other account holds it.
- Session JWT and `GET /api/auth/me` (`{ email }`) are unchanged.
- Rollback: `pg_dump` before deploying; `node bin/rollback-009.js` then revert
  on `main`.

**Verify:** unit tests for encryption round-trip, lookup hashing, linking
rules, PKCE validation, fixed error messages and migration 009; existing API
checks pass.

**Imported overview record (2026-10-28):** DONE — accepted by the Product Owner 2026-10-22. API merged to `main` (`8f99a1d`) and deployed by Jenkins 2026-10-22; Google sign-in confirmed working. The Discord button shipped in SIGNIN-01's modal; Spotter passed the Discord success, cancel, mismatched-state, rejected and expired-session specs against recorded API responses (`feature/signin-dialog`, `2a45e8d`). Follow-up: one live Discord sign-in after the web app deploys.
