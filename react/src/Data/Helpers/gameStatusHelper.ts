import { ScheduledGame } from '../Models/scheduledGame';

/**
 * Small, presentation-only helpers shared by the schedule's day cards and the
 * week/month calendar chips. These are display concerns (time formatting, game
 * status labels), not NHL-shape parsing — that lives in the backend mappers.
 */

/**
 * Converts an NHL UTC start-time string into the viewer's local "h:mm AM/PM"
 * display label.
 */
export function convertUTCToLocal(utcString: string): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(utcString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

/**
 * Returns true once both teams have score values, which lets the UI switch from
 * start-time display to score/status display.
 */
export function hasScore(game: ScheduledGame): boolean {
  return game.homeScore != null && game.awayScore != null;
}

/**
 * Returns true for live/in-progress NHL game states by excluding pre-game and
 * completed states.
 */
export function isGameInProgress(game: ScheduledGame): boolean {
  return (
    game.gameState !== 'FUT' &&
    game.gameState !== 'PRE' &&
    game.gameState !== 'OFF' &&
    game.gameState !== 'FINAL'
  );
}

/**
 * Produces the compact status label used by schedule cards/chips: final,
 * overtime/shootout final, live, or an empty string for future games.
 */
export function getGameStatusLabel(game: ScheduledGame): string {
  if (game.gameState === 'OFF' || game.gameState === 'FINAL') {
    if (game.periodType === 'OT') return 'F/OT';
    if (game.periodType === 'SO') return 'F/SO';
    return 'FINAL';
  }
  if (isGameInProgress(game)) return 'LIVE';
  return '';
}
