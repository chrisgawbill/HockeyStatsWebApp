/**
 * Discord sign-in: OAuth 2.0 authorization code with PKCE (RFC 7636, S256).
 * The browser sends the user to Discord with a code challenge and a random
 * state, Discord sends them back to the app root with `code` and `state`, and
 * the API exchanges the code (with the verifier and its client secret) for an
 * app session (`POST /api/auth/discord`).
 */

import { discordSignIn } from '@/lib/auth/authApi';

export const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

const DISCORD_SCOPES = 'identify email';

/** sessionStorage key for the sign-in that is waiting on Discord's redirect. */
const PENDING_DISCORD_SIGN_IN_KEY = 'discord-sign-in-pending';

/** Query parameters Discord adds when it sends the user back. */
const DISCORD_RETURN_PARAMS = ['code', 'state', 'error', 'error_description'];

/** What the app remembers between leaving for Discord and coming back. */
export interface PendingDiscordSignIn {
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

/** Discord's answer on return: a code to exchange, or a cancel/deny. */
export type DiscordReturn =
  | { kind: 'code'; code: string; state: string }
  | { kind: 'denied'; state: string | null };

/** Encodes bytes as unpadded base64url. */
function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** `byteCount` cryptographically random bytes as base64url. */
function createRandomToken(byteCount: number): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(byteCount)));
}

/** A PKCE code verifier: 32 random bytes, 43 base64url characters. */
export function createCodeVerifier(): string {
  return createRandomToken(32);
}

/** The S256 code challenge for a verifier: base64url(SHA-256(verifier)). */
export async function createCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  return encodeBase64Url(new Uint8Array(digest));
}

/** A random OAuth state value that ties Discord's return to this tab. */
export function createState(): string {
  return createRandomToken(16);
}

/**
 * The app root Discord sends the user back to, with no `#` fragment. It must
 * be listed in the API's DISCORD_REDIRECT_URIS.
 */
export function getDiscordRedirectUri(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

/** The Discord authorize URL for one sign-in attempt. */
export function buildDiscordAuthorizeUrl({
  clientId,
  redirectUri,
  state,
  codeChallenge,
}: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: DISCORD_SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${DISCORD_AUTHORIZE_URL}?${query.toString()}`;
}

/** Saves the pending sign-in; false when sessionStorage is unavailable. */
export function savePendingDiscordSignIn(
  pending: PendingDiscordSignIn,
): boolean {
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return false;
    storage.setItem(PENDING_DISCORD_SIGN_IN_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and removes the pending sign-in so a code is never retried. Null when
 * there is none, it is malformed, or sessionStorage is unavailable.
 */
export function takePendingDiscordSignIn(): PendingDiscordSignIn | null {
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return null;
    const raw = storage.getItem(PENDING_DISCORD_SIGN_IN_KEY);
    storage.removeItem(PENDING_DISCORD_SIGN_IN_KEY);
    if (!raw) return null;
    const { state, codeVerifier, redirectUri } = JSON.parse(raw) ?? {};
    if (
      typeof state !== 'string' ||
      typeof codeVerifier !== 'string' ||
      typeof redirectUri !== 'string'
    ) {
      return null;
    }
    return { state, codeVerifier, redirectUri };
  } catch {
    return null;
  }
}

/**
 * Reads Discord's return from the page URL, or null when the URL is not a
 * Discord return. A return without a code (cancel, deny) is `denied`.
 */
export function readDiscordReturn(url: URL): DiscordReturn | null {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (code && state) return { kind: 'code', code, state };
  if (url.searchParams.has('error')) return { kind: 'denied', state };
  return null;
}

/** Whether Discord's returned state is the one this tab sent. */
export function isReturnedStateValid(
  pending: PendingDiscordSignIn | null,
  returnedState: string,
): pending is PendingDiscordSignIn {
  return pending !== null && pending.state === returnedState;
}

/** The URL with Discord's return parameters removed; the hash route is kept. */
export function removeDiscordReturnParams(url: URL): string {
  const cleaned = new URL(url.href);
  for (const param of DISCORD_RETURN_PARAMS) {
    cleaned.searchParams.delete(param);
  }
  return `${cleaned.pathname}${cleaned.search}${cleaned.hash}`;
}

/** Whether the page is Discord's return with a code still to exchange. */
export function isDiscordCodeReturn(): boolean {
  return readDiscordReturn(new URL(window.location.href))?.kind === 'code';
}

/**
 * Finishes a Discord sign-in when the page is Discord's return: removes the
 * return parameters from the URL, checks the state against this tab's pending
 * sign-in, and exchanges the code for an app session. Null when the page is
 * not a Discord return, the user cancelled or denied, or the state does not
 * match; rejects when the API refuses the code.
 */
export async function completeDiscordReturn(): Promise<{
  token: string;
  email: string;
} | null> {
  const pageUrl = new URL(window.location.href);
  const discordReturn = readDiscordReturn(pageUrl);
  if (!discordReturn) return null;

  window.history.replaceState(
    window.history.state,
    '',
    removeDiscordReturnParams(pageUrl),
  );
  const pending = takePendingDiscordSignIn();
  if (discordReturn.kind === 'denied') return null;
  if (!isReturnedStateValid(pending, discordReturn.state)) {
    console.warn('Discord sign-in state did not match; ignoring the return.');
    return null;
  }

  return discordSignIn({
    code: discordReturn.code,
    codeVerifier: pending.codeVerifier,
    redirectUri: pending.redirectUri,
  });
}

/**
 * Sends the browser to Discord to sign in. Logs and stays put when Discord
 * sign-in is not configured or the pending sign-in cannot be saved (the
 * return could not be checked).
 */
export async function startDiscordSignIn(): Promise<void> {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;
  if (!clientId) {
    console.error('VITE_DISCORD_CLIENT_ID is not configured.');
    return;
  }

  const pending: PendingDiscordSignIn = {
    state: createState(),
    codeVerifier: createCodeVerifier(),
    redirectUri: getDiscordRedirectUri(),
  };
  if (!savePendingDiscordSignIn(pending)) {
    console.error(
      'Discord sign-in needs sessionStorage, which is unavailable.',
    );
    return;
  }

  window.location.assign(
    buildDiscordAuthorizeUrl({
      clientId,
      redirectUri: pending.redirectUri,
      state: pending.state,
      codeChallenge: await createCodeChallenge(pending.codeVerifier),
    }),
  );
}
