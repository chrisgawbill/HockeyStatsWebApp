import { describe, expect, it } from 'vitest';
import { resolveEffectiveDate } from '@/features/schedule/utils/scheduleHelper';

describe('resolveEffectiveDate', () => {
  const seasonRange: [Date, Date] = [
    new Date(2026, 8, 1),
    new Date(2027, 5, 30),
  ];

  it('keeps an in-season selection, else today if in season, else the nearest season edge', () => {
    const midnight = (y: number, m: number, d: number) => new Date(y, m, d);
    // [selected date, today, expected]
    const cases: [Date | null, Date, Date, string][] = [
      // An in-season selection wins over any in-season today, even on a date
      // with no games loaded yet (Sept 1 is the season's first day).
      [
        midnight(2026, 8, 15),
        midnight(2026, 9, 1),
        midnight(2026, 8, 15),
        'selection before today',
      ],
      [
        midnight(2026, 8, 1),
        midnight(2026, 9, 15),
        midnight(2026, 8, 1),
        'first season day',
      ],
      [
        midnight(2026, 8, 10),
        midnight(2026, 10, 20),
        midnight(2026, 8, 10),
        'different month',
      ],
      // No selection, or an out-of-season one: today, truncated to midnight.
      [
        null,
        new Date(2026, 9, 15, 13, 30),
        midnight(2026, 9, 15),
        'no selection',
      ],
      [
        null,
        midnight(2026, 10, 20),
        midnight(2026, 10, 20),
        'no selection, Nov',
      ],
      [
        midnight(2025, 8, 1),
        midnight(2026, 9, 15),
        midnight(2026, 9, 15),
        'prior season',
      ],
      // Today outside the season too: clamp to the nearest edge.
      [
        midnight(2025, 8, 1),
        midnight(2027, 7, 1),
        seasonRange[1],
        'after season',
      ],
      [
        midnight(2020, 0, 1),
        midnight(2026, 6, 1),
        seasonRange[0],
        'before season',
      ],
    ];
    for (const [selected, today, expected, label] of cases) {
      expect(resolveEffectiveDate(selected, seasonRange, today), label).toEqual(
        expected,
      );
    }
  });
});
