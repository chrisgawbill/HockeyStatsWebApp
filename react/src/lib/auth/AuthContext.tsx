import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchSession, googleSignIn } from '@/lib/auth/authApi';
import { decodeGoogleProfile } from '@/lib/auth/googleCredential';

// Keys predate site-wide sign-in (they came from Rink Quest); keeping them
// means people already signed in there stay signed in everywhere.
const AUTH_TOKEN_KEY = 'rinkquest-auth-token';

const AUTH_PROFILE_KEY = 'rinkquest-auth-profile';

interface CachedProfile {
  picture?: string;
}

export interface AuthSession {
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
      globalThis.localStorage?.setItem(
        AUTH_PROFILE_KEY,
        JSON.stringify(profile),
      );
    } else {
      globalThis.localStorage?.removeItem(AUTH_PROFILE_KEY);
    }
  } catch {
    // Cosmetic cache only; losing it is harmless.
  }
}

const AuthContext = createContext<AuthSession | null>(null);

/**
 * Site-wide Google sign-in session. Restores a stored app session token on
 * load and exchanges fresh Google credentials for one. Feature-specific sync
 * (Rink Quest streaks, favorite teams) reacts to `token` in its own slice.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
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
      .then(({ token: newToken, email: newEmail }) => {
        storeToken(newToken);
        setToken(newToken);
        setEmail(newEmail);

        if (profile?.picture) {
          storeCachedProfile({ picture: profile.picture });
          setPicture(profile.picture);
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

  const value = useMemo(
    () => ({ token, email, picture, signIn, signOut }),
    [token, email, picture, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthSession {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
