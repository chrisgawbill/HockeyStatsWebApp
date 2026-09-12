import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import {
  GoalieStatLine,
  GoalieSummaryContract,
  PlayerStatLine,
  Position,
  PositionGroup,
  POSITION_GROUPS,
  RosterPlayer,
  RosterPlayerContract,
  SkaterCorsiEntry,
  SkaterSummaryContract,
  SortDirection,
  StatItem,
  TeamOverview,
  TeamStatsContract,
  TeamTab,
  TEAM_TABS,
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
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')} TOI`;
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
  const result = buildEmptyRoster();
  for (const p of players ?? []) {
    const pos = POS_MAP[p.position] as Position;
    if (!pos) continue;
    const toi = toiMap.get(p.id);
    const stat = toi != null ? formatToi(toi) : '';
    result[pos].push({
      id: p.id,
      name: p.name,
      number: p.number ?? 0,
      stat,
      headshot: p.headshot ?? '',
    });
  }
  for (const pos of Object.keys(result) as Position[]) {
    result[pos].sort((a, b) => {
      const aToi = toiMap.get(a.id) ?? 0;
      const bToi = toiMap.get(b.id) ?? 0;
      return bToi - aToi;
    });
  }
  return result;
}

/**
 * Collapses the 5-bucket roster (Center/Left Wing/Right Wing/Defenseman/Goalie)
 * into the 3 coarse groups the Roster tab renders — built on top of the same
 * position mapping `transformRoster` already produces, not a parallel parser.
 */
export function groupRosterByPositionGroup(
  roster: Record<Position, RosterPlayer[]>,
): Record<PositionGroup, RosterPlayer[]> {
  const result = {} as Record<PositionGroup, RosterPlayer[]>;
  for (const group of POSITION_GROUPS) {
    result[group] = POSITIONS_BY_GROUP[group].flatMap((pos) => roster[pos]);
  }
  return result;
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
  for (const p of corsiData?.data ?? []) {
    if (p.playerId != null && p.satPercentage != null)
      corsiMap.set(p.playerId, p.satPercentage);
  }
  return (summary ?? []).map(
    (p): PlayerStatLine => ({
      playerId: p.playerId,
      name: p.name ?? '',
      position: p.position ?? '',
      gamesPlayed: p.gamesPlayed ?? 0,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      points: p.points ?? 0,
      plusMinus: p.plusMinus ?? 0,
      penaltyMinutes: p.penaltyMinutes ?? 0,
      faceoffWinPct: p.faceoffWinPct ?? null,
      corsiPct: corsiMap.get(p.playerId) ?? null,
    }),
  );
}

/** Shapes the normalized goalie summary contract into the Goalies tab's view model. */
export function transformGoalieStats(
  summary: GoalieSummaryContract[] | null,
): GoalieStatLine[] {
  return (summary ?? []).map(
    (g): GoalieStatLine => ({
      goalieId: g.goalieId,
      name: g.name ?? '',
      gamesPlayed: g.gamesPlayed ?? 0,
      wins: g.wins ?? 0,
      losses: g.losses ?? 0,
      savePctg: g.savePctg ?? null,
      goalsAgainstAverage: g.goalsAgainstAverage ?? null,
      shutouts: g.shutouts ?? 0,
    }),
  );
}

/**
 * Shapes the raw NHL team summary into the labeled stat tiles the header strip
 * renders, formatting rates/percentages and falling back to "—" when absent.
 */
export function transformTeamStats(raw: TeamStatsContract): StatItem[] {
  return [
    { label: 'Goals For / GP', value: raw.goalsForPerGame?.toFixed(2) ?? '—' },
    {
      label: 'Goals Against / GP',
      value: raw.goalsAgainstPerGame?.toFixed(2) ?? '—',
    },
    {
      label: 'Power Play %',
      value:
        raw.powerPlayPct != null
          ? `${(raw.powerPlayPct * 100).toFixed(1)}%`
          : '—',
    },
    {
      label: 'Penalty Kill %',
      value:
        raw.penaltyKillPct != null
          ? `${(raw.penaltyKillPct * 100).toFixed(1)}%`
          : '—',
    },
    { label: 'Shots / GP', value: raw.shotsForPerGame?.toFixed(1) ?? '—' },
  ];
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
  const s = allStandings.find((t) => t.id === triCode);
  const conferenceStandings =
    s?.conferenceName === 'Eastern'
      ? easternStandingsData
      : westernStandingsData;
  const playoffCutoff = conferenceStandings.find(
    (t) => t.conferenceStandingsPlace === 8,
  );
  const teamPoints = s?.points ?? raw?.points ?? 0;
  const playoffLineDelta = playoffCutoff
    ? teamPoints - playoffCutoff.points
    : 0;
  return {
    name: raw?.name,
    triCode,
    wins: s?.wins ?? raw?.wins ?? 0,
    losses: s?.losses ?? raw?.losses ?? 0,
    otLosses: s?.otLosses ?? raw?.otLosses ?? 0,
    points: teamPoints,
    divisionRank: s?.divisionStandingsPlace ?? 0,
    division: s?.divisionName ?? '',
    conference: s?.conferenceName ?? '',
    conferenceRank: s?.conferenceStandingsPlace ?? 0,
    playoffLineDelta,
    founded: 0,
    arena: '—',
    stanleyCups: 0,
    conferenceChampionships: 0,
    hallOfFamers: 0,
  };
}

const VALID_TEAM_TABS = new Set(TEAM_TABS.map((t) => t.key));

/** Resolves the `?tab=` param into a known tab, defaulting to `overview`. */
export function parseTeamTab(value: string | null): TeamTab {
  return value != null && VALID_TEAM_TABS.has(value as TeamTab)
    ? (value as TeamTab)
    : 'overview';
}

/**
 * Generic, stable sort over a flat list of rows by one of their keys. Shared
 * by the Skaters and Goalies tabs so there's a single sort implementation
 * rather than two near-identical copies. Nulls always sort last regardless
 * of direction.
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
