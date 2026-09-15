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

const AUTH_PROFILE_KEY = 'rinkquest-auth-profile';

interface CachedProfile {
  picture?: string;
}

export interface GoogleAuthSession {
  token: string | null;
  email: string | null;
  picture: string | null;
  signIn: (credential: string) => void;
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
    // Storage may be unavailable; keep the session in memory.
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
    // Cosmetic cache only; losing it is harmless.
  }
}

export function useGoogleAuthSession(): GoogleAuthSession {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(
    () => readCachedProfile()?.picture ?? null,
  );

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
