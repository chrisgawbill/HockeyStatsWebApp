/**
 * One season of league team stats, as Team DNA reads it. The teams feature's
 * `TeamStats` satisfies it, so lib/ needs no feature types.
 */
export interface TeamDnaSeasonStats {
  seasonId: number;
  wins: number;
  losses: number;
  otLosses: number;
  goalsPerGame: number;
  goalsAgainstPerGame: number;
  powerPlayPct: number;
  penaltyKillPct: number;
  shotsForPerGame: number;
  shotsAgainstPerGame: number;
  faceoffWinPct: number;
}

/** A club in the league set, as Team DNA reads it (the teams feature's `Team`). */
export interface TeamDnaLeagueTeam {
  id: number;
  teamName: string;
  seasonStats: TeamDnaSeasonStats[];
}

/**
 * The team's own summary (the team page's stats contract), used to name the
 * team and as the unranked fallback when the league set lacks it.
 */
export interface TeamDnaOwnStats {
  teamFullName: string;
  wins?: number;
  losses?: number;
  otLosses?: number;
  goalsForPerGame?: number;
  goalsAgainstPerGame?: number;
  powerPlayPct?: number;
  penaltyKillPct?: number;
  shotsForPerGame?: number;
  shotsAgainstPerGame?: number;
  faceoffWinPct?: number;
}

export type TeamDnaTier = 'elite' | 'above' | 'average' | 'below' | 'weak';

export interface TeamDnaRow {
  key: string;
  label: string;
  /** Short clarifier shown only where the label alone is ambiguous. */
  note?: string;
  value: string;
  /** Competition rank (1,2,2,4) among teams with data; null without league data. */
  rank: number | null;
  /** Number of teams ranked on this metric. */
  of: number | null;
  /** Bar fill, 4–100 (see `scalePosition`); null without league data. */
  fill: number | null;
  /** League-average tick position on the same 4–100 scale. */
  average: number | null;
  tier: TeamDnaTier | null;
}

export interface TeamDnaChip {
  label: string;
  kind: 'strength' | 'weakness' | 'neutral';
}

export interface TeamDnaProfile {
  rows: TeamDnaRow[];
  /** True when rows carry league ranks; false for the own-stats fallback. */
  ranked: boolean;
  /** Teams with season data in the league set (0 when unranked). */
  teamCount: number;
  gamesPlayed: number | null;
  chips: TeamDnaChip[];
  earlySample: boolean;
}

export interface TeamDnaInput {
  stats: TeamDnaOwnStats;
  league: TeamDnaLeagueTeam[];
  /** Season as used by the page, e.g. "20262027". */
  season: string;
  /** Page team id, used when the full-name match fails. */
  teamId?: number;
}

