import React, { createContext, useContext, useEffect, useState } from 'react';
import { resolveTheme, type Theme } from '@/lib/themeSchedule';

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export type ThemePreference = Theme | 'system';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  preference: 'system',
  setPreference: () => undefined,
});

const DARK_QUERY = '(prefers-color-scheme: dark)';
const RECHECK_INTERVAL_MS = 60_000;
const THEME_STORAGE_KEY = 'theme';

function computeTheme(): Theme {
  const systemPrefersDark = window.matchMedia(DARK_QUERY).matches;
  return resolveTheme(systemPrefersDark, new Date().getHours());
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function themeForPreference(preference: ThemePreference): Theme {
  return preference === 'system' ? computeTheme() : preference;
}

/**
 * Theme follows the system/time-of-day default until a user explicitly chooses
 * light or dark. System mode is re-evaluated on a 60s interval, on tab
 * visibility change, and on the media query's own change event.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readPreference(),
  );
  const [theme, setTheme] = useState<Theme>(() =>
    themeForPreference(readPreference()),
  );

  const setPreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    setTheme(themeForPreference(nextPreference));
    try {
      if (nextPreference === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
      }
    } catch {
      // Ignore: storage may be unavailable (private mode, disabled, etc.).
    }
  };

  useEffect(() => {
    if (preference !== 'system') return;
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
  }, [preference]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
