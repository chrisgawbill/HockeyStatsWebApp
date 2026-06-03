import { GameBroadcast } from "../Models/gameBroadcast";
import { ScheduledGame } from "../Models/scheduledGame";

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
 * Parses a "YYYY-MM-DD" string into a Date in the viewer's local time zone.
 * `new Date("YYYY-MM-DD")` parses as UTC and can land on the previous day once
 * rendered locally, so we split the parts and build the date by hand. Throws a
 * TypeError on a missing or malformed string rather than returning Invalid Date.
 */
function parseLocalDate(dateStr: string): Date {
	if (!dateStr){
    throw new TypeError("Date string is missing or empty.");
  } 

	const parts = dateStr.split('-').map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)){
    throw new TypeError(`Invalid date format: ${dateStr}. Expected 'YYYY-MM-DD'.`);
  }

	const [year, month, day] = parts;
	return new Date(year, month - 1, day);
}

/**
 * Buckets games into a map keyed by local date string ("YYYY-MM-DD"), the form
 * the calendar grid looks games up by. Keying with the same `formatDateParam`
 * both sides use guarantees the grid can't miss a day over a Date-vs-string mismatch.
 */
function groupGamesByDate(games: ScheduledGame[]): Record<string, ScheduledGame[]> {
  return games.reduce((acc: Record<string, ScheduledGame[]>, game) => {
    const key = formatDateParam(game.date);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(game);
    return acc;
  }, {} as Record<string, ScheduledGame[]>);
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

export { ConvertContractsToGames, parseLocalDate, groupGamesByDate, formatDateParam };
