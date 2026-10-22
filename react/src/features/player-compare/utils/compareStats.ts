import {
  formatGaa,
  formatMinutesSeconds,
  formatPlusMinus,
  formatSavePct,
  STAT_DASH,
} from '@/lib/statFormat';
import {
  findBestColumns,
  type BetterDirection,
} from '@/features/player-compare/utils/bestValue';
import type {
  CompareSlot,
  ComparePlayer,
  GoalieSeason,
  PlayerGroup,
  SkaterSeason,
} from '@/features/player-compare/types/playerCompare';

/** One stat row of the comparison table. */
interface CompareStat<Player> {
  /** Short column label, e.g. "PPG". */
  label: string;
  /** Full name for the label's tooltip and screen readers. */
  title: string;
  better: BetterDirection;
  /** The value rounded exactly as displayed, or null when it has none. */
  readValue: (player: Player) => number | null;
  formatValue: (value: number) => string;
}

/** Rounds to `decimals` places so equal displayed values compare equal. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const formatCount = (value: number) => String(value);

const SKATER_STATS: CompareStat<SkaterSeason>[] = [
  {
    label: 'GP',
    title: 'Games played',
    better: 'none',
    readValue: (skater) => skater.gamesPlayed,
    formatValue: formatCount,
  },
  {
    label: 'G',
    title: 'Goals',
    better: 'higher',
    readValue: (skater) => skater.goals,
    formatValue: formatCount,
  },
  {
    label: 'A',
    title: 'Assists',
    better: 'higher',
    readValue: (skater) => skater.assists,
    formatValue: formatCount,
  },
  {
    label: 'P',
    title: 'Points',
    better: 'higher',
    readValue: (skater) => skater.points,
    formatValue: formatCount,
  },
  {
    label: 'PPG',
    title: 'Points per game',
    better: 'higher',
    readValue: (skater) =>
      skater.gamesPlayed > 0
        ? roundTo(skater.points / skater.gamesPlayed, 2)
        : null,
    formatValue: (value) => value.toFixed(2),
  },
  {
    label: '+/-',
    title: 'Plus/minus',
    better: 'higher',
    readValue: (skater) => skater.plusMinus,
    formatValue: formatPlusMinus,
  },
  {
    label: 'SOG',
    title: 'Shots on goal',
    better: 'higher',
    readValue: (skater) => skater.shots,
    formatValue: formatCount,
  },
  {
    label: 'S%',
    title: 'Shooting percentage',
    better: 'higher',
    readValue: (skater) =>
      skater.shootingPct === null ? null : roundTo(skater.shootingPct * 100, 1),
    formatValue: (value) => value.toFixed(1),
  },
  {
    label: 'TOI/GP',
    title: 'Time on ice per game',
    better: 'higher',
    readValue: (skater) =>
      skater.toiPerGame === null ? null : Math.round(skater.toiPerGame),
    formatValue: formatMinutesSeconds,
  },
];

const GOALIE_STATS: CompareStat<GoalieSeason>[] = [
  {
    label: 'GP',
    title: 'Games played',
    better: 'none',
    readValue: (goalie) => goalie.gamesPlayed,
    formatValue: formatCount,
  },
  {
    label: 'W',
    title: 'Wins',
    better: 'higher',
    readValue: (goalie) => goalie.wins,
    formatValue: formatCount,
  },
  {
    label: 'GAA',
    title: 'Goals-against average',
    better: 'lower',
    readValue: (goalie) =>
      goalie.goalsAgainstAverage === null
        ? null
        : roundTo(goalie.goalsAgainstAverage, 2),
    formatValue: formatGaa,
  },
  {
    label: 'SV%',
    title: 'Save percentage',
    better: 'higher',
    readValue: (goalie) =>
      goalie.savePct === null ? null : roundTo(goalie.savePct, 3),
    formatValue: formatSavePct,
  },
  {
    label: 'SO',
    title: 'Shutouts',
    better: 'higher',
    readValue: (goalie) => goalie.shutouts,
    formatValue: formatCount,
  },
];

/** One row of the table: the stat and a cell per slot. */
export interface CompareRow {
  label: string;
  title: string;
  cells: { text: string; isBest: boolean }[];
}

/** A stat value as shown in its cell, or a dash when it has none. */
function formatStatValue<Player>(
  value: number | null,
  stat: CompareStat<Player>,
): string {
  return value === null ? STAT_DASH : stat.formatValue(value);
}

/** Rows for one group's stats; slots that are not a compared player read as missing. */
function buildRowsForStats<Player extends ComparePlayer>(
  stats: CompareStat<Player>[],
  slots: CompareSlot[],
  isInGroup: (player: ComparePlayer) => player is Player,
): CompareRow[] {
  return stats.map((stat) => {
    const values = slots.map((slot) =>
      slot.kind === 'player' && isInGroup(slot.player)
        ? stat.readValue(slot.player)
        : null,
    );
    const bestColumns = findBestColumns(values, stat.better);
    return {
      label: stat.label,
      title: stat.title,
      cells: values.map((value, column) => ({
        text: formatStatValue(value, stat),
        isBest: bestColumns[column],
      })),
    };
  });
}

const isSkater = (player: ComparePlayer): player is SkaterSeason =>
  player.group === 'skater';
const isGoalie = (player: ComparePlayer): player is GoalieSeason =>
  player.group === 'goalie';

/** The comparison table's rows for a group, with each row's best cells marked. */
export function buildCompareRows(
  group: PlayerGroup,
  slots: CompareSlot[],
): CompareRow[] {
  return group === 'skater'
    ? buildRowsForStats(SKATER_STATS, slots, isSkater)
    : buildRowsForStats(GOALIE_STATS, slots, isGoalie);
}

/** Plural noun for a group, e.g. "skaters". */
export function getGroupNoun(group: PlayerGroup): string {
  return group === 'skater' ? 'skaters' : 'goalies';
}
