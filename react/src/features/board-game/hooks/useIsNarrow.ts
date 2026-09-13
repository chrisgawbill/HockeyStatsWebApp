import { useEffect, useState } from 'react';

const QUERY = '(max-width: 576px)';

/**
 * True when the viewport is at most 576px wide. Single source of truth for
 * the board's narrow/vertical layout — implement the breakpoint once here,
 * not per component.
 */
export function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handleChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return narrow;
}
