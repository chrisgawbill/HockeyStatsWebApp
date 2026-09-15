import { describe, expect, it } from 'vitest';
import {
  formatSeasonLabel,
  getCurrentSeasonId,
  getSeasonDateRange,
  isValidSeasonId,
} from '@/features/season/utils/seasonHelper';

describe('getCurrentSeasonId', () => {
  it('is still the prior season on August 31', () => {
    expect(getCurrentSeasonId(new Date(2026, 7, 31))).toBe('20252026');
  });

  it('rolls over to the new season on September 1', () => {
    expect(getCurrentSeasonId(new Date(2026, 8, 1))).toBe('20262027');
  });

  it('stays on the new season on September 2', () => {
    expect(getCurrentSeasonId(new Date(2026, 8, 2))).toBe('20262027');
  });

  it('stays on the season that started that year in December', () => {
    expect(getCurrentSeasonId(new Date(2026, 11, 15))).toBe('20262027');
  });

  it('stays on the season that started the prior year in January', () => {
    expect(getCurrentSeasonId(new Date(2027, 0, 15))).toBe('20262027');
  });
});

describe('getSeasonDateRange', () => {
  it('spans September 1 of the start year through June 30 of the end year', () => {
    const [start, end] = getSeasonDateRange('20262027');
    expect(start).toEqual(new Date(2026, 8, 1));
    expect(end).toEqual(new Date(2027, 5, 30));
  });

  it('places September 1 and September 2 of the start year inside the range', () => {
    const [start, end] = getSeasonDateRange('20262027');
    expect(new Date(2026, 8, 1) >= start && new Date(2026, 8, 1) <= end).toBe(
      true,
    );
    expect(new Date(2026, 8, 2) >= start && new Date(2026, 8, 2) <= end).toBe(
      true,
    );
  });

  it('excludes August 31 of the start year, which belongs to the prior season', () => {
    const [start] = getSeasonDateRange('20262027');
    expect(new Date(2026, 7, 31) < start).toBe(true);
  });

  it('agrees with getCurrentSeasonId on the September 1 rollover date', () => {
    // getCurrentSeasonId rolls the season id over on Sept 1; the date range
    // for that new season id must actually include Sept 1 and 2.
    expect(getCurrentSeasonId(new Date(2026, 8, 1))).toBe('20262027');
    expect(getCurrentSeasonId(new Date(2026, 8, 2))).toBe('20262027');

    const [start, end] = getSeasonDateRange('20262027');
    expect(new Date(2026, 8, 1) >= start && new Date(2026, 8, 1) <= end).toBe(
      true,
    );
    expect(new Date(2026, 8, 2) >= start && new Date(2026, 8, 2) <= end).toBe(
      true,
    );
  });
});

describe('isValidSeasonId', () => {
  it('accepts eight digit consecutive season ids', () => {
    expect(isValidSeasonId('20232024')).toBe(true);
    expect(isValidSeasonId('20252026')).toBe(true);
  });

  it('rejects malformed season ids', () => {
    expect(isValidSeasonId('2023')).toBe(false);
    expect(isValidSeasonId('20232025')).toBe(false);
    expect(isValidSeasonId('abcd2024')).toBe(false);
    expect(isValidSeasonId('')).toBe(false);
  });
});

describe('formatSeasonLabel', () => {
  it('formats a valid season id', () => {
    expect(formatSeasonLabel('20252026')).toBe('2025–26');
  });

  it('passes through a malformed id unchanged', () => {
    expect(formatSeasonLabel('bad-season')).toBe('bad-season');
  });
});
