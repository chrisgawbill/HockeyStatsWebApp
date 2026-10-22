import { ApiError, get, post } from '@/lib/apiClient';

/** Request options carrying the app session token as a bearer header. */
export function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Exchanges a Google Identity Services credential for an app session token. */
export async function googleSignIn(
  credential: string,
): Promise<{ token: string; email: string }> {
  return post<{ token: string; email: string }>('/api/auth/google', {
    credential,
  });
}

/**
 * Exchanges a Discord authorization code (with its PKCE verifier and the exact
 * redirect URI sent to Discord) for an app session token.
 */
export async function discordSignIn({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ token: string; email: string }> {
  return post<{ token: string; email: string }>('/api/auth/discord', {
    code,
    codeVerifier,
    redirectUri,
  });
}

/**
 * Resolves a stored session token to the signed-in user's email, or `null`
 * for an expired/invalid session.
 */
export async function fetchSession(
  token: string,
): Promise<{ email: string } | null> {
  try {
    return await get<{ email: string }>(
      '/api/auth/me',
      undefined,
      authHeader(token),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
