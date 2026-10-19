import { describe, expect, it } from 'vitest';
import { getNavState } from '@/features/schedule/components/DatePicker';

// 2026-27 season: Sept 1 2026 - June 30 2027 (from getSeasonDateRange).
const seasonRange: [Date, Date] = [new Date(2026, 8, 1), new Date(2027, 5, 30)];

describe('DatePicker getNavState (month view, season-boundary navigation)', () => {
  it('disables prev/next only at the season edges and steps by month', () => {
    // [day in view, prev disabled, next disabled]
    const cases: [Date, boolean, boolean][] = [
      [new Date(2026, 8, 10), true, false], // September 2026, first month
      [new Date(2026, 9, 15), false, false],
      [new Date(2026, 11, 1), false, false],
      [new Date(2027, 5, 10), false, true], // June 2027, last month
    ];
    for (const [day, prev, next] of cases) {
      const nav = getNavState(day, 'month', seasonRange);
      expect(nav.isPrevDisabled, day.toDateString()).toBe(prev);
      expect(nav.isNextDisabled, day.toDateString()).toBe(next);
    }

    const back = getNavState(
      new Date(2026, 9, 15),
      'month',
      seasonRange,
    ).stepTo(-1);
    expect([back.getFullYear(), back.getMonth()]).toEqual([2026, 8]);
    const forward = getNavState(
      new Date(2026, 8, 10),
      'month',
      seasonRange,
    ).stepTo(1);
    expect([forward.getFullYear(), forward.getMonth()]).toEqual([2026, 9]);
  });
});
