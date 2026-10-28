import type {
  LotteryEntrant,
  LotteryResultEntry,
} from '@/features/draft-lottery/utils/draftLotterySim';

const odds = [
  18.5, 13.5, 11.5, 9.5, 8.5, 7.5, 6.5, 6, 5, 3.5, 3, 2.5, 2, 1.5, 0.5, 0.5,
];

export const lotteryTeams: LotteryEntrant[] = odds.map((value, index) => ({
  id: `T${index + 1}`,
  odds: value,
}));

export function makeLotteryResultEntry(
  id: string,
  pick: number,
  movement: number,
  drawWon: 1 | 2 | null,
): LotteryResultEntry {
  return {
    id,
    preLotteryPosition: pick + movement,
    pick,
    movement,
    drawWon,
  };
}

export const lotteryTeamName = (id: string) => `Team ${id}`;
