import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { Team } from '@/features/teams/types/team';
import { TeamStats } from '@/features/teams/types/teamStats';
import { getTeamList } from '@/lib/teamListData';
import { League } from '@/features/league/utils/leagueHelper';

export type TeamFilter = 'all' | 'playoff' | 'lottery';
export type TeamSort = 'name' | 'points' | 'winPct' | 'goals' | 'draftOdds';

/** A team joined with its latest-season stats and current standings row. */
export interface TeamCardData {
  team: Team;
  stats: TeamStats | null;
  standings?: StandingsTeam;
  triCode: string;
}

export interface TeamListCriteria {
  search: string;
  conference: string;
  division: string;
  filter: TeamFilter;
  sortBy: TeamSort;
}

/** Lowercases a name and strips accents so "Montréal" matches "Montreal". */
function normalizeKey(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** The team's most recent season stats, or null if it has none. */
function getCurrentStats(team: Team): TeamStats | null {
  if (!team.seasonStats || team.seasonStats.length === 0) return null;
  return team.seasonStats.reduce((latest, stat) =>
    !latest || stat.seasonId > latest.seasonId ? stat : latest,
  );
}

/** Wins as a share of games played (0 when no games have been played). */
export function getWinPct(stats: TeamStats | null) {
  if (!stats) return 0;
  const gamesPlayed = stats.wins + stats.losses + stats.otLosses;
  return gamesPlayed > 0 ? stats.wins / gamesPlayed : 0;
}

/** Fixed-decimal text for a stat, or a dash when it is missing or not finite. */
export function formatNumber(value: number | undefined, digits: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

/** The conference-seed or lottery-odds badge a card shows under the active filter. */
export function getStatusLabel(team: TeamCardData, filter: TeamFilter) {
  if (filter === 'playoff' && team.standings?.conferenceStandingsPlace) {
    return `#${team.standings.conferenceStandingsPlace} ${team.standings.conferenceName}`;
  }

  if (filter === 'lottery' && (team.standings?.draftLotteryOdds ?? 0) > 0) {
    return `${team.standings?.draftLotteryOdds}% Lottery`;
  }

  return null;
}

/**
 * Indexes standings rows by tri-code, team name, and accent-stripped name, so
 * a team can be matched whichever spelling the team list uses.
 */
export function buildStandingsLookup(
  standings: StandingsTeam[],
): Map<string, StandingsTeam> {
  const standingsByKey = new Map<string, StandingsTeam>();
  for (const team of standings) {
    standingsByKey.set(team.id, team);
    standingsByKey.set(team.teamName, team);
    standingsByKey.set(normalizeKey(team.teamName), team);
  }
  return standingsByKey;
}

/** Joins each team with its stats and standings, then filters and sorts the cards. */
export function buildTeamCards(
  teams: Team[],
  standingsByKey: Map<string, StandingsTeam>,
  { search, conference, division, filter, sortBy }: TeamListCriteria,
  league: League = 'nhl',
): TeamCardData[] {
  const normalizedSearch = search.trim().toLowerCase();
  const triCodeByTeamName: Record<string, string> = Object.fromEntries(
    getTeamList(league).map((team) => [team.fullName, team.triCode]),
  );

  return teams
    .map((team: Team) => {
      const triCode = triCodeByTeamName[team.teamName] ?? '';
      const standings =
        standingsByKey.get(triCode) ??
        standingsByKey.get(team.teamName) ??
        standingsByKey.get(normalizeKey(team.teamName));
      return {
        team,
        standings,
        stats: getCurrentStats(team),
        triCode,
      };
    })
    .filter(({ team, standings, triCode }: TeamCardData) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        team.teamName.toLowerCase().includes(normalizedSearch) ||
        triCode.toLowerCase().includes(normalizedSearch);
      const matchesConference =
        conference === 'All' || standings?.conferenceName === conference;
      const matchesDivision =
        division === 'All' || standings?.divisionName === division;
      const isLottery = (standings?.draftLotteryOdds ?? 0) > 0;
      const isPlayoff =
        standings?.conferenceStandingsPlace != null &&
        standings.conferenceStandingsPlace <= 8;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'playoff' && isPlayoff) ||
        (filter === 'lottery' && isLottery);

      return (
        matchesSearch && matchesConference && matchesDivision && matchesFilter
      );
    })
    .sort((first: TeamCardData, second: TeamCardData) => {
      if (sortBy === 'points')
        return (second.stats?.points ?? 0) - (first.stats?.points ?? 0);
      if (sortBy === 'winPct')
        return getWinPct(second.stats) - getWinPct(first.stats);
      if (sortBy === 'goals') {
        return (
          (second.stats?.goalsPerGame ?? 0) - (first.stats?.goalsPerGame ?? 0)
        );
      }
      if (sortBy === 'draftOdds') {
        return (
          (second.standings?.draftLotteryOdds ?? 0) -
          (first.standings?.draftLotteryOdds ?? 0)
        );
      }
      return first.team.teamName.localeCompare(second.team.teamName);
    });
}
