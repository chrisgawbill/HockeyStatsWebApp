import { describe, expect, it } from 'vitest';
import { resolveTheme, themeForHour } from '@/lib/themeSchedule';

describe('themeSchedule', () => {
  it('themeForHour is light from 07:00 through 18:59', () => {
    const cases = [
      [6, 'dark'],
      [7, 'light'],
      [18, 'light'],
      [19, 'dark'],
      [23, 'dark'],
      [0, 'dark'],
    ] as const;
    for (const [hour, expected] of cases) {
      expect(themeForHour(hour), `hour ${hour}`).toBe(expected);
    }
  });

  it('resolveTheme is dark when the system prefers dark or it is night', () => {
    expect(resolveTheme(true, 12)).toBe('dark');
    expect(resolveTheme(false, 21)).toBe('dark');
    expect(resolveTheme(false, 12)).toBe('light');
  });
});
