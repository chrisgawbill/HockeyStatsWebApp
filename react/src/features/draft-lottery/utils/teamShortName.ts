const MULTI_WORD_NICKNAMES = [
  'Blue Jackets',
  'Golden Knights',
  'Maple Leafs',
  'Red Wings',
  'Hockey Club',
];

/**
 * Common team name without the city ("Los Angeles Kings" -> "Kings").
 * Falls back to the full name when it cannot be derived (single word).
 */
export function getTeamShortName(fullName: string): string {
  const name = fullName.trim();
  const nickname = MULTI_WORD_NICKNAMES.find((n) => name.endsWith(` ${n}`));
  if (nickname) return nickname;
  const words = name.split(/\s+/);
  return words.length > 1 ? words[words.length - 1] : name;
}
