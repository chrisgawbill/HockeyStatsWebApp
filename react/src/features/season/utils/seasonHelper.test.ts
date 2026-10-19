import { describe, expect, it } from 'vitest';
import {
  formatSeasonLabel,
  getCurrentSeasonId,
  getSeasonDateRange,
  isValidSeasonId,
} from '@/features/season/utils/seasonHelper';

describe('seasonHelper', () => {
  it('getCurrentSeasonId rolls over on September 1 and spans the new year', () => {
    const cases: [Date, string][] = [
      [new Date(2026, 7, 31), '20252026'],
      [new Date(2026, 8, 1), '20262027'],
      [new Date(2026, 8, 2), '20262027'],
      [new Date(2026, 11, 15), '20262027'],
      [new Date(2027, 0, 15), '20262027'],
    ];
    for (const [date, expected] of cases) {
      expect(getCurrentSeasonId(date), date.toDateString()).toBe(expected);
    }
  });

  it('getSeasonDateRange spans Sept 1 - June 30, agreeing with the rollover', () => {
    const [start, end] = getSeasonDateRange('20262027');
    expect(start).toEqual(new Date(2026, 8, 1));
    expect(end).toEqual(new Date(2027, 5, 30));
    // The rollover days belong to the new season's range; Aug 31 does not.
    for (const day of [new Date(2026, 8, 1), new Date(2026, 8, 2)]) {
      expect(day >= start && day <= end).toBe(true);
    }
    expect(new Date(2026, 7, 31) < start).toBe(true);
  });

  it('validates and formats season ids', () => {
    for (const id of ['20232024', '20252026']) {
      expect(isValidSeasonId(id), id).toBe(true);
    }
    for (const id of ['2023', '20232025', 'abcd2024', '']) {
      expect(isValidSeasonId(id), id).toBe(false);
    }
    expect(formatSeasonLabel('20252026')).toBe('2025–26');
    // A malformed id passes through unchanged.
    expect(formatSeasonLabel('bad-season')).toBe('bad-season');
  });
});
