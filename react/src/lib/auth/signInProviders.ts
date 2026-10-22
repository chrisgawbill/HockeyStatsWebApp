export type SignInProvider = 'google' | 'discord';

/**
 * The sign-in providers this build can offer, in display order. A provider is
 * offered only when its public client ID was set at build time.
 */
export function listSignInProviders(): SignInProvider[] {
  const providers: SignInProvider[] = [];
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) providers.push('google');
  if (import.meta.env.VITE_DISCORD_CLIENT_ID) providers.push('discord');
  return providers;
}
