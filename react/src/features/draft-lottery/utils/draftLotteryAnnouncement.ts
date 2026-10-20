import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';

const DRAW_LABEL = { 1: 'first', 2: 'second' } as const;

/**
 * Screen-reader summary of a lottery result. Names the #1 and #2 teams, then
 * any draw winner that could not take its target pick and jumped up instead.
 * @param nameOf resolves a team id to its display name
 */
export function buildLotteryAnnouncement(
  lotteryResult: LotteryResultEntry[],
  nameOf: (id: string) => string,
): string {
  const parts = [
    `${nameOf(lotteryResult[0].id)} win the #1 pick.`,
    `${nameOf(lotteryResult[1].id)} get the #2 pick.`,
  ];
  for (const entry of lotteryResult) {
    if (entry.drawWon !== null && entry.pick > entry.drawWon) {
      parts.push(
        `${nameOf(entry.id)} win the ${DRAW_LABEL[entry.drawWon]} draw and jump ${entry.movement} spots to #${entry.pick}.`,
      );
    }
  }
  return parts.join(' ');
}
