import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { isCompletedGameState } from '@/lib/gameStatus';

/** Games shown per page of the desktop schedule strip. */
export const SCHEDULE_STRIP_PAGE_SIZE = 7;

/**
 * Reads a game date as a local calendar day. Accepts a `Date` (time of day
 * dropped) or a "YYYY-MM-DD" string.
 */
export function parseGameDate(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a game date like "Jan 5, 2026". */
export function formatGameDate(date: string | Date): string {
  return parseGameDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Index of the first game on or after this week's Monday, so the strip opens
 * on the current week; falls back to the final page when the season is over.
 */
export function findCurrentWeekStartIndex(games: ScheduledGame[]): number {
  if (games.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const index = games.findIndex((game) => parseGameDate(game.date) >= monday);
  return index === -1
    ? Math.max(0, games.length - SCHEDULE_STRIP_PAGE_SIZE)
    : index;
}

/**
 * The team's result label for a completed game: W/L, OTW/OTL, or SOW/SOL.
 * Null while the game is unfinished or has no score.
 */
export function getTeamResultLabel(
  game: ScheduledGame,
  teamAbbrev: string,
): string | null {
  if (
    !isCompletedGameState(game.gameState) ||
    game.homeScore == null ||
    game.awayScore == null
  ) {
    return null;
  }

  const isHome = game.homeTeam === teamAbbrev;
  const teamScore = isHome ? game.homeScore : game.awayScore;
  const opponentScore = isHome ? game.awayScore : game.homeScore;
  const won = teamScore > opponentScore;

  if (game.periodType === 'SO') return won ? 'SOW' : 'SOL';
  if (game.periodType === 'OT') return won ? 'OTW' : 'OTL';
  return won ? 'W' : 'L';
}
