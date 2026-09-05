import { DIAGNOSTICS_HEADER, get } from '@/lib/apiClient';

/** Diagnostics endpoints; the passphrase always travels in the header. */
export async function GetHealth(passphrase: string) {
  return get('/health', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
export async function GetCacheReport(passphrase: string) {
  return get('/health/cache-usage', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
