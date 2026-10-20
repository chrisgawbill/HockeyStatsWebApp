import { RefObject, useEffect } from 'react';

/**
 * Publishes the mobile chrome sizes as CSS variables so page layouts can
 * clear them: `--mobile-chrome-height` is the fixed bottom navigation bar
 * (also offsets the search FAB) and `--mobile-top-chrome-height` the sticky
 * top app bar including its bottom margin. Both read 0 above the phone
 * breakpoint, where the header is the only chrome.
 */
export function useMobileChromeHeights(
  topNavRef: RefObject<HTMLElement>,
  bottomNavRef: RefObject<HTMLElement>,
) {
  useEffect(() => {
    const topNav = topNavRef.current;
    const bottomNav = bottomNavRef.current;
    if (!topNav || !bottomNav) return;

    const media = window.matchMedia('(max-width: 576px)');
    const root = document.documentElement.style;
    const updateChromeHeight = () => {
      const topHeight =
        topNav.offsetHeight + parseFloat(getComputedStyle(topNav).marginBottom);
      root.setProperty(
        '--mobile-chrome-height',
        media.matches ? `${bottomNav.offsetHeight}px` : '0px',
      );
      root.setProperty(
        '--mobile-top-chrome-height',
        media.matches ? `${topHeight}px` : '0px',
      );
    };
    const observer = new ResizeObserver(updateChromeHeight);

    observer.observe(topNav);
    observer.observe(bottomNav);
    media.addEventListener('change', updateChromeHeight);
    updateChromeHeight();
    return () => {
      observer.disconnect();
      media.removeEventListener('change', updateChromeHeight);
      root.removeProperty('--mobile-chrome-height');
      root.removeProperty('--mobile-top-chrome-height');
    };
  }, [topNavRef, bottomNavRef]);
}
