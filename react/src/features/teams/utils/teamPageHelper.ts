import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import {
  GoalieStatLine,
  GoalieSummaryContract,
  PlayerStatLine,
  Position,
  PositionGroup,
  POSITION_GROUPS,
  RosterLine,
  RosterPlayer,
  RosterPlayerContract,
  SkaterCorsiEntry,
  SkaterSummaryContract,
  SortDirection,
  TeamOverview,
  TeamStatsContract,
  TeamSection,
  TEAM_SECTIONS,
} from '@/features/teams/types/teamPageTypes';

/**
 * Pure transformation + derivation helpers for TeamPage. Nothing here touches
 * React state or fires network requests — components own the effects/state
 * and call into this module to turn raw/normalized API responses into the
 * typed view models the tabs render.
 */

/** Maps NHL roster position codes into the display buckets used by the roster UI. */
const POS_MAP: Record<string, Position> = {
  C: 'Center',
  L: 'Left Wing',
  R: 'Right Wing',
  D: 'Defenseman',
  G: 'Goalie',
};

/** The `Position` buckets that collapse into each coarse roster tab group. */
const POSITIONS_BY_GROUP: Record<PositionGroup, Position[]> = {
  Forwards: ['Center', 'Left Wing', 'Right Wing'],
  Defense: ['Defenseman'],
  Goalies: ['Goalie'],
};

/** Builds an empty roster bucket map for component state and roster transforms. */
export function buildEmptyRoster(): Record<Position, RosterPlayer[]> {
  return {
    Center: [],
    'Left Wing': [],
    'Right Wing': [],
    Defenseman: [],
    Goalie: [],
  };
}

