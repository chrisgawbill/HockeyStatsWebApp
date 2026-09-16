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

export function getSeasonSeries(
  games: ScheduledGame[],
  teamA: string,
  teamB: string,
): SeasonSeries {
  const a = teamA.toUpperCase();
  const b = teamB.toUpperCase();
  const meetings = games
    .filter(
      (game) =>
        ((game.homeTeam === a && game.awayTeam === b) ||
          (game.homeTeam === b && game.awayTeam === a)),
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
    (result, game) => {
      const aGoals = game.homeTeam === a ? game.homeScore : game.awayScore;
      const bGoals = game.homeTeam === b ? game.homeScore : game.awayScore;
      result.teamAGoals += aGoals;
      result.teamBGoals += bGoals;
      if (aGoals > bGoals) result.teamAwins += 1;
      else if (bGoals > aGoals) result.teamBwins += 1;
      else result.ties += 1;
      return result;
    },
    { teamAwins: 0, teamBwins: 0, ties: 0, teamAGoals: 0, teamBGoals: 0 },
  );
  return { played, upcoming, summary };
}
