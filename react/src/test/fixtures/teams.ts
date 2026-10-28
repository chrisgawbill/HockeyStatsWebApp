import {
  Position,
  RosterPlayer,
  SkaterSummaryContract,
} from '@/features/teams/types/teamPageTypes';
import { buildEmptyRoster } from '@/features/teams/utils/teamPageHelper';
import { TeamLinesDto } from '@/features/teams/types/teamLines';
import { buildStatsLookup } from '@/features/teams/utils/playerStatsHelper';

export function player(id: number, name = `P${id} Last${id}`): RosterPlayer {
  return { id, name, number: id, stat: '' };
}

export function roster(o: Partial<Record<Position, RosterPlayer[]>>) {
  return { ...buildEmptyRoster(), ...o };
}

export const baseRoster = roster({
  Center: [player(1), player(2)],
  'Left Wing': [player(3), player(4)],
  'Right Wing': [player(5), player(6)],
  Defenseman: [player(7), player(8), player(9)],
  Goalie: [player(10), player(11)],
});
export const lineGame = {
  gameId: 1,
  gameDate: '2025-10-18',
  opponent: 'BOS',
  homeAway: 'home' as const,
};
export function dto(over: Partial<TeamLinesDto> = {}): TeamLinesDto {
  return {
    source: 'shifts',
    game: lineGame,
    forwardLines: [
      {
        players: [
          { id: 5, slot: 'RW' },
          { id: 1, slot: 'C' },
          { id: 3, slot: 'LW' },
        ],
        togetherSeconds: 872,
      },
    ],
    defensePairs: [
      {
        players: [
          { id: 8, slot: 'RD' },
          { id: 7, slot: 'LD' },
        ],
        togetherSeconds: 600,
      },
    ],
    goalies: { starterId: 11 },
    ...over,
  };
}

export const lookup = buildStatsLookup(
  [
    {
      playerId: 1,
      name: 'A',
      position: 'L',
      gamesPlayed: 10,
      goals: 4,
      assists: 6,
      points: 10,
      plusMinus: 3,
      penaltyMinutes: 0,
      faceoffWinPct: null,
      offensiveZoneFaceoffs: null,
      defensiveZoneFaceoffs: null,
      corsiPct: null,
    },
  ],
  [
    {
      goalieId: 2,
      name: 'G',
      gamesPlayed: 5,
      wins: 3,
      losses: 2,
      savePctg: 0.915,
      goalsAgainstAverage: 2.5,
      shutouts: 1,
    },
  ],
);

export const centerSummary = {
  playerId: 29,
  name: 'Nathan MacKinnon',
  position: 'C',
  gamesPlayed: 10,
  faceoffWinPct: 0.52,
} as SkaterSummaryContract;