interface MetricDef {
  key: string;
  label: string;
  note?: string;
  higherIsBetter: boolean;
  read: (stats: TeamDnaSeasonStats) => number | null | undefined;
  readOwn: (stats: TeamDnaOwnStats) => number | null | undefined;
  format: (value: number) => string;
  strength: [elite: string, strong: string];
  weakness: string;
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const METRICS: MetricDef[] = [
  {
    key: 'offense',
    label: 'Offense',
    higherIsBetter: true,
    read: (stats) => stats.goalsPerGame,
    readOwn: (stats) => stats.goalsForPerGame,
    format: (value) => `${value.toFixed(2)} GF/GP`,
    strength: ['Elite offense', 'Strong offense'],
    weakness: 'Low scoring',
  },
  {
    key: 'defense',
    label: 'Defense',
    higherIsBetter: false,
    read: (stats) => stats.goalsAgainstPerGame,
    readOwn: (stats) => stats.goalsAgainstPerGame,
    format: (value) => `${value.toFixed(2)} GA/GP`,
    strength: ['Elite defense', 'Strong defense'],
    weakness: 'Leaky defense',
  },
  {
    key: 'power-play',
    label: 'Power Play',
    higherIsBetter: true,
    read: (stats) => stats.powerPlayPct,
    readOwn: (stats) => stats.powerPlayPct,
    format: pct,
    strength: ['Elite power play', 'Strong power play'],
    weakness: 'Struggling power play',
  },
  {
    key: 'penalty-kill',
    label: 'Penalty Kill',
    higherIsBetter: true,
    read: (stats) => stats.penaltyKillPct,
    readOwn: (stats) => stats.penaltyKillPct,
    format: pct,
    strength: ['Elite penalty kill', 'Strong penalty kill'],
    weakness: 'Weak penalty kill',
  },
  {
    key: 'shot-volume',
    label: 'Shot Volume',
    higherIsBetter: true,
    read: (stats) => stats.shotsForPerGame,
    readOwn: (stats) => stats.shotsForPerGame,
    format: (value) => `${value.toFixed(1)} shots/GP`,
    strength: ['Elite shot volume', 'High shot volume'],
    weakness: 'Low shot volume',
  },
  {
    key: 'shot-suppression',
    label: 'Shot Suppression',
    note: 'Shots allowed per game',
    higherIsBetter: false,
    read: (stats) => stats.shotsAgainstPerGame,
    readOwn: (stats) => stats.shotsAgainstPerGame,
    format: (value) => `${value.toFixed(1)} against/GP`,
    strength: ['Elite shot suppression', 'Limits shots'],
    weakness: 'Allows lots of shots',
  },
  {
    key: 'faceoffs',
    label: 'Faceoffs',
    higherIsBetter: true,
    read: (stats) => stats.faceoffWinPct,
    readOwn: (stats) => stats.faceoffWinPct,
    format: pct,
    strength: ['Elite faceoffs', 'Wins faceoffs'],
    weakness: 'Loses faceoffs',
  },
];

const MAX_CHIPS_PER_SIDE = 2;
const STRENGTH_MAX_RANK = 8;
const WEAKNESS_FROM_BOTTOM = 7;
const EARLY_SAMPLE_GAMES = 5;
const FILL_MIN = 4;

const TIER_TEXT: Record<TeamDnaTier, string> = {
  elite: 'elite',
  above: 'above league average',
  average: 'around league average',
  below: 'below league average',
  weak: 'well below league average',
};

/** Type guard for numbers that are present and finite. */
function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** "1st", "2nd", "3rd", "4th", "11th", "22nd"… */
export function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/**
 * Competition rank (1,2,2,4): one plus the number of values strictly better
 * than `value`. "Better" is lower when `higherIsBetter` is false.
 */
export function competitionRank(
  value: number,
  values: number[],
  higherIsBetter: boolean,
): number {
  return (
    1 +
    values.filter((other) => (higherIsBetter ? other > value : other < value))
      .length
  );
}

/**
 * Bar scale shared by the fill and the league-average tick. A value maps
 * linearly from the league's worst team (4%) to its best team (100%), where
 * "best" is the highest value for higher-is-better metrics and the lowest for
 * the rest. The floor keeps the worst team's bar visible. When every team is
 * identical the scale is degenerate and everything sits at 100%.
 */
export function scalePosition(
  value: number,
  values: number[],
  higherIsBetter: boolean,
): number {
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  const worst = higherIsBetter ? Math.min(...values) : Math.max(...values);
  if (best === worst) return 100;
  const ratio = (value - worst) / (best - worst);
  const clamped = Math.max(0, Math.min(1, ratio));
  return FILL_MIN + clamped * (100 - FILL_MIN);
}

/** Top 5 elite, top third above, bottom 5 weak, bottom third below. */
export function tierForRank(rank: number, of: number): TeamDnaTier {
  if (rank <= 5) return 'elite';
  if (rank > of - 5) return 'weak';
  if (rank <= of / 3) return 'above';
  if (rank > (of * 2) / 3) return 'below';
  return 'average';
}

/** Screen-reader sentence, e.g. "Power Play: 24.1%, 8th of 32, above league average". */
export function describeRow(row: TeamDnaRow): string {
  if (row.rank == null || row.of == null || row.tier == null) {
    return `${row.label}: ${row.value}`;
  }
  return `${row.label}: ${row.value}, ${ordinal(row.rank)} of ${row.of}, ${TIER_TEXT[row.tier]}`;
}

/** Picks up to two strength and two weakness labels from the ranked rows. */
function buildChips(rows: TeamDnaRow[]): TeamDnaChip[] {
  const defs = new Map(METRICS.map((metric) => [metric.key, metric]));
  const ranked = rows.filter(
    (row): row is TeamDnaRow & { rank: number; of: number } =>
      row.rank != null && row.of != null,
  );

  const strengths = ranked
    .filter((row) => row.rank <= STRENGTH_MAX_RANK)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_CHIPS_PER_SIDE);
  const weaknesses = ranked
    .filter(
      (row) =>
        row.rank >= row.of - WEAKNESS_FROM_BOTTOM &&
        !strengths.some((strength) => strength.key === row.key),
    )
    .sort((a, b) => b.rank - a.rank)
    .slice(0, MAX_CHIPS_PER_SIDE);

