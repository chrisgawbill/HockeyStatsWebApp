/** Returns up to two uppercase initials for a headshot placeholder ("Connor McDavid" -> "CM"). */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();
}

/** Returns "TEAM · POS" for a player card, leaving out whichever part is missing. */
export function formatTeamAndPosition(player: {
  teamTriCode: string | null;
  position: string | null;
}): string {
  return [player.teamTriCode, player.position].filter(Boolean).join(' · ');
}
