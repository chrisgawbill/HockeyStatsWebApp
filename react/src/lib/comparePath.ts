/** The `/compare?players=` URL contract shared by the player comparison page and its entry points. */

export const MAX_COMPARE_PLAYERS = 3;

/**
 * Player ids from a `players=` value ("8478402,8477492"), in order: tokens that
 * are not positive whole numbers are dropped, repeats keep their first place,
 * and anything past MAX_COMPARE_PLAYERS is cut.
 */
export function parseComparePlayerIds(playersParam: string | null): number[] {
  const playerIds: number[] = [];
  for (const token of (playersParam ?? '').split(',')) {
    const trimmedToken = token.trim();
    if (!/^\d+$/.test(trimmedToken)) continue;
    const playerId = Number(trimmedToken);
    if (!Number.isSafeInteger(playerId) || playerId <= 0) continue;
    if (playerIds.includes(playerId)) continue;
    playerIds.push(playerId);
    if (playerIds.length === MAX_COMPARE_PLAYERS) break;
  }
  return playerIds;
}

/** The `players=` value for a list of player ids ("8478402,8477492"). */
export function formatComparePlayerIds(playerIds: number[]): string {
  return playerIds.slice(0, MAX_COMPARE_PLAYERS).join(',');
}

/** Route path comparing the given players (`/compare?players=…`). */
export function getComparePath(playerIds: number[]): string {
  return `/compare?players=${formatComparePlayerIds(playerIds)}`;
}
