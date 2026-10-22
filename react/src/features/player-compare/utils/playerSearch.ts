import type { ComparePlayer } from '@/features/player-compare/types/playerCompare';

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_RESULTS = 8;

/** Lower-cased with accents removed, so "stutzle" finds "Stützle". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Name words, splitting on spaces, hyphens and apostrophes ("O'Reilly" -> "o", "reilly", "o'reilly"). */
function getNameWords(normalizedName: string): string[] {
  const spaceWords = normalizedName.split(/\s+/);
  const partWords = spaceWords.flatMap((word) => word.split(/[-']/));
  return [...new Set([...spaceWords, ...partWords])].filter(Boolean);
}

/**
 * How well a name matches the query: 2 when the last name starts with it,
 * 1 when every query word starts some name word, 0 for no match.
 */
function scoreNameMatch(name: string, normalizedQuery: string): number {
  const normalizedName = normalizeForSearch(name);
  const nameWords = getNameWords(normalizedName);
  const lastName = normalizedName.split(/\s+/).slice(1).join(' ');
  if (lastName.startsWith(normalizedQuery)) return 2;
  const queryWords = normalizedQuery.split(/\s+/);
  const everyWordMatches = queryWords.every((queryWord) =>
    nameWords.some((nameWord) => nameWord.startsWith(queryWord)),
  );
  return everyWordMatches ? 1 : 0;
}

/**
 * Players whose name matches the query (from MIN_SEARCH_LENGTH letters):
 * last-name matches first, then by games played, then by name. Players in
 * `excludedIds` (already compared) are left out.
 */
export function searchPlayers<Player extends ComparePlayer>(
  players: Player[],
  query: string,
  excludedIds: number[],
): Player[] {
  const normalizedQuery = normalizeForSearch(query);
  if (normalizedQuery.length < MIN_SEARCH_LENGTH) return [];

  return players
    .filter((player) => !excludedIds.includes(player.playerId))
    .map((player) => ({
      player,
      score: scoreNameMatch(player.name, normalizedQuery),
    }))
    .filter((match) => match.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.player.gamesPlayed - first.player.gamesPlayed ||
        first.player.name.localeCompare(second.player.name),
    )
    .slice(0, MAX_SEARCH_RESULTS)
    .map((match) => match.player);
}
