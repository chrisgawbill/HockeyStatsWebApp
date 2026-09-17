import { GameBroadcast } from '@/features/game-detail/types/gameBroadcast';
import { ScheduleGameDto } from '@/features/schedule/api/scheduleApi';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { parseLocalDate } from '@/lib/dateFormat';

/**
 * Wraps one normalized schedule contract in the UI model and builds its
 * broadcast list. The contract's `date` string is parsed as a local date to
 * avoid UTC shift.
 */
function ConvertContractToGame(g: ScheduleGameDto): ScheduledGame {
  const broadcasts: GameBroadcast[] = (g.broadcasts ?? []).map(
    (b) => new GameBroadcast(b.id, b.network, b.market, b.countryCode),
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
    g.isPreseason,
    g.playoffRound,
    g.periodType,
    g.seriesWins,
    g.topSeedTeamAbbrev ?? null,
    g.bottomSeedTeamAbbrev ?? null,
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
function ConvertContractsToGames(games: ScheduleGameDto[]): ScheduledGame[] {
  return (games ?? []).map(ConvertContractToGame);
}

/**
 * Resolves the date SchedulePage should anchor its day/week/month view on,
 * bounded by the selected season's actual calendar range (Sept 1 – June 30,
 * from `getSeasonDateRange`) rather than by which dates happen to have games
 * loaded. Precedence:
 *   1. an explicit `selectedDate` wins whenever it falls inside the season's
 *      date range,
 *   2. otherwise `today` is used when it falls inside the season's range,
 *   3. otherwise the season's own boundary closest to `today` (its start if
 *      `today` is before the season, its end if `today` is after it).
 * `today` is injectable (like `getCurrentSeasonId` injects `now`) so
 * callers/tests aren't tied to the real clock.
 */
function resolveEffectiveDate(
  selectedDate: Date | null,
  seasonRange: [Date, Date],
  today: Date = new Date(),
): Date {
  const [start, end] = seasonRange;

  if (selectedDate && selectedDate >= start && selectedDate <= end) {
    return selectedDate;
  }

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);
  if (normalizedToday >= start && normalizedToday <= end) {
    return normalizedToday;
  }

  return normalizedToday < start ? start : end;
}

export {
  ConvertContractsToGames,
  groupGamesByDate,
  formatDateParam,
  resolveEffectiveDate,
};
