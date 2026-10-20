import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { isCompletedGameState } from '@/lib/gameStatus';

export interface SeasonSeriesSummary {
  teamAwins: number;
  teamBwins: number;
  ties: number;
  teamAGoals: number;
  teamBGoals: number;
}

export interface SeasonSeries {
  played: ScheduledGame[];
  upcoming: ScheduledGame[];
  summary: SeasonSeriesSummary;
}

/**
 * Collects the meetings between two teams in the loaded season, oldest first,
 * split into played (completed with scores) and upcoming, with the series
 * win/tie and goal totals from teamA's and teamB's points of view.
 */
export function getSeasonSeries(
  games: ScheduledGame[],
  teamA: string,
  teamB: string,
): SeasonSeries {
  const teamACode = teamA.toUpperCase();
  const teamBCode = teamB.toUpperCase();
  const meetings = games
    .filter(
      (game) =>
        (game.homeTeam === teamACode && game.awayTeam === teamBCode) ||
        (game.homeTeam === teamBCode && game.awayTeam === teamACode),
    )
    .sort((left, right) => left.date.getTime() - right.date.getTime());
  const played = meetings.filter(
    (game) =>
      isCompletedGameState(game.gameState) &&
      game.homeScore != null &&
      game.awayScore != null,
  );
  const upcoming = meetings.filter((game) => !played.includes(game));
  const summary = played.reduce<SeasonSeriesSummary>(
    (summaryTotals, game) => {
      const aGoals =
        game.homeTeam === teamACode ? game.homeScore : game.awayScore;
      const bGoals =
        game.homeTeam === teamBCode ? game.homeScore : game.awayScore;
      summaryTotals.teamAGoals += aGoals;
      summaryTotals.teamBGoals += bGoals;
      if (aGoals > bGoals) summaryTotals.teamAwins += 1;
      else if (bGoals > aGoals) summaryTotals.teamBwins += 1;
      else summaryTotals.ties += 1;
      return summaryTotals;
    },
    { teamAwins: 0, teamBwins: 0, ties: 0, teamAGoals: 0, teamBGoals: 0 },
  );
  return { played, upcoming, summary };
}
