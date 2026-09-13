import { describe, expect, it } from 'vitest';
import { resolveTheme, themeForHour } from '@/lib/themeSchedule';

describe('themeForHour', () => {
  it.each([
    [6, 'dark'],
    [7, 'light'],
    [18, 'light'],
    [19, 'dark'],
    [23, 'dark'],
    [0, 'dark'],
  ] as const)('hour %i -> %s', (hour, expected) => {
    expect(themeForHour(hour)).toBe(expected);
  });
});

describe('resolveTheme', () => {
  it('is dark when the system prefers dark, even at noon', () => {
    expect(resolveTheme(true, 12)).toBe('dark');
  });

  it('is dark when the system prefers light but it is 21:00', () => {
    expect(resolveTheme(false, 21)).toBe('dark');
  });

  it('is light when the system prefers light and it is noon', () => {
    expect(resolveTheme(false, 12)).toBe('light');
  });
});
