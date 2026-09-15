# Rink Quest — Maintainer Notes

Rink Quest lives entirely under `react/src/features/board-game/`. The engine and AI are pure TypeScript; React hooks own orchestration; components render state. Randomness is seeded through `engine/rng.ts`, and gameplay state changes through `gameReducer`.

The game uses three set pieces: card duels for dekes/checks/intercepts, a shot timing minigame, and a symmetric faceoff timing minigame. Tunable gameplay values live in `data/balance.ts`; the rules and rationale live in `docs/board-game-design.md`.

## Optional Google sign-in

Google sign-in is optional. Anonymous play must continue to work without it. When configured, the feature exchanges a Google credential for an app JWT, stores the session token locally, and syncs the daily streak through the board-game streak API. Sync failures are non-blocking and do not break gameplay.

Required configuration:

- `api/.env`: `GOOGLE_OAUTH_CLIENT_ID` and `SESSION_JWT_SECRET`
- `react/.env`: `VITE_GOOGLE_CLIENT_ID` using the same Google client ID

The Google Identity Services button is rendered with Google's own branding and framed by the game's UI; it is not custom-skinned.

## Verification

From `react/`:

```text
pnpm test
npx tsc --noEmit
pnpm build
```

If Google sign-in is configured, also verify anonymous play, sign-in/session restore, sign-out, streak merge across devices, and graceful behavior when the network is unavailable.
