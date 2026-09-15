import { GameBroadcast } from '@/features/game-detail/types/gameBroadcast';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { parseLocalDate } from '@/lib/dateFormat';

/**
 * The backend (api/services/mappers/scheduleMapper.js) now returns games already
 * normalized into the ScheduleGameContract shape, so the frontend only wraps each
 * contract in the ScheduledGame / GameBroadcast model classes the UI expects.
 * All NHL-field extraction + playoff logic now lives in the backend mapper.
 */

/**
 * Wraps one normalized ScheduleGameContract from the backend into the
 * ScheduledGame model the UI renders, building its GameBroadcast list along the
 * way. The contract's `date` string is parsed as a local date to avoid UTC shift.
 */
function ConvertContractToGame(g: any): ScheduledGame {
  const broadcasts: GameBroadcast[] = (g.broadcasts ?? []).map(
    (b: any) => new GameBroadcast(b.id, b.network, b.market, b.countryCode),
  );

  return new ScheduledGame(
    g.gameId,
    parseLocalDate(g.date),
    g.gameTime,
    g.dayOfWeek,
    g.venue,
    g.homeTeam,
    g.homeLogo,
    g.homeScore,
    g.awayTeam,
    g.awayLogo,
    g.awayScore,
    broadcasts,
    g.ticketLink,
    g.gameCenter,
    g.isPlayoff,
    g.playoffRound,
    g.periodType,
    g.seriesWins,
    g.topSeedTeamAbbrev,
    g.bottomSeedTeamAbbrev,
    g.gameState,
  );
}

/**
 * Buckets games into a map keyed by local date string ("YYYY-MM-DD"), the form
 * the calendar grid looks games up by. Keying with the same `formatDateParam`
 * both sides use guarantees the grid can't miss a day over a Date-vs-string mismatch.
 */
function groupGamesByDate(
  games: ScheduledGame[],
): Record<string, ScheduledGame[]> {
  return games.reduce(
    (acc: Record<string, ScheduledGame[]>, game) => {
      const key = formatDateParam(game.date);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(game);
      return acc;
    },
    {} as Record<string, ScheduledGame[]>,
  );
}

/**
 * Formats a Date as a local "YYYY-MM-DD" string. Uses local getters (not
 * toISOString, which is UTC) so the key matches the day the user sees.
 */
function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Wraps an array of backend schedule contracts into ScheduledGame models. Empty
 * or missing arrays produce an empty result.
 */
function ConvertContractsToGames(games: any[]): ScheduledGame[] {
  return (games ?? []).map(ConvertContractToGame);
}

/**
 * Resolves the date SchedulePage should anchor its day/week/month view on:
 * an explicit `selectedDate` wins whenever it falls within the loaded season's
 * game-date range, otherwise `today` is used if it's in range, and failing that
 * the season's last game date. With no games loaded at all, `selectedDate` wins
 * if present, else `today`. `today` is injectable (like `getCurrentSeasonId`
 * injects `now`) so callers/tests aren't tied to the real clock.
 */
function resolveEffectiveDate(
  selectedDate: Date | null,
  sortedGames: ScheduledGame[],
  today: Date = new Date(),
): Date {
  if (sortedGames.length === 0) {
    return selectedDate ?? new Date();
  }
  const first = sortedGames[0].date;
  const last = sortedGames[sortedGames.length - 1].date;
  if (selectedDate && selectedDate >= first && selectedDate <= last) {
    return selectedDate;
  }
  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);
  if (normalizedToday >= first && normalizedToday <= last) {
    return normalizedToday;
  }
  return last;
}

export {
  ConvertContractsToGames,
  groupGamesByDate,
  formatDateParam,
  resolveEffectiveDate,
};
