import { useEffect, useRef } from 'react';

/**
 * How often an open page re-reads stats. The API refreshes its stored stats
 * after every game, so reads are cheap database reads.
 */
const BACKGROUND_REFRESH_MS = 5 * 60 * 1000;
/** Returning to the tab refreshes only if the last refresh is older than this. */
const FOCUS_REFRESH_MIN_MS = 60 * 1000;

/**
 * Calls `refresh` every BACKGROUND_REFRESH_MS while the tab is visible, and
 * when the user returns to the tab more than FOCUS_REFRESH_MIN_MS after the
 * last refresh. A new `requestKey` (another team or season) is a fresh load,
 * so the timers restart. `refresh` should update quietly, keeping what is
 * shown when it fails.
 */
export function useBackgroundRefresh(
  refresh: () => void,
  requestKey: string,
  enabled = true,
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    let lastRefreshMs = Date.now();
    const runRefresh = () => {
      lastRefreshMs = Date.now();
      refreshRef.current();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') runRefresh();
    }, BACKGROUND_REFRESH_MS);
    const refreshOnReturn = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRefreshMs > FOCUS_REFRESH_MIN_MS
      ) {
        runRefresh();
      }
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [requestKey, enabled]);
}