/** Formats a per-game time-on-ice value in seconds into the roster stat label. */
function formatToi(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} TOI`;
}

/**
 * Groups roster players by display position and sorts each group by time on ice
 * (most-used first), looking up TOI per player from `toiMap`. Players whose
 * position code isn't in POS_MAP are skipped. Returns the grouped roster.
 */
export function transformRoster(
  players: RosterPlayerContract[],
  toiMap: Map<number, number>,
): Record<Position, RosterPlayer[]> {
  const roster = buildEmptyRoster();
  for (const player of players ?? []) {
    const position = POS_MAP[player.position] as Position;
    if (!position) continue;
    const toi = toiMap.get(player.id);
    const stat = toi != null ? formatToi(toi) : '';
    roster[position].push({
      id: player.id,
      name: player.name,
      number: player.number ?? 0,
      stat,
      headshot: player.headshot ?? '',
    });
  }
  for (const position of Object.keys(roster) as Position[]) {
    roster[position].sort((a, b) => {
      const aToi = toiMap.get(a.id) ?? 0;
      const bToi = toiMap.get(b.id) ?? 0;
      return bToi - aToi;
    });
  }
  return roster;
}

/**
 * Collapses the 5-bucket roster (Center/Left Wing/Right Wing/Defenseman/Goalie)
 * into the 3 coarse groups the Roster tab renders — built on top of the same
 * position mapping `transformRoster` already produces, not a parallel parser.
 */
export function groupRosterByPositionGroup(
  roster: Record<Position, RosterPlayer[]>,
): Record<PositionGroup, RosterPlayer[]> {
  const grouped = {} as Record<PositionGroup, RosterPlayer[]>;
  for (const group of POSITION_GROUPS) {
    grouped[group] = POSITIONS_BY_GROUP[group].flatMap(
      (position) => roster[position],
    );
  }
  return grouped;
}

/**
 * Zips several already TOI-sorted position arrays together by index, one
 * player per array per group, skipping any position that's run out at that
 * index. Groups within `labeledCount` get "<labelPrefix> N"; anything past
 * that gets an empty label (overflow, rendered unlabeled by the caller
 * rather than implying a fake numbered line/pair).
 */
function zipIntoLines(
  positionArrays: RosterPlayer[][],
  labelPrefix: string,
  labeledCount: number,
): RosterLine[] {
  const maxLen = Math.max(...positionArrays.map((arr) => arr.length), 0);
  const lines: RosterLine[] = [];
  for (let i = 0; i < maxLen; i++) {
    const players = positionArrays
      .map((arr) => arr[i])
      .filter((player): player is RosterPlayer => player != null);
    if (players.length === 0) continue;
    lines.push({
      label: i < labeledCount ? `${labelPrefix} ${i + 1}` : '',
      players,
    });
  }
  return lines;
}

/**
 * Builds forward "lines" by zipping the TOI-sorted Center/Left Wing/Right
 * Wing arrays index-by-index — index 0 of each is that position's most-used
 * player, so line 1 is the highest-ice-time trio, and so on. This isn't real
 * coach-assigned line data (unavailable from the NHL stats API); it's an
 * ice-time-based approximation, which is why only the first 4 trios get a
 * numbered "Line N" label and the rest render unlabeled.
 */
export function buildForwardLines(
  roster: Record<Position, RosterPlayer[]>,
): RosterLine[] {
  // LW-C-RW: the conventional left-to-right order a line is drawn/announced in.
  return zipIntoLines(
    [roster['Left Wing'], roster.Center, roster['Right Wing']],
    'Line',
    4,
  );
}

/** Same idea as {@link buildForwardLines}, pairing the TOI-sorted Defenseman array two at a time. */
export function buildDefensePairs(
  roster: Record<Position, RosterPlayer[]>,
): RosterLine[] {
  const defense = roster.Defenseman;
  const pairs: RosterLine[] = [];
  for (let i = 0; i < defense.length; i += 2) {
    const pairIndex = i / 2;
    pairs.push({
      label: pairIndex < 3 ? `Pair ${pairIndex + 1}` : '',
      players: defense.slice(i, i + 2),
    });
  }
  return pairs;
}

/**
 * Builds the per-player stat lines for the skaters table from the skater
 * summary, merging in Corsi (SAT%) by playerId since it comes from a separate
 * endpoint. Missing values default to 0/null; a null faceoff percentage means
 * the player did not take faceoffs.
 */
export function transformPlayerStats(
  summary: SkaterSummaryContract[],
  corsiData: { data?: SkaterCorsiEntry[] } | null,
): PlayerStatLine[] {
  const corsiMap = new Map<number, number>();
  for (const entry of corsiData?.data ?? []) {
    if (entry.playerId != null && entry.satPercentage != null)
      corsiMap.set(entry.playerId, entry.satPercentage);
  }
  return (summary ?? []).map((skater): PlayerStatLine => ({
    playerId: skater.playerId,
    name: skater.name ?? '',
    position: skater.position ?? '',
    gamesPlayed: skater.gamesPlayed ?? 0,
    goals: skater.goals ?? 0,
    assists: skater.assists ?? 0,
    points: skater.points ?? 0,
    plusMinus: skater.plusMinus ?? 0,
    penaltyMinutes: skater.penaltyMinutes ?? 0,
    faceoffWinPct: skater.faceoffWinPct ?? null,
    corsiPct: corsiMap.get(skater.playerId) ?? null,
  }));
}

/** Shapes the normalized goalie summary contract into the Goalies tab's view model. */
export function transformGoalieStats(
  summary: GoalieSummaryContract[] | null,
): GoalieStatLine[] {
  return (summary ?? []).map((goalie): GoalieStatLine => ({
    goalieId: goalie.goalieId,
    name: goalie.name ?? '',
    gamesPlayed: goalie.gamesPlayed ?? 0,
    wins: goalie.wins ?? 0,
    losses: goalie.losses ?? 0,
    savePctg: goalie.savePctg ?? null,
    goalsAgainstAverage: goalie.goalsAgainstAverage ?? null,
    shutouts: goalie.shutouts ?? 0,
  }));
}

/**
 * Derives the team overview card from the team summary response plus the live
 * standings-context projections (rank, playoff-line delta). Called from a
 * render-time `useMemo` in TeamPage so a deep link with `?season=` doesn't
 * race the standings fetch.
 */
export function buildTeamOverview(
  raw: TeamStatsContract,
  triCode: string,
  easternStandingsData: StandingsTeam[],
  westernStandingsData: StandingsTeam[],
): TeamOverview {
  const allStandings = [...easternStandingsData, ...westernStandingsData];
  const teamStandings = allStandings.find((team) => team.id === triCode);
  const conferenceStandings =
    teamStandings?.conferenceName === 'Eastern'
      ? easternStandingsData
      : westernStandingsData;
  const playoffCutoff = conferenceStandings.find(
    (team) => team.conferenceStandingsPlace === 8,
  );
  const teamPoints = teamStandings?.points ?? raw?.points ?? 0;
  const playoffLineDelta = playoffCutoff
    ? teamPoints - playoffCutoff.points
    : 0;
  return {
    name: raw?.teamFullName ?? '',
    triCode,
    wins: teamStandings?.wins ?? raw?.wins ?? 0,
    losses: teamStandings?.losses ?? raw?.losses ?? 0,
    otLosses: teamStandings?.otLosses ?? raw?.otLosses ?? 0,
    points: teamPoints,
    divisionRank: teamStandings?.divisionStandingsPlace ?? 0,
    division: teamStandings?.divisionName ?? '',
    conference: teamStandings?.conferenceName ?? '',
    conferenceRank: teamStandings?.conferenceStandingsPlace ?? 0,
    playoffLineDelta,
    founded: 0,
    arena: '—',
    stanleyCups: 0,
    conferenceChampionships: 0,
    hallOfFamers: 0,
  };
}

const VALID_TEAM_SECTIONS = new Set<string>(
  TEAM_SECTIONS.map((section) => section.key),
);

/** True when `value` is the key of one of the team page's anchor sections. */
export function isTeamSection(value: string): value is TeamSection {
  return VALID_TEAM_SECTIONS.has(value);
}

/**
 * Maps a legacy `?tab=` value (from previously shared links) onto the
 * matching anchor section, for backward compatibility. `overview` — the old
 * tab that has since been dissolved into top-level sections — resolves to
 * its first section, `stats`. Returns null for anything unrecognized.
 */
export function resolveLegacyTeamTab(value: string | null): TeamSection | null {
  if (value == null) return null;
  if (value === 'overview') return 'stats';
  return isTeamSection(value) ? value : null;
}

/**
 * Generic, stable sort over a flat list of rows by one of their keys. Nulls
 * always sort last regardless of direction.
 */
export function sortByKey<T>(
  rows: T[],
  key: keyof T,
  direction: SortDirection,
): T[] {
  return [...rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    const aNum = aVal as unknown as number;
    const bNum = bVal as unknown as number;
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  });
}
