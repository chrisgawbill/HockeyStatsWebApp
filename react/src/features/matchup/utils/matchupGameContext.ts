import { ScheduledGame } from '@/features/schedule/types/scheduledGame';

/** Reads the `game=` query value as an NHL game id; anything but digits is no id. */
export function parseGameIdParam(value: string | null): number | null {
  if (value == null || !/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

/**
 * The previewed game named by `game=`, looked up in the loaded season games.
 * Null when there is no id, the season list lacks it, or it is not between the
 * two selected teams (in either order), so changing a team drops the preview.
 */
export function findMatchupGame(
  games: ScheduledGame[],
  gameIdParam: string | null,
  teamA: string,
  teamB: string,
): ScheduledGame | null {
  const gameId = parseGameIdParam(gameIdParam);
  if (gameId == null) return null;
  const game = games.find((seasonGame) => seasonGame.gameId === gameId);
  if (!game) return null;
  const selectedTeams = [teamA.toUpperCase(), teamB.toUpperCase()].sort();
  const gameTeams = [game.awayTeam, game.homeTeam].sort();
  const isBetweenSelectedTeams =
    selectedTeams[0] === gameTeams[0] && selectedTeams[1] === gameTeams[1];
  return isBetweenSelectedTeams ? game : null;
}