  const chips: TeamDnaChip[] = [
    ...strengths.map((row): TeamDnaChip => {
      const [elite, strong] = defs.get(row.key)!.strength;
      return { label: row.rank <= 5 ? elite : strong, kind: 'strength' };
    }),
    ...weaknesses.map((row): TeamDnaChip => ({
      label: defs.get(row.key)!.weakness,
      kind: 'weakness',
    })),
  ];
  return chips.length > 0
    ? chips
    : [{ label: 'Middle of the pack', kind: 'neutral' }];
}

/** Total games played from wins, losses, and OT losses. */
function gamesPlayedOf(stats: {
  wins?: number | null;
  losses?: number | null;
  otLosses?: number | null;
}): number | null {
  if (!finite(stats.wins) || !finite(stats.losses)) return null;
  return stats.wins + stats.losses + (stats.otLosses ?? 0);
}

/**
 * Builds the Team DNA profile: seven tendencies ranked against every team with
 * data for the selected season. Teams are matched by full name (as in
 * ConvertToListOfTeams), falling back to team id, and season stats by numeric
 * seasonId. If the league set is empty or lacks this team, rows fall back to
 * the team's own summary values without ranks, bars, or chips.
 */
export function buildTeamDna({
  stats,
  league,
  season,
  teamId,
}: TeamDnaInput): TeamDnaProfile {
  const seasonId = Number(season);
  const leagueRows = league
    .map((team) => ({
      team,
      stats: team.seasonStats.find(
        (seasonStats) => seasonStats.seasonId === seasonId,
      ),
    }))
    .filter(
      (
        entry,
      ): entry is { team: TeamDnaLeagueTeam; stats: TeamDnaSeasonStats } =>
        !!entry.stats,
    );
  const own =
    leagueRows.find(
      (entry) =>
        stats.teamFullName !== '' && entry.team.teamName === stats.teamFullName,
    ) ??
    (teamId != null
      ? leagueRows.find((entry) => entry.team.id === teamId)
      : undefined);

  if (!own) {
    const rows: TeamDnaRow[] = [];
    for (const metric of METRICS) {
      const value = metric.readOwn(stats);
      if (!finite(value)) continue;
      rows.push({
        key: metric.key,
        label: metric.label,
        note: metric.note,
        value: metric.format(value),
        rank: null,
        of: null,
        fill: null,
        average: null,
        tier: null,
      });
    }
    const gamesPlayed = gamesPlayedOf(stats);
    return {
      rows,
      ranked: false,
      teamCount: 0,
      gamesPlayed,
      chips: [],
      earlySample: gamesPlayed != null && gamesPlayed < EARLY_SAMPLE_GAMES,
    };
  }

  const rows: TeamDnaRow[] = [];
  for (const metric of METRICS) {
    const value = metric.read(own.stats);
    if (!finite(value)) continue;
    const values = leagueRows
      .map((entry) => metric.read(entry.stats))
      .filter(finite);
    const rank = competitionRank(value, values, metric.higherIsBetter);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    rows.push({
      key: metric.key,
      label: metric.label,
      note: metric.note,
      value: metric.format(value),
      rank,
      of: values.length,
      fill: scalePosition(value, values, metric.higherIsBetter),
      average: scalePosition(mean, values, metric.higherIsBetter),
      tier: tierForRank(rank, values.length),
    });
  }

  const gamesPlayed = gamesPlayedOf(own.stats);
  return {
    rows,
    ranked: true,
    teamCount: leagueRows.length,
    gamesPlayed,
    chips: rows.length > 0 ? buildChips(rows) : [],
    earlySample: gamesPlayed != null && gamesPlayed < EARLY_SAMPLE_GAMES,
  };
}
