import { FormEvent, useCallback, useEffect, useState } from 'react';

import {
  CacheReportDto,
  GetCacheReport,
  GetHealth,
  HealthDataDto,
} from '@/features/diagnostics/api/diagnosticsApi';

const SESSION_KEY = 'diagnostics-key';

/** True when a failed diagnostics request was rejected as unauthorized. */
function isUnauthorizedError(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } } | null)?.response?.status ===
    401
  );
}

/**
 * Passphrase-gated diagnostics session. `loadDiagnostics` fetches health and
 * cache reports with a passphrase and, on success, remembers it in
 * sessionStorage so a refresh within the tab session keeps the user unlocked
 * (the stored passphrase is reused automatically on mount). `handleSubmit`
 * unlocks from the form; `handleLock` forgets the passphrase and data.
 */
export function useDiagnostics() {
  const [passphrase, setPassphrase] = useState('');
  const [health, setHealth] = useState<HealthDataDto | null>(null);
  const [cacheReport, setCacheReport] = useState<CacheReportDto | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadDiagnostics = useCallback(async (key: string) => {
    setLoading(true);
    setAuthError(false);
    setFetchError(false);
    try {
      const [healthData, cacheData] = await Promise.all([
        GetHealth(key),
        GetCacheReport(key),
      ]);
      setHealth(healthData);
      setCacheReport(cacheData);
      setAuthed(true);
      sessionStorage.setItem(SESSION_KEY, key);
    } catch (error: unknown) {
      sessionStorage.removeItem(SESSION_KEY);
      setAuthed(false);
      if (isUnauthorizedError(error)) {
        setAuthError(true);
      } else {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedPassphrase = sessionStorage.getItem(SESSION_KEY);
    if (storedPassphrase) {
      setPassphrase(storedPassphrase);
      loadDiagnostics(storedPassphrase);
    }
  }, [loadDiagnostics]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const key = passphrase.trim();
    if (!key) return;
    loadDiagnostics(key);
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setHealth(null);
    setCacheReport(null);
    setPassphrase('');
  };

  return {
    passphrase,
    setPassphrase,
    health,
    cacheReport,
    authed,
    loading,
    authError,
    fetchError,
    loadDiagnostics,
    handleSubmit,
    handleLock,
  };
}
