import type {
  CompareSlot,
  PlayerGroup,
  SeasonPlayerPool,
} from '@/features/player-compare/types/playerCompare';

/**
 * Columns for the ids in the URL, in order. The first id found in the season
 * sets the group (skaters or goalies); a player from the other group gets an
 * `otherGroup` slot and an id with no season line an `unknown` slot, so one
 * bad id never hides the rest. `group` is null when no id was found.
 */
export function buildCompareSlots(
  playerIds: number[],
  pool: SeasonPlayerPool,
): { group: PlayerGroup | null; slots: CompareSlot[] } {
  const firstFoundPlayer = playerIds
    .map((playerId) => pool.byId.get(playerId))
    .find((player) => player !== undefined);
  const group = firstFoundPlayer?.group ?? null;

  const slots = playerIds.map((playerId): CompareSlot => {
    const player = pool.byId.get(playerId);
    if (!player) return { kind: 'unknown', playerId };
    if (player.group !== group) return { kind: 'otherGroup', player };
    return { kind: 'player', player };
  });
  return { group, slots };
}
