import {
  BoxscoreTeamStats,
  GameDetailBoxscore,
  GameDetailStatus,
  GameLanding,
  LandingScoringPeriod,
  PeriodScoreViewModel,
  TeamTotalsViewModel,
} from '@/features/game-detail/types/gameDetail';
import { formatLocalTime, formatLongDate } from '@/lib/dateFormat';
import { isCompletedGameState } from '@/lib/gameStatus';

/**
 * Anti-corruption layer for the game-detail feature. All raw NHL property
 * chaining/optional-chaining for the landing + boxscore payloads lives here.
 * Components must only receive the typed view models these functions return.
 */

/** Live games are polled no more often than this. */
export const LIVE_POLL_INTERVAL_MS = 60_000;

/**
 * Maps the raw NHL `gameState` string into the page's discriminated status.
 * FUT/PRE = preview, FINAL/OFF = final, everything else (LIVE, CRIT, etc.) = live.
 */
export function mapGameStateToStatus(
  gameState: string | undefined,
): GameDetailStatus {
  if (gameState === 'FUT' || gameState === 'PRE') return 'preview';
  if (gameState != null && isCompletedGameState(gameState)) return 'final';
  return 'live';
}

/** Compact status chip label shown in the hero (e.g. "Live · P2", "F/OT"). */
export function getStateLabel(
  boxscore: GameDetailBoxscore,
  status: GameDetailStatus,
): string {
  if (status === 'preview') return 'Scheduled';
  if (status === 'live')
    return `Live · P${boxscore.periodDescriptor?.number ?? ''}`;
  if (boxscore.gameOutcome?.lastPeriodType === 'OT') return 'F/OT';
  if (boxscore.gameOutcome?.lastPeriodType === 'SO') return 'F/SO';
  return 'FINAL';
}

/**
 * Formats an NHL "YYYY-MM-DD" calendar date as a local long-form date string.
 */
export function formatGameDate(gameDate: string): string {
  return formatLongDate(gameDate);
}

/**
 * Converts the game's UTC puck-drop timestamp into the viewer's local
 * "h:mm AM/PM" display string. Returns null when the timestamp is missing,
 * so preview UI can fall back to "TBD" instead of showing "Invalid Date".
 */
export function getLocalPuckDropTime(
  startTimeUTC: string | undefined,
): string | null {
  if (!startTimeUTC) return null;
  return formatLocalTime(startTimeUTC);
}

/** Per-period home/away goal counts, derived from the landing scoring feed. */
export function getPeriodScores(
  scoring: LandingScoringPeriod[],
  homeAbbrev: string,
  awayAbbrev: string,
): PeriodScoreViewModel[] {
  return scoring.map((period) => ({
    periodNum: period.periodDescriptor.number,
    periodType: period.periodDescriptor.periodType,
    homeGoals: period.goals.filter((g) => g.teamAbbrev.default === homeAbbrev)
      .length,
    awayGoals: period.goals.filter((g) => g.teamAbbrev.default === awayAbbrev)
      .length,
  }));
}

/** Aggregates a team's skater box-score rows into headline team totals. */
export function computeTeamTotals(
  teamStats: BoxscoreTeamStats,
  teamSog: number,
): TeamTotalsViewModel {
  const skaters = [...teamStats.forwards, ...teamStats.defense];
  return {
    sog: teamSog,
    hits: skaters.reduce((sum, p) => sum + p.hits, 0),
    blockedShots: skaters.reduce((sum, p) => sum + p.blockedShots, 0),
    pim: skaters.reduce((sum, p) => sum + p.pim, 0),
    powerPlayGoals: skaters.reduce((sum, p) => sum + p.powerPlayGoals, 0),
    giveaways: skaters.reduce((sum, p) => sum + p.giveaways, 0),
    takeaways: skaters.reduce((sum, p) => sum + p.takeaways, 0),
  };
}

/**
 * Section-level fallback guards. Historical/older games are sometimes missing
 * whole blocks of the landing/boxscore payload (no three stars, no scoring
 * summary, no per-player stats) — these let the page skip a section cleanly
 * instead of rendering it empty or throwing on missing nested fields.
 */
export function hasScoringSummary(landing: GameLanding | null): boolean {
  return landing?.summary?.scoring?.some((p) => p.goals.length > 0) ?? false;
}

export function hasThreeStars(landing: GameLanding | null): boolean {
  return (landing?.summary?.threeStars?.length ?? 0) > 0;
}

export function hasBoxscoreStats(boxscore: GameDetailBoxscore | null): boolean {
  return !!boxscore?.playerByGameStats;
}
