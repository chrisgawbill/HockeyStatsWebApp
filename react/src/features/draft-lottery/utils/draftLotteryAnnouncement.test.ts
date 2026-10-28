import { describe, expect, it } from 'vitest';
import { buildLotteryAnnouncement } from '@/features/draft-lottery/utils/draftLotteryAnnouncement';
import {
  lotteryTeamName as nameOf,
  makeLotteryResultEntry as entry,
} from '@/test/fixtures/draftLottery';

describe('buildLotteryAnnouncement', () => {
  it('names the #1 and #2 teams', () => {
    const text = buildLotteryAnnouncement(
      [entry('A', 1, 3, 1), entry('B', 2, 1, 2)],
      nameOf,
    );
    expect(text).toBe('Team A win the #1 pick. Team B get the #2 pick.');
  });

  it('announces an ineligible draw-2 winner jumping 10 spots', () => {
    const text = buildLotteryAnnouncement(
      [entry('A', 1, 0, null), entry('B', 2, 0, null), entry('C', 3, 10, 2)],
      nameOf,
    );
    expect(text).toContain(
      'Team C win the second draw and jump 10 spots to #3.',
    );
  });

  it('announces an ineligible draw-1 winner', () => {
    const text = buildLotteryAnnouncement(
      [entry('A', 1, 0, null), entry('B', 2, 0, 2), entry('C', 6, 10, 1)],
      nameOf,
    );
    expect(text).toContain(
      'Team C win the first draw and jump 10 spots to #6.',
    );
    expect(text).not.toContain('Team B win the second draw');
  });
});
