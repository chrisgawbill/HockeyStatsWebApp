import { describe, expect, it } from 'vitest';
import { resolveEffectiveDate } from '@/features/schedule/utils/scheduleHelper';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';

/**
 * Builds a minimal ScheduledGame stub for date-resolution tests, which only
 * inspect `.date`.
 */
function gameOn(date: Date): ScheduledGame {
  return { date } as ScheduledGame;
}

describe('resolveEffectiveDate', () => {
  it('prefers an explicit selected date inside the season range even when today is a later in-range date', () => {
    const sortedGames = [
      gameOn(new Date(2025, 9, 1)),
      gameOn(new Date(2025, 9, 15)),
      gameOn(new Date(2025, 10, 1)),
    ];
    const selectedDate = new Date(2025, 9, 1);
    const today = new Date(2025, 9, 15);

    const result = resolveEffectiveDate(selectedDate, sortedGames, today);

    expect(result).toEqual(selectedDate);
  });

  it('falls back to today when no date is selected and today is in range', () => {
    const sortedGames = [
      gameOn(new Date(2025, 9, 1)),
      gameOn(new Date(2025, 10, 1)),
    ];
    const today = new Date(2025, 9, 15, 13, 30);

    const result = resolveEffectiveDate(null, sortedGames, today);

    expect(result).toEqual(new Date(2025, 9, 15, 0, 0, 0, 0));
  });

  it('falls back to today when the selected date is outside the game range but today is in range', () => {
    const sortedGames = [
      gameOn(new Date(2025, 9, 1)),
      gameOn(new Date(2025, 10, 1)),
    ];
    const selectedDate = new Date(2025, 8, 1);
    const today = new Date(2025, 9, 15);

    const result = resolveEffectiveDate(selectedDate, sortedGames, today);

    expect(result).toEqual(new Date(2025, 9, 15, 0, 0, 0, 0));
  });

  it('falls back to the last game date when both the selected date and today are out of range', () => {
    const last = new Date(2025, 10, 1);
    const sortedGames = [gameOn(new Date(2025, 9, 1)), gameOn(last)];
    const selectedDate = new Date(2025, 8, 1);
    const today = new Date(2026, 0, 1);

    const result = resolveEffectiveDate(selectedDate, sortedGames, today);

    expect(result).toEqual(last);
  });

  it('falls back to the selected date when the games array is empty', () => {
    const selectedDate = new Date(2025, 9, 1);

    const result = resolveEffectiveDate(selectedDate, [], new Date());

    expect(result).toEqual(selectedDate);
  });

  it('falls back to now when the games array is empty and no date is selected', () => {
    const before = new Date();
    const result = resolveEffectiveDate(null, []);
    const after = new Date();

    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
