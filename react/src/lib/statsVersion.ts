import { useEffect, useRef } from 'react';

import { get } from '@/lib/apiClient';

/**
 * How often the app asks the API whether its stored stats changed. The API
 * refreshes them when a game goes final; the check is one tiny request.
 */
const STATS_VERSION_POLL_MS = 30 * 1000;
/** Returning to the tab checks at once unless the last check is this recent. */
const RETURN_CHECK_MIN_MS = 10 * 1000;

const listeners = new Set<() => void>();
/** The last version seen; undefined until the first check answers. */
let knownVersion: string | null | undefined;
let lastCheckMs = 0;
let pollTimer: number | undefined;

/**
 * Asks the API for its stats version and notifies every listener when it moved.
 * shortcut: polls the NHL version only, so AHL views refresh on NHL changes
 * and pick up AHL changes (3 refreshes a day) on reload; poll per league if
 * AHL live polling arrives.
 */
async function checkStatsVersion() {
  lastCheckMs = Date.now();
  try {
    const { version } = await get<{ version: string | null }>(
      '/player/stats/version',
    );
    const changed = knownVersion !== undefined && version !== knownVersion;
    knownVersion = version;
    if (changed) listeners.forEach((listener) => listener());
  } catch {
    // Keep the shown stats; the next check tries again.
  }
}

function checkOnReturn() {
  if (
    document.visibilityState === 'visible' &&
    Date.now() - lastCheckMs > RETURN_CHECK_MIN_MS
  ) {
    checkStatsVersion();
  }
}

/**
 * Calls `listener` whenever the API's stored stats change. One poll serves
 * every listener, running only while something listens and the tab is
 * visible. Returns the unsubscribe function.
 */
export function subscribeToStatsChanges(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (knownVersion === undefined) checkStatsVersion();
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') checkStatsVersion();
    }, STATS_VERSION_POLL_MS);
    document.addEventListener('visibilitychange', checkOnReturn);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.clearInterval(pollTimer);
    document.removeEventListener('visibilitychange', checkOnReturn);
  };
}

/**
 * Calls `refresh` whenever the API's stored stats change (see
 * subscribeToStatsChanges). `refresh` should update quietly, keeping what is
 * shown when it fails.
 */
export function useRefreshOnStatsChange(refresh: () => void, enabled = true) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    return subscribeToStatsChanges(() => refreshRef.current());
  }, [enabled]);
}
