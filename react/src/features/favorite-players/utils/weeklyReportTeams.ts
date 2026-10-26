import type {
  WeeklyPlayerReport,
  WeeklyReportTeam,
  WeeklyReportTeamGame,
} from '@/features/favorite-players/types/favoritePlayers';
import { readFanTier, sortByFanTier } from '@/lib/favoriteCategory';
import { parseLocalDate } from '@/lib/dateFormat';
import { buildTeamForm, TeamForm } from '@/lib/teamForm';

/** The report's favorite teams, Diehard first; none on reports that predate teams. */
export function listReportTeams(
  report: WeeklyPlayerReport,
): WeeklyReportTeam[] {
  const teams = (report.teams ?? []).map((team) => ({
    ...team,
    tier: readFanTier(team.tier),
  }));
  return sortByFanTier(teams);
}

/** The team's Team Form as of the week's end, from its frozen games. */
export function buildReportTeamForm(team: WeeklyReportTeam): TeamForm {
  const formGames = team.formGames.map((game) => ({
    ...game,
    date: parseLocalDate(game.date),
  }));
  return buildTeamForm(formGames, team.triCode);
}

/** The week's record as wins-losses-OT losses, e.g. "2-0-1". */
export function formatWeekRecord(weekGames: WeeklyReportTeamGame[]): string {
  const countOutcome = (outcome: WeeklyReportTeamGame['outcome']) =>
    weekGames.filter((game) => game.outcome === outcome).length;
  return `${countOutcome('W')}-${countOutcome('L')}-${countOutcome('OTL')}`;
}

/** "vs DAL" at home, "@ DAL" on the road. */
export function formatOpponent(game: WeeklyReportTeamGame): string {
  return `${game.isHome ? 'vs' : '@'} ${game.opponent}`;
}

/** The team's score first, e.g. "4–2". */
export function formatTeamScore(game: WeeklyReportTeamGame): string {
  return `${game.teamScore}–${game.opponentScore}`;
}

/** A game day as "Tue, Oct 20". */
export function formatGameDay(date: string): string {
  return parseLocalDate(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
