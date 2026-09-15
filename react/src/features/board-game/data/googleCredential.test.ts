import { describe, expect, it } from 'vitest';
import { decodeGoogleProfile } from '@/features/board-game/data/googleCredential';

function makeCredential(payload: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${base64url({ alg: 'RS256' })}.${base64url(payload)}.signature`;
}

describe('decodeGoogleProfile', () => {
  it('reads email, picture, and name from a well-formed credential', () => {
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
  });

  it('handles a payload whose base64url length needs padding', () => {
    // Deliberately pick a payload whose base64 length isn't a multiple of 4.
    const credential = makeCredential({ picture: 'https://example.com/p.png' });
    const profile = decodeGoogleProfile(credential);
    expect(profile?.picture).toBe('https://example.com/p.png');
  });

  it('omits fields that are missing or the wrong type', () => {
    const credential = makeCredential({ picture: 123, sub: 'abc' });
    expect(decodeGoogleProfile(credential)).toEqual({
      email: undefined,
      picture: undefined,
      name: undefined,
    });
  });

  it('returns null for a malformed credential', () => {
    expect(decodeGoogleProfile('not-a-jwt')).toBeNull();
    expect(decodeGoogleProfile('')).toBeNull();
    expect(decodeGoogleProfile('a.b')).toBeNull();
  });

  it('returns null when the payload segment is not valid base64/JSON', () => {
    expect(decodeGoogleProfile('a.not-valid-base64!!.c')).toBeNull();
  });
});
