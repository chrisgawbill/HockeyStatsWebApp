import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { isCompletedGameState } from '@/lib/gameStatus';

export type TeamResultOutcome = 'W' | 'L' | 'OTL';

export interface TeamResult {
  date: Date;
  outcome: TeamResultOutcome;
  won: boolean;
  otl: boolean;
  gf: number;
  ga: number;
  home: boolean;
}

export interface TeamSplit {
  games: number;
  wins: number;
  losses: number;
  otl: number;
  gf: number;
  ga: number;
}

/** Converts completed schedule rows into chronological results for one team. */
export function getTeamResults(
  games: ScheduledGame[],
  triCode: string,
): TeamResult[] {
  const normalizedCode = triCode.toUpperCase();

  return games
    .filter(
      (game) =>
        isCompletedGameState(game.gameState) &&
        (game.homeTeam === normalizedCode || game.awayTeam === normalizedCode) &&
        game.homeScore != null &&
        game.awayScore != null,
    )
    .map((game): TeamResult => {
      const home = game.homeTeam === normalizedCode;
      const gf = home ? game.homeScore : game.awayScore;
      const ga = home ? game.awayScore : game.homeScore;
      const won = gf > ga;
      const otl = !won && (game.periodType === 'OT' || game.periodType === 'SO');

      return {
        date: game.date,
        outcome: won ? 'W' : otl ? 'OTL' : 'L',
        won,
        otl,
        gf,
        ga,
        home,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Returns the most recent results while retaining chronological order. */
export function lastN(results: TeamResult[], n: number): TeamResult[] {
  return n > 0 ? results.slice(-n) : [];
}

/** Calculates each result's points percentage over the trailing window. */
export function rollingPointsPct(
  results: TeamResult[],
  window: number,
): number[] {
  if (window <= 0) return [];

  return results.map((_, index) => {
    const sample = results.slice(Math.max(0, index - window + 1), index + 1);
    const points = sample.reduce(
      (total, result) => total + (result.won ? 2 : result.otl ? 1 : 0),
      0,
    );
    return sample.length === 0 ? 0 : points / (sample.length * 2);
  });
}

export function cumulativeGoalDiff(results: TeamResult[]): number {
  return results.reduce((total, result) => total + result.gf - result.ga, 0);
}

function buildSplit(results: TeamResult[]): TeamSplit {
  return results.reduce(
    (split, result) => ({
      games: split.games + 1,
      wins: split.wins + (result.won ? 1 : 0),
      losses: split.losses + (!result.won && !result.otl ? 1 : 0),
      otl: split.otl + (result.otl ? 1 : 0),
      gf: split.gf + result.gf,
      ga: split.ga + result.ga,
    }),
    { games: 0, wins: 0, losses: 0, otl: 0, gf: 0, ga: 0 },
  );
}

export function homeRoadSplits(results: TeamResult[]): {
  home: TeamSplit;
  road: TeamSplit;
} {
  return {
    home: buildSplit(results.filter((result) => result.home)),
    road: buildSplit(results.filter((result) => !result.home)),
  };
}
