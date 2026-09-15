export interface GoogleProfile {
  email?: string;
  picture?: string;
  name?: string;
}

/**
 * Decodes the payload of a Google Identity Services ID token (a JWT) to read
 * display-only profile fields (avatar picture, name) for the sign-in badge.
 * Purely local/cosmetic: identity itself is established by the backend's
 * `verifyIdToken` check (`api/src/platform/googleAuthClient.js`), not by
 * anything read here — a forged/tampered credential would just show a wrong
 * or missing picture, never grant access.
 */
export function decodeGoogleProfile(credential: string): GoogleProfile | null {
  try {
    const payload = credential.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;

    const { email, picture, name } = parsed as Record<string, unknown>;
    return {
      email: typeof email === 'string' ? email : undefined,
      picture: typeof picture === 'string' ? picture : undefined,
      name: typeof name === 'string' ? name : undefined,
    };
  } catch {
    return null;
  }
}
