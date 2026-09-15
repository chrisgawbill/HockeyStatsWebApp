import { useCallback, useEffect, useState } from 'react';
import {
  fetchRemoteStreak,
  fetchSession,
  googleSignIn,
  pushRemoteStreak,
} from '@/features/board-game/api/streakSync';
import {
  loadStreak,
  mergeStreakData,
  saveStreak,
} from '@/features/board-game/data/dailyStreak';
import { decodeGoogleProfile } from '@/features/board-game/data/googleCredential';

const AUTH_TOKEN_KEY = 'rinkquest-auth-token';
/**
 * Display-only cache (avatar picture) for the nav bar badge, keyed
 * separately from the token since it's cosmetic, not part of the session's
 * identity check — `fetchSession`'s `email` is what actually confirms the
 * token is still valid.
 */
const AUTH_PROFILE_KEY = 'rinkquest-auth-profile';

interface CachedProfile {
  picture?: string;
}

export interface GoogleAuthSession {
  /** Current session token, or `null` when signed out. Passed to `useBoardGame` for win sync. */
  token: string | null;
  email: string | null;
  /** Avatar picture URL from the Google credential, if present. Display-only. */
  picture: string | null;
  /** Exchanges a Google Identity Services credential for a session, then syncs the local streak. */
  signIn: (credential: string) => void;
  /** Clears the session. Local streak data is untouched. */
  signOut: () => void;
}

function readStoredToken(): string | null {
  try {
    return globalThis.localStorage?.getItem(AUTH_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) {
      globalThis.localStorage?.setItem(AUTH_TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable/quota-blocked; the session still works in-memory
    // for this tab, it just won't survive a reload.
  }
}

function readCachedProfile(): CachedProfile | null {
  try {
    const raw = globalThis.localStorage?.getItem(AUTH_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function storeCachedProfile(profile: CachedProfile | null): void {
  try {
    if (profile) {
      globalThis.localStorage?.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
    } else {
      globalThis.localStorage?.removeItem(AUTH_PROFILE_KEY);
    }
  } catch {
    // Same as storeToken: cosmetic cache only, fine to lose silently.
  }
}

/**
 * Owns the board game's optional Google sign-in session (BG-B31). Anonymous
 * play is never affected: every step here after the initial credential
 * exchange tolerates a network failure by logging and falling back to
 * signed-out, rather than throwing into the render tree (see the Round 8
 * rationale in docs/board-game-backlog.md).
 */
export function useGoogleAuthSession(): GoogleAuthSession {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(
    () => readCachedProfile()?.picture ?? null,
  );

  // On mount, if a token is already stored, confirm it's still valid. The
  // cached picture (set above) renders immediately so the badge doesn't
  // flash empty while this resolves; email/token stay null until confirmed.
  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) return;

    let cancelled = false;
    fetchSession(stored)
      .then((session) => {
        if (cancelled) return;
        if (session) {
          setToken(stored);
          setEmail(session.email);
        } else {
          // Expired/invalid: fall back to signed-out silently, no error toast.
          storeToken(null);
          storeCachedProfile(null);
          setPicture(null);
        }
      })
      .catch((error) => {
        console.error('Failed to restore Google sign-in session:', error);
        storeToken(null);
        storeCachedProfile(null);
        setPicture(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((credential: string) => {
    const profile = decodeGoogleProfile(credential);

    googleSignIn(credential)
      .then(async ({ token: newToken, email: newEmail }) => {
        storeToken(newToken);
        setToken(newToken);
        setEmail(newEmail);

        if (profile?.picture) {
          storeCachedProfile({ picture: profile.picture });
          setPicture(profile.picture);
        }

        // Reconcile the local and server streaks. Any failure here is
        // logged and swallowed — the user is still signed in, local play
        // keeps working, and the next sync attempt (e.g. the next win)
        // gets another chance.
        try {
          const remote = await fetchRemoteStreak(newToken);
          const merged = mergeStreakData(loadStreak(), remote);
          saveStreak(merged);
          await pushRemoteStreak(newToken, merged);
        } catch (error) {
          console.error('Google sign-in streak sync failed:', error);
        }
      })
      .catch((error) => {
        console.error('Google sign-in failed:', error);
      });
  }, []);

  const signOut = useCallback(() => {
    storeToken(null);
    storeCachedProfile(null);
    setToken(null);
    setEmail(null);
    setPicture(null);
  }, []);

  return { token, email, picture, signIn, signOut };
}
