import { describe, expect, it } from 'vitest';
import { decodeGoogleProfile } from '@/lib/auth/googleCredential';

function makeCredential(payload: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${base64url({ alg: 'RS256' })}.${base64url(payload)}.signature`;
}

describe('decodeGoogleProfile', () => {
  it('reads email, picture, and name, omitting missing or mistyped fields', () => {
    const credential = makeCredential({
      email: 'player@example.com',
      picture: 'https://example.com/avatar.png',
      name: 'Player One',
    });
    expect(decodeGoogleProfile(credential)).toEqual({
      email: 'player@example.com',
      picture: 'https://example.com/avatar.png',
      name: 'Player One',
    });

    // A payload whose base64 length isn't a multiple of 4 needs padding.
    expect(
      decodeGoogleProfile(
        makeCredential({ picture: 'https://example.com/p.png' }),
      )?.picture,
    ).toBe('https://example.com/p.png');

    // Missing or wrongly typed fields are omitted.
    expect(
      decodeGoogleProfile(makeCredential({ picture: 123, sub: 'abc' })),
    ).toEqual({
      email: undefined,
      picture: undefined,
      name: undefined,
    });
  });

  it('returns null for a malformed credential', () => {
    expect(decodeGoogleProfile('not-a-jwt')).toBeNull();
    expect(decodeGoogleProfile('')).toBeNull();
    expect(decodeGoogleProfile('a.b')).toBeNull();
    // Payload segment that is not valid base64/JSON.
    expect(decodeGoogleProfile('a.not-valid-base64!!.c')).toBeNull();
  });
});
