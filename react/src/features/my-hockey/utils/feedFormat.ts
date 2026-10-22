import { formatLocalTime } from '@/lib/dateFormat';
import type {
  FeedGame,
  PlayerGameLine,
  SeasonTotals,
} from '@/features/my-hockey/types/myHockey';

/** Local hour from which a game later today reads as "Tonight". */
const EVENING_HOUR = 17;

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Short local date, e.g. "Oct 19". */
export function formatShortDate(startTime: string): string {
  return new Date(startTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** The day a game starts: "Tonight", "Today", "Tomorrow", or "Thu, Oct 23". */
export function formatGameDay(startTime: string, now: Date): string {
  const start = new Date(startTime);
  if (isSameLocalDay(start, now)) {
    return start.getHours() >= EVENING_HOUR ? 'Tonight' : 'Today';
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameLocalDay(start, tomorrow)) return 'Tomorrow';
  return start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Local start time, e.g. "7:00 PM". */
export function formatStartTime(startTime: string): string {
  return formatLocalTime(startTime);
}

export function getOpponent(game: FeedGame, triCode: string): string {
  return game.homeTeam === triCode ? game.awayTeam : game.homeTeam;
}

/** "vs" when the team is at home, "at" when it is away. */
export function getVenueWord(game: FeedGame, triCode: string): 'vs' | 'at' {
  return game.homeTeam === triCode ? 'vs' : 'at';
}

/** "MTL vs BOS" at home, "MTL at BOS" away. */
export function describeMatchup(game: FeedGame, triCode: string): string {
  return `${triCode} ${getVenueWord(game, triCode)} ${getOpponent(game, triCode)}`;
}

/** The score told from one team's side, e.g. { teamScore: 4, opponentScore: 2 }. */
export function getScoreFor(game: FeedGame, triCode: string) {
  const isHome = game.homeTeam === triCode;
  return {
    teamScore: (isHome ? game.homeScore : game.awayScore) ?? 0,
    opponentScore: (isHome ? game.awayScore : game.homeScore) ?? 0,
  };
}

/** "OT" or "SO" when a game went past regulation, else null. */
export function getExtraTimeLabel(game: FeedGame): string | null {
  return game.periodType === 'OT' || game.periodType === 'SO'
    ? game.periodType
    : null;
}

export type ResultLetter = 'W' | 'L' | 'OTL';

/** W, L, or OTL (a loss in overtime or a shootout) for one team in a final. */
export function getResultLetter(game: FeedGame, triCode: string): ResultLetter {
  const { teamScore, opponentScore } = getScoreFor(game, triCode);
  if (teamScore > opponentScore) return 'W';
  return getExtraTimeLabel(game) ? 'OTL' : 'L';
}

const PERIOD_NAMES = ['1st', '2nd', '3rd'];

/** Where a live game is: "1st"–"3rd", "OT", "SO", or "" before the box score. */
export function formatLivePeriod(game: FeedGame): string {
  const extraTime = getExtraTimeLabel(game);
  if (extraTime) return extraTime;
  return game.period ? (PERIOD_NAMES[game.period - 1] ?? 'OT') : '';
}

/** ".912" from 0.912. */
function formatSavePct(savePct: number): string {
  return savePct.toFixed(3).replace(/^0/, '');
}

/** Skaters "8 GP · 6 G · 3 A · 9 P"; goalies "5 GP · 4-1-0 · .912 · 2.41". */
export function formatSeasonLine(totals: SeasonTotals): string {
  if (totals.type === 'skater') {
    return `${totals.gamesPlayed} GP · ${totals.goals} G · ${totals.assists} A · ${totals.points} P`;
  }
  const record = [totals.wins, totals.losses, totals.otLosses]
    .filter((count) => count !== null)
    .join('-');
  return [
    `${totals.gamesPlayed} GP`,
    record,
    totals.savePct !== null ? formatSavePct(totals.savePct) : null,
    totals.goalsAgainstAverage !== null
      ? totals.goalsAgainstAverage.toFixed(2)
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** "1G 1A", "No points", or "W, 31 saves". */
export function formatGameLine(line: PlayerGameLine): string {
  if (line.type === 'goalie') {
    const saves = `${line.saves} ${line.saves === 1 ? 'save' : 'saves'}`;
    return line.decision ? `${line.decision}, ${saves}` : saves;
  }
  const scoring = [
    line.goals ? `${line.goals}G` : null,
    line.assists ? `${line.assists}A` : null,
  ].filter(Boolean);
  return scoring.length ? scoring.join(' ') : 'No points';
}

/**
 * A player's latest game: "Last game: 1G 1A at TOR, Oct 19", "Live: 1G vs
 * OTT", or "Did not play at TOR, Oct 19".
 */
export function formatLatestGameLine(
  game: FeedGame,
  line: PlayerGameLine | null,
  teamTriCode: string,
  isLive: boolean,
): string {
  const opponent = `${getVenueWord(game, teamTriCode)} ${getOpponent(game, teamTriCode)}`;
  if (isLive) {
    return line
      ? `Live: ${formatGameLine(line)} ${opponent}`
      : `Live ${opponent}`;
  }
  const where = `${opponent}, ${formatShortDate(game.startTime)}`;
  return line
    ? `Last game: ${formatGameLine(line)} ${where}`
    : `Did not play ${where}`;
}
