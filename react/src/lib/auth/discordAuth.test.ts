import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStorage } from '@/test/fixtures/storage';

const discordSignIn = vi.fn();

vi.mock('@/lib/auth/authApi', () => ({
  discordSignIn: (...args: unknown[]) => discordSignIn(...args),
}));

import {
  buildDiscordAuthorizeUrl,
  completeDiscordReturn,
  createCodeChallenge,
  createCodeVerifier,
  createState,
  isReturnedStateValid,
  readDiscordReturn,
  removeDiscordReturnParams,
  savePendingDiscordSignIn,
  takePendingDiscordSignIn,
} from '@/lib/auth/discordAuth';

const PKCE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

const APP_ROOT = 'https://example.com/HockeyStatsWebApp/';

/** Stubs `window` with a location at `href` and a history that records replaceState. */
function stubPage(href: string) {
  const replaceState = vi.fn();
  vi.stubGlobal('window', {
    location: { href, origin: new URL(href).origin },
    history: { state: null, replaceState },
  });
  return replaceState;
}

describe('PKCE generation', () => {
  it('makes 43-character verifiers that differ each time', () => {
    const verifiers = new Set(Array.from({ length: 20 }, createCodeVerifier));
    expect(verifiers.size).toBe(20);
    for (const verifier of verifiers) {
      expect(verifier).toMatch(PKCE_VERIFIER_PATTERN);
      expect(verifier).toHaveLength(43);
    }
    expect(createState()).not.toBe(createState());
  });

  it('derives the S256 challenge as unpadded base64url SHA-256', async () => {
    // RFC 7636 appendix B example.
    await expect(
      createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    ).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');

    const verifier = createCodeVerifier();
    const expected = createHash('sha256').update(verifier).digest('base64url');
    await expect(createCodeChallenge(verifier)).resolves.toBe(expected);
  });

  it('builds the authorize URL with every required parameter', () => {
    const url = new URL(
      buildDiscordAuthorizeUrl({
        clientId: 'client-1',
        redirectUri: APP_ROOT,
        state: 'state-1',
        codeChallenge: 'challenge-1',
      }),
    );
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://discord.com/oauth2/authorize',
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: 'code',
      client_id: 'client-1',
      scope: 'identify email',
      redirect_uri: APP_ROOT,
      state: 'state-1',
      code_challenge: 'challenge-1',
      code_challenge_method: 'S256',
    });
  });
});

describe('state check', () => {
  const pending = {
    state: 'expected-state',
    codeVerifier: 'v'.repeat(43),
    redirectUri: APP_ROOT,
  };

  it('accepts only the state this tab sent', () => {
    expect(isReturnedStateValid(pending, 'expected-state')).toBe(true);
    expect(isReturnedStateValid(pending, 'tampered-state')).toBe(false);
    expect(isReturnedStateValid(null, 'expected-state')).toBe(false);
  });

  it('reads a code return, a cancel, and a non-return URL', () => {
    expect(readDiscordReturn(new URL(`${APP_ROOT}?code=c&state=s`))).toEqual({
      kind: 'code',
      code: 'c',
      state: 's',
    });
    expect(
      readDiscordReturn(new URL(`${APP_ROOT}?error=access_denied&state=s`)),
    ).toEqual({ kind: 'denied', state: 's' });
    expect(readDiscordReturn(new URL(`${APP_ROOT}#/teams`))).toBeNull();
  });
});

describe('pending sign-in storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  const pending = {
    state: 's',
    codeVerifier: 'v'.repeat(43),
    redirectUri: APP_ROOT,
  };

  it('is read once, then cleared', () => {
    vi.stubGlobal('sessionStorage', makeStorage());
    expect(savePendingDiscordSignIn(pending)).toBe(true);
    expect(takePendingDiscordSignIn()).toEqual(pending);
    expect(takePendingDiscordSignIn()).toBeNull();
  });

  it('survives missing or throwing sessionStorage (Firefox private window)', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(savePendingDiscordSignIn(pending)).toBe(false);
    expect(takePendingDiscordSignIn()).toBeNull();

    const throwing = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.stubGlobal('sessionStorage', {
      getItem: throwing,
      setItem: throwing,
      removeItem: throwing,
    });
    expect(savePendingDiscordSignIn(pending)).toBe(false);
    expect(takePendingDiscordSignIn()).toBeNull();
  });
});

describe('URL cleanup', () => {
  it('removes code, state and error but keeps other query and the hash route', () => {
    expect(
      removeDiscordReturnParams(
        new URL(`${APP_ROOT}?code=c&state=s&keep=1#/players/8478402`),
      ),
    ).toBe('/HockeyStatsWebApp/?keep=1#/players/8478402');
    expect(
      removeDiscordReturnParams(
        new URL(
          `${APP_ROOT}?error=access_denied&error_description=denied&state=s`,
        ),
      ),
    ).toBe('/HockeyStatsWebApp/');
  });
});

describe('completeDiscordReturn', () => {
  beforeEach(() => {
    discordSignIn.mockReset();
    vi.stubGlobal('sessionStorage', makeStorage());
    savePendingDiscordSignIn({
      state: 'expected-state',
      codeVerifier: 'v'.repeat(43),
      redirectUri: APP_ROOT,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('exchanges the code with the saved verifier and redirect URI, and cleans the URL', async () => {
    const replaceState = stubPage(
      `${APP_ROOT}?code=discord-code&state=expected-state`,
    );
    discordSignIn.mockResolvedValue({ token: 't', email: 'fan@example.com' });

    await expect(completeDiscordReturn()).resolves.toEqual({
      token: 't',
      email: 'fan@example.com',
    });
    expect(discordSignIn).toHaveBeenCalledWith({
      code: 'discord-code',
      codeVerifier: 'v'.repeat(43),
      redirectUri: APP_ROOT,
    });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/HockeyStatsWebApp/');
    expect(takePendingDiscordSignIn()).toBeNull();
  });

  it('rejects a tampered state without calling the API', async () => {
    const replaceState = stubPage(
      `${APP_ROOT}?code=discord-code&state=tampered-state`,
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(completeDiscordReturn()).resolves.toBeNull();
    expect(discordSignIn).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/HockeyStatsWebApp/');
  });

  it('treats a cancel or deny as signed out, once', async () => {
    const replaceState = stubPage(
      `${APP_ROOT}?error=access_denied&state=expected-state`,
    );

    await expect(completeDiscordReturn()).resolves.toBeNull();
    expect(discordSignIn).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/HockeyStatsWebApp/');
    expect(takePendingDiscordSignIn()).toBeNull();
  });

  it('does nothing on a normal page load', async () => {
    const replaceState = stubPage(`${APP_ROOT}#/teams`);

    await expect(completeDiscordReturn()).resolves.toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
    expect(takePendingDiscordSignIn()).not.toBeNull();
  });
});
