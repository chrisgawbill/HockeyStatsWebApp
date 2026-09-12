import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { isCompletedGameState, isInProgressGameState } from '@/lib/gameStatus';

/**
 * Small, presentation-only helpers shared by the schedule's day cards and the
 * week/month calendar chips. These are display concerns (score/status labels),
 * not NHL-shape parsing — that lives in the backend mappers. Local time-of-day
 * formatting and completed/in-progress predicates live in `@/lib` since other
 * features need them too; import those directly from there.
 */

/**
 * Returns true once both teams have score values, which lets the UI switch from
 * start-time display to score/status display.
 */
export function hasScore(game: ScheduledGame): boolean {
  return game.homeScore != null && game.awayScore != null;
}

/**
 * Produces the compact status label used by schedule cards/chips: final,
 * overtime/shootout final, live, or an empty string for future games.
 */
export function getGameStatusLabel(game: ScheduledGame): string {
  if (isCompletedGameState(game.gameState)) {
    if (game.periodType === 'OT') return 'F/OT';
    if (game.periodType === 'SO') return 'F/SO';
    return 'FINAL';
  }
  if (isInProgressGameState(game.gameState)) return 'LIVE';
  return '';
}
