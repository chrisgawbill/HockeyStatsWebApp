import { describe, expect, it } from 'vitest';
import { resolveEffectiveDate } from '@/features/schedule/utils/scheduleHelper';

describe('resolveEffectiveDate', () => {
  const seasonRange: [Date, Date] = [
    new Date(2026, 8, 1),
    new Date(2027, 5, 30),
  ];

  it('prefers an explicit selected date inside the season range even when today is a later in-range date', () => {
    const selectedDate = new Date(2026, 8, 15); // Sept 15 2026
    const today = new Date(2026, 9, 1); // Oct 1 2026

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(selectedDate);
  });

  it('honors an explicit selection on a date no games have been scheduled for yet, as long as it is in-season', () => {
    // September 2026 is the first month of the 2026-27 season, even if no
    // games happen to be loaded/scheduled that early.
    const selectedDate = new Date(2026, 8, 1);
    const today = new Date(2026, 9, 15);

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(selectedDate);
  });

  it('falls back to today when no date is selected and today is in range', () => {
    const today = new Date(2026, 9, 15, 13, 30);

    const result = resolveEffectiveDate(null, seasonRange, today);

    expect(result).toEqual(new Date(2026, 9, 15, 0, 0, 0, 0));
  });

  it('falls back to today when the selected date is outside the season range but today is in range', () => {
    const selectedDate = new Date(2025, 8, 1); // prior season
    const today = new Date(2026, 9, 15);

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(new Date(2026, 9, 15, 0, 0, 0, 0));
  });

  it('falls back to the season end when both the selected date and today are after the season', () => {
    const selectedDate = new Date(2025, 8, 1);
    const today = new Date(2027, 7, 1); // after June 30 2027

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(seasonRange[1]);
  });

  it('falls back to the season start when both the selected date and today are before the season', () => {
    const selectedDate = new Date(2020, 0, 1);
    const today = new Date(2026, 6, 1); // July 2026, before Sept 1 2026

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(seasonRange[0]);
  });

  it('does not override an explicit month selection with today when today is a different in-season month', () => {
    const selectedDate = new Date(2026, 8, 10); // September, explicit
    const today = new Date(2026, 10, 20); // November, "today"

    const result = resolveEffectiveDate(selectedDate, seasonRange, today);

    expect(result).toEqual(selectedDate);
  });

  it('uses today to anchor the initial view when there is no explicit selection', () => {
    const today = new Date(2026, 10, 20);

    const result = resolveEffectiveDate(null, seasonRange, today);

    expect(result).toEqual(new Date(2026, 10, 20, 0, 0, 0, 0));
  });
});
