import React, { createContext, useContext, useEffect, useState } from 'react';
import { resolveTheme, type Theme } from '@/lib/themeSchedule';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

const DARK_QUERY = '(prefers-color-scheme: dark)';
const RECHECK_INTERVAL_MS = 60_000;

function computeTheme(): Theme {
  const systemPrefersDark = window.matchMedia(DARK_QUERY).matches;
  return resolveTheme(systemPrefersDark, new Date().getHours());
}

/**
 * Theme comes only from local time and the system's color-scheme preference
 * — no manual toggle. Re-evaluated on a 60s interval, on tab visibility
 * change, and on the media query's own change event.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => computeTheme());

  useEffect(() => {
    try {
      localStorage.removeItem('theme');
    } catch {
      // Ignore: storage may be unavailable (private mode, disabled, etc.).
    }
  }, []);

  useEffect(() => {
    const recompute = () => setTheme(computeTheme());
    const interval = setInterval(recompute, RECHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', recompute);
    const mediaQuery = window.matchMedia(DARK_QUERY);
    mediaQuery.addEventListener('change', recompute);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', recompute);
      mediaQuery.removeEventListener('change', recompute);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
