import type {
  GoalieWeekStats,
  SkaterWeekStats,
  WeeklyPlayerReport,
  WeeklyReportPlayer,
} from '@/features/favorite-players/types/favoritePlayers';

/** Most favorite players a user may have (enforced by the API with a 409). */
export const MAX_FAVORITE_PLAYERS = 10;

export function formatPlusMinus(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** .938 -> ".938"; 1 -> "1.000". */
export function formatSavePct(value: number | null): string {
  if (value === null) return '—';
  const fixed = value.toFixed(3);
  return fixed.startsWith('0') ? fixed.slice(1) : fixed;
}

/** Stat chips for a skater's week, in the approved order. */
export function skaterStatItems(stats: SkaterWeekStats): string[] {
  return [
    `${stats.gp} GP`,
    `${stats.goals} G`,
    `${stats.assists} A`,
    `${stats.points} PTS`,
    `${formatPlusMinus(stats.plusMinus)} +/-`,
    `${stats.shots} SOG`,
    `${stats.toiPerGame ?? '—'} TOI/GP`,
  ];
}

/** Stat chips for a goalie's week, in the approved order. */
export function goalieStatItems(stats: GoalieWeekStats): string[] {
  return [
    `${stats.gp} GP`,
    stats.record,
    `${formatSavePct(stats.savePct)} SV%`,
    `${stats.gaa === null ? '—' : stats.gaa.toFixed(2)} GAA`,
    `${stats.shutouts} SO`,
  ];
}

export function playerStatItems(player: WeeklyReportPlayer): string[] {
  if (!player.stats) return [];
  return player.type === 'goalie'
    ? goalieStatItems(player.stats)
    : skaterStatItems(player.stats);
}

/** "Did not play (team played 3 games)". */
export function didNotPlayText(player: WeeklyReportPlayer): string {
  if (player.teamGames <= 0) return 'Did not play (team did not play)';
  return `Did not play (team played ${player.teamGames} ${
    player.teamGames === 1 ? 'game' : 'games'
  })`;
}

/** "EDM", or "CGY → EDM" after a mid-week trade. */
export function teamsLabel(player: WeeklyReportPlayer): string {
  if (player.teams.length > 1) return player.teams.join(' → ');
  return player.teams[0] ?? player.team ?? '';
}

export function weeklyReportTitle(report: Pick<WeeklyPlayerReport, 'label'>) {
  return `Weekly Player Report · ${report.label}`;
}

/** True for a real YYYY-MM-DD Monday (the route parameter). */
export function isWeekStart(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date.getUTCDay() === 1
  );
}
