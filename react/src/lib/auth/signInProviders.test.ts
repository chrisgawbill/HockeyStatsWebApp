import { afterEach, describe, expect, it, vi } from 'vitest';
import { listSignInProviders } from '@/lib/auth/signInProviders';

describe('listSignInProviders', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('offers each provider only when its client ID is set', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client');
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', 'discord-client');
    expect(listSignInProviders()).toEqual(['google', 'discord']);

    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    expect(listSignInProviders()).toEqual(['discord']);

    vi.stubEnv('VITE_DISCORD_CLIENT_ID', '');
    expect(listSignInProviders()).toEqual([]);
  });
});
