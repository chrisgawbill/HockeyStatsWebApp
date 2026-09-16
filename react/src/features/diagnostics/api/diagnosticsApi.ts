import { DIAGNOSTICS_HEADER, get } from '@/lib/apiClient';

export interface HealthDataDto {
  status: string;
  version: string;
  environment: string;
  currentSeason: string;
  cacheStorageMode: string;
  cacheWritable: boolean;
  externalCacheConfigured: boolean;
  externalCacheReachable: boolean;
  anthropicKeyConfigured: boolean;
  uptime: number;
  currentTime: string;
}

export interface CacheReportDto {
  storageMode: string;
  primaryStore: string;
  sections: Record<string, number>;
  largestSection: { type: string | null; size: number };
  total: number;
  external: {
    configured: boolean;
    reachable: boolean;
    sections: Record<string, { entries: number; bytes: number }>;
    totalEntries: number;
    totalBytes: number;
    tableBytes: number;
  };
}

/** Diagnostics endpoints; the passphrase always travels in the header. */
export function GetHealth(passphrase: string): Promise<HealthDataDto> {
  return get<HealthDataDto>('/health', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
export function GetCacheReport(passphrase: string): Promise<CacheReportDto> {
  return get<CacheReportDto>('/health/cache-usage', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
