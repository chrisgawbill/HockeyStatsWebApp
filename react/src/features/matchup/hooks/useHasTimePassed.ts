import { useEffect, useState } from 'react';

/** Longest delay `setTimeout` accepts (about 24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * True once the clock reaches `time`. Re-renders at that moment with a local
 * timer only, never a network request, so a preview page flips to "game on"
 * without polling. A missing or unreadable time never passes.
 */
export function useHasTimePassed(time: string | null): boolean {
  const targetMs = time ? new Date(time).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(targetMs) || now >= targetMs) return;
    const delay = Math.min(targetMs - now, MAX_TIMEOUT_MS);
    const timeoutId = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timeoutId);
  }, [targetMs, now]);

  return !Number.isNaN(targetMs) && now >= targetMs;
}
