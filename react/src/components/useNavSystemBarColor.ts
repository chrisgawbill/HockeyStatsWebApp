import { RefObject, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@/lib/ThemeContext';
import { navTopEdgeColor } from '@/lib/systemBarColor';
import { useThemeColor } from '@/lib/useThemeColor';

/**
 * Tints the system status bar (`theme-color`: Android installed app, Safari)
 * to the nav bar's top edge, so a team page's tinted bar and the status bar
 * above it read as one surface. Re-read on route and theme changes, since
 * both change `--color-primary` / `--color-bg`.
 */
export function useNavSystemBarColor(navRef: RefObject<HTMLElement>) {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const [systemBarColor, setSystemBarColor] = useState<string | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const style = getComputedStyle(nav);
    setSystemBarColor(
      navTopEdgeColor(
        style.getPropertyValue('--color-primary'),
        style.getPropertyValue('--color-bg'),
      ),
    );
  }, [navRef, pathname, theme]);
  useThemeColor(systemBarColor);
}
