import { describe, expect, it } from 'vitest';
import { getNavState } from '@/features/schedule/components/DatePicker';

// 2026-27 season: Sept 1 2026 - June 30 2027 (from getSeasonDateRange).
const seasonRange: [Date, Date] = [
  new Date(2026, 8, 1),
  new Date(2027, 5, 30),
];

describe('DatePicker getNavState (month view, season-boundary navigation)', () => {
  it('lets October 2026 step back to September 2026', () => {
    const october = new Date(2026, 9, 15);
    const { isPrevDisabled, stepTo } = getNavState(
      october,
      'month',
      seasonRange,
    );

    expect(isPrevDisabled).toBe(false);
    const stepped = stepTo(-1);
    expect(stepped.getFullYear()).toBe(2026);
    expect(stepped.getMonth()).toBe(8); // September
  });

  it('disables prev on September 2026, the season\'s first month', () => {
    const september = new Date(2026, 8, 10);
    const { isPrevDisabled } = getNavState(september, 'month', seasonRange);

    expect(isPrevDisabled).toBe(true);
  });

  it('lets September 2026 step forward to October 2026', () => {
    const september = new Date(2026, 8, 10);
    const { isNextDisabled, stepTo } = getNavState(
      september,
      'month',
      seasonRange,
    );

    expect(isNextDisabled).toBe(false);
    const stepped = stepTo(1);
    expect(stepped.getFullYear()).toBe(2026);
    expect(stepped.getMonth()).toBe(9); // October
  });

  it('disables next on June 2027, the season\'s last month', () => {
    const june = new Date(2027, 5, 10);
    const { isNextDisabled } = getNavState(june, 'month', seasonRange);

    expect(isNextDisabled).toBe(true);
  });

  it('does not disable prev/next for months in the middle of the season', () => {
    const december = new Date(2026, 11, 1);
    const { isPrevDisabled, isNextDisabled } = getNavState(
      december,
      'month',
      seasonRange,
    );

    expect(isPrevDisabled).toBe(false);
    expect(isNextDisabled).toBe(false);
  });
});
