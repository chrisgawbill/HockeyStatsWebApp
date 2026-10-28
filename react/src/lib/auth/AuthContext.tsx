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
import {
  completeDiscordReturn,
  isDiscordCodeReturn,
  startDiscordSignIn,
} from '@/lib/auth/discordAuth';
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
  /** True while a saved session or a Discord return is being checked on load. */
  isRestoring: boolean;
  signIn: (credential: string) => void;
  /** Leaves for Discord; the session is set when Discord sends the user back. */
  signInWithDiscord: () => void;
  signOut: () => void;
}

/** The saved session token, or null when absent or storage is unavailable. */
function readStoredToken(): string | null {
  try {
    return globalThis.localStorage?.getItem(AUTH_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Saves or clears the session token. */
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

/** The saved display profile (email and picture) for the signed-in user, or null. */
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

/** Saves or clears the cached display profile. */
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
 * Site-wide sign-in session (Google or Discord). Restores a stored app
 * session token on load, finishes a Discord return, and exchanges fresh
 * Google credentials for a token. Feature-specific sync
 * (Rink Quest streaks, favorite teams) reacts to `token` in its own slice.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(
    () => readCachedProfile()?.picture ?? null,
  );
  const [isRestoringStored, setIsRestoringStored] = useState(
    () => readStoredToken() !== null,
  );
  const [isCompletingDiscord, setIsCompletingDiscord] = useState(() =>
    isDiscordCodeReturn(),
  );

  /** Saves and applies a new app session; shared by every provider. */
  const applySession = useCallback((newToken: string, newEmail: string) => {
    storeToken(newToken);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

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
        // The API is unreachable or failing, which says nothing about the
        // session; keep the saved token so the next load can restore it.
        console.error('Failed to restore sign-in session:', error);
      })
      .finally(() => {
        if (!cancelled) setIsRestoringStored(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    completeDiscordReturn()
      .then((session) => {
        if (session) applySession(session.token, session.email);
      })
      .catch((error) => {
        console.error('Discord sign-in failed:', error);
      })
      .finally(() => setIsCompletingDiscord(false));
  }, [applySession]);

  const signIn = useCallback(
    (credential: string) => {
      const profile = decodeGoogleProfile(credential);

      googleSignIn(credential)
        .then(({ token: newToken, email: newEmail }) => {
          applySession(newToken, newEmail);

          if (profile?.picture) {
            storeCachedProfile({ picture: profile.picture });
            setPicture(profile.picture);
          }
        })
        .catch((error) => {
          console.error('Google sign-in failed:', error);
        });
    },
    [applySession],
  );

  const signInWithDiscord = useCallback(() => {
    startDiscordSignIn().catch((error) => {
      console.error('Failed to start Discord sign-in:', error);
    });
  }, []);

  const signOut = useCallback(() => {
    storeToken(null);
    storeCachedProfile(null);
    setToken(null);
    setEmail(null);
    setPicture(null);
  }, []);

  const isRestoring = isRestoringStored || isCompletingDiscord;
  const value = useMemo(
    () => ({
      token,
      email,
      picture,
      isRestoring,
      signIn,
      signInWithDiscord,
      signOut,
    }),
    [token, email, picture, isRestoring, signIn, signInWithDiscord, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Returns the current sign-in session; throws outside `AuthProvider`. */
export function useAuth(): AuthSession {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
