import { formatTeamAndPosition } from '@/features/favorite-players/utils/playerCardFormat';
import type { ComparePlayer } from '@/features/player-compare/types/playerCompare';

/** "EDM · C" for a skater, "NYR · G" for a goalie; parts that are missing are left out. */
export function formatPlayerTeamLine(player: ComparePlayer): string {
  return formatTeamAndPosition({
    teamTriCode: player.teamTriCode,
    position: player.group === 'goalie' ? 'G' : player.position,
  });
}

/** The season line a search result shows: "41 P" for a skater, "15 W" for a goalie. */
export function formatSearchSeasonLine(player: ComparePlayer): string {
  return player.group === 'skater' ? `${player.points} P` : `${player.wins} W`;
}
