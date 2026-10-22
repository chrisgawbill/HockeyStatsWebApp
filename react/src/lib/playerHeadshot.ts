/** NHL headshot ("mug") URLs shared by the player lists. */

/** The NHL's generic silhouette, shown when a player's photo is missing. */
export const DEFAULT_HEADSHOT_URL =
  'https://assets.nhle.com/mugs/nhl/skater/default.png';

/** The NHL headshot for a player in one season with one team. */
export function getSeasonHeadshotUrl(
  seasonId: string,
  teamTriCode: string,
  playerId: number,
): string {
  return `https://assets.nhle.com/mugs/nhl/${seasonId}/${teamTriCode}/${playerId}.png`;
}
