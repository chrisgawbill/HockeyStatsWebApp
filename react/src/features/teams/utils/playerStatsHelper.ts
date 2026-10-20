import {
  GoalieStatLine,
  PlayerStatLine,
} from '@/features/teams/types/teamPageTypes';
import { TokenSlot } from '@/features/teams/utils/teamLinesHelper';

export interface StatCell {
  label: string;
  value: string;
}

export interface PlayerStatsLookup {
  skaters: Map<number, PlayerStatLine>;
  goalies: Map<number, GoalieStatLine>;
}

/** Indexes skater and goalie stat lines by player id. */
export function buildStatsLookup(
  players: PlayerStatLine[],
  goalies: GoalieStatLine[],
): PlayerStatsLookup {
  return {
    skaters: new Map(players.map((player) => [player.playerId, player])),
    goalies: new Map(goalies.map((goalie) => [goalie.goalieId, goalie])),
  };
}

const DASH = '—';

/** NHL style: three decimals, leading zero dropped (0.915 -> ".915"). */
export function formatSavePct(value: number | null): string {
  return value == null ? DASH : value.toFixed(3).replace(/^0\./, '.');
}

/** Goals-against average to two decimals, or a dash when missing. */
export function formatGaa(value: number | null): string {
  return value == null ? DASH : value.toFixed(2);
}

/** Plus/minus with an explicit + for positive values. */
export function formatPlusMinus(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** Roster `stat` is "18:22 TOI" (or ""); returns "18:22" or null. */
export function parseToiLabel(stat: string | undefined): string | null {
  const match = /^(\d+:\d{2})\s*TOI$/.exec((stat ?? '').trim());
  return match ? match[1] : null;
}

/**
 * Stat cells for one player, or null when no stat line exists (call-up, no
 * games played). Goalies are looked up by goalie id first when the token is
 * a goalie slot.
 */
export function buildPlayerStatCells(
  playerId: number,
  slot: TokenSlot,
  lookup: PlayerStatsLookup,
  toiStat?: string,
): StatCell[] | null {
  if (slot === 'G') {
    const goalie = lookup.goalies.get(playerId);
    if (!goalie) return null;
    return [
      { label: 'GP', value: String(goalie.gamesPlayed) },
      { label: 'W', value: String(goalie.wins) },
      { label: 'L', value: String(goalie.losses) },
      { label: 'SV%', value: formatSavePct(goalie.savePctg) },
      { label: 'GAA', value: formatGaa(goalie.goalsAgainstAverage) },
      { label: 'SO', value: String(goalie.shutouts) },
    ];
  }
  const skater = lookup.skaters.get(playerId);
  if (!skater) return null;
  const cells: StatCell[] = [
    { label: 'GP', value: String(skater.gamesPlayed) },
    { label: 'G', value: String(skater.goals) },
    { label: 'A', value: String(skater.assists) },
    { label: 'PTS', value: String(skater.points) },
    { label: '+/-', value: formatPlusMinus(skater.plusMinus) },
  ];
  const toi = parseToiLabel(toiStat);
  if (toi) cells.push({ label: 'TOI/GP', value: toi });
  return cells;
}

const SLOT_LABELS: Record<TokenSlot, string> = {
  LW: 'Left Wing',
  C: 'Center',
  RW: 'Right Wing',
  LD: 'Left Defense',
  RD: 'Right Defense',
  G: 'Goalie',
  F: 'Forward',
  D: 'Defense',
};

const POSITION_CODE_LABELS: Record<string, string> = {
  C: 'Center',
  L: 'Left Wing',
  R: 'Right Wing',
  D: 'Defense',
  G: 'Goalie',
};

/** Position text for the dialog; bench tokens (F/D) use the stat line's position code when known. */
export function getPositionLabel(
  slot: TokenSlot,
  lookup: PlayerStatsLookup,
  playerId: number,
): string {
  if (slot === 'F' || slot === 'D') {
    const code = lookup.skaters.get(playerId)?.position;
    if (code && POSITION_CODE_LABELS[code]) return POSITION_CODE_LABELS[code];
  }
  return SLOT_LABELS[slot];
}
