export type Theme = 'light' | 'dark';

/** Local hour (inclusive) dark mode starts at. */
export const DARK_START_HOUR = 19;
/** Local hour (exclusive) dark mode ends at. */
export const DARK_END_HOUR = 7;

/** Time-of-day theme: dark from DARK_START_HOUR until DARK_END_HOUR, light otherwise. */
export function themeForHour(hour: number): Theme {
  return hour >= DARK_START_HOUR || hour < DARK_END_HOUR ? 'dark' : 'light';
}

/** Dark when the system prefers dark OR the local hour falls in the dark window. */
export function resolveTheme(systemPrefersDark: boolean, hour: number): Theme {
  return systemPrefersDark || themeForHour(hour) === 'dark' ? 'dark' : 'light';
}
