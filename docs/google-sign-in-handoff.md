# Google Sign-In (Round 8) — Handoff

**Branch:** `google-sio`
**Status as of 2026-09-14:** BG-A19, BG-A20, and BG-B31 are all complete, tested, and committed.
**Only BG-9b remains, and it is blocked on Chris**, not on any further engineering work.
**Full ticket text:** `docs/board-game-backlog.md`, search `## Round 8`.

This doc exists so whoever picks this up next — likely just Chris, to do the Google Cloud setup
and manual verification — has the full picture without re-deriving anything below.

## What's done

| Ticket | Commit(s) | What it built |
|---|---|---|
| BG-A19 | `1f5ad1d1` | Backend: `users`/`board_game_streaks` migration, `auth` slice (`POST /api/auth/google`, `GET /api/auth/me`), `requireAuth` middleware, `boardGameStreak` slice (`GET`/`PUT /api/board-game/streak` with server-side merge). 86 tests pass (`api/`). |
| BG-A20 | `7966199c` | Frontend: `apiClient.ts` gained `post`/`put`; new `features/board-game/api/streakSync.ts` (`googleSignIn`, `fetchSession`, `fetchRemoteStreak`, `pushRemoteStreak`); `data/dailyStreak.ts` gained `saveStreak`/`mergeStreakData`; `docs/architecture.md` exception line updated. 237 tests pass (`react/`), typecheck clean. |
| BG-B31 | `566dc8d9`, `5adcecaa` | Frontend UI: `GoogleSignInButton` (Google's `renderButton` framed in pixel-art chrome — see the theming research below), `useGoogleAuthSession` hook (session restore, sign-in/out, streak reconciliation), wired into `BoardGamePage`/`BoardGame`/`useBoardGame` (fire-and-forget win sync). Verified end-to-end in a real browser (see below); no real Google credential exchange was possible (env not configured). |

## What's left

1. **Create a Google Cloud OAuth client.** A Google Cloud project with an OAuth 2.0 Client ID
   configured for "Sign in with Google" (Google Identity Services). This is the only remaining
   blocker — nothing else in this round needs more engineering.
2. **Set both env vars:**
   - `api/.env`: `GOOGLE_OAUTH_CLIENT_ID=<the client id>` and a `SESSION_JWT_SECRET` (any
     high-entropy string — see the comment above it in `api/.env.example` for how to generate one).
   - `react/.env`: `VITE_GOOGLE_CLIENT_ID=<the same client id>` (public by design).
3. **Manually verify** (checklist already in the ticket, `docs/board-game-backlog.md` `### BG-9b`):
   - Playing anonymously is completely unaffected by this round.
   - Clicking "Sign in with Google" on the pre-game screen actually signs in (shows "Signed in as
     {email}").
   - Signing in on device A, then device B, merges wins from both without dropping either.
   - Signing out and back in on the same device doesn't lose local data.
   - A network failure during sign-in degrades to "stayed signed out" rather than a broken game.

## Implementation notes worth knowing about

- **`fetchSession`'s error handling:** it only special-cases a 401 (returns `null` instead of
  throwing). Any other failure — network error, 500, timeout — still throws. `useGoogleAuthSession`
  wraps every call site in try/catch itself (not inside `streakSync.ts`), so this is already
  handled, but worth knowing if you touch that hook.
- **`localStorage` keys:** streak data is `rinkquest-streak` (pre-existing, unchanged); the auth
  token is `rinkquest-auth-token` (added by BG-B31).
- **`requireAuth` (backend) only verifies the JWT signature/expiry** — it does not re-check the
  user still exists in the DB on every request. A deleted user's still-valid 30-day JWT would still
  pass `requireAuth` (though `GET /api/auth/me` does re-resolve the user row). Called out as an
  intentional tradeoff, not a bug — flag it to Chris if user deletion becomes a real feature.
- **Sign-in entry point:** placed on the pre-game screen (`BoardGamePage`), not inside
  `StreakCalendar` — visible without an extra click.
- **Theming:** Google's own "Sign in with Google" button is used unmodified (`renderButton`,
  theme-aware light/dark), framed in the game's pixel-art chrome (`GoogleSignInButton.module.css`).
  A fully custom-skinned Google button isn't possible for the ID-token flow this backend uses — see
  the BG-B31 ticket text for the full research if this comes up again.

## How to verify current state

```bash
git log --oneline -6          # should show 5adcecaa BG-B31... down through 1f5ad1d1 BG-A19...
git status --short            # should be clean
cd api && node --test $(find src/test -name '*.test.js')   # 86 tests, if npm test's glob fails on Node <20.13
cd react && npm test          # 237 tests
cd react && npx tsc --noEmit  # clean
```

No real Google credential exchange has been tested — everything above passes with the Google
verification step mocked or entirely absent (the button itself renders a "Sign-in unavailable"
placeholder without a configured client ID, which is what you'll see until step 1-2 above are done).
