import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Measures the sticky page header (the first child of `pageRef`) and the
 * anchor nav (`navRef`) so their heights can drive the nav's own sticky
 * offset and every section's scroll-margin-top. Re-measures on window resize
 * because the nav's height changes when it wraps. Measures only once
 * `isContentReady` is true, since the nav does not exist before then.
 */
export function useStickyOffsets(
  pageRef: RefObject<HTMLElement>,
  navRef: RefObject<HTMLElement>,
  isContentReady: boolean,
) {
  const [stickyOffsets, setStickyOffsets] = useState({ header: 0, nav: 0 });

  useLayoutEffect(() => {
    if (!isContentReady) return;

    function measure() {
      const header = pageRef.current?.firstElementChild;
      setStickyOffsets({
        header: header?.getBoundingClientRect().height ?? 0,
        nav: navRef.current?.getBoundingClientRect().height ?? 0,
      });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isContentReady, pageRef, navRef]);

  return stickyOffsets;
}
