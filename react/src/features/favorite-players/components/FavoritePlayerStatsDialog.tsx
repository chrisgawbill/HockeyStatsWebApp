import PlayerStatsDialog from '@/features/teams/components/PlayerStatsDialog';
import { useFavoritePlayerStats } from '@/features/favorite-players/hooks/useFavoritePlayerStats';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import {
  getContrastTextColor,
  getTeamPrimaryColor,
  toDarkModeAccentColor,
} from '@/lib/teamColor';
import {
  formatTeamAndPosition,
  getInitials,
} from '@/features/favorite-players/utils/playerCardFormat';
import { useTheme } from '@/lib/ThemeContext';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';

export interface FavoritePlayerStatsDialogProps {
  player: FavoritePlayer;
  onClose: () => void;
}

/**
 * Shows a favorite player's stats for the selected season, tinted with their
 * team's color, using the same dialog as the team page roster.
 */
export default function FavoritePlayerStatsDialog({
  player,
  onClose,
}: FavoritePlayerStatsDialogProps) {
  const { season } = useSeason();
  const { theme } = useTheme();
  const statsLoad = useFavoritePlayerStats(player, season);
  const primaryColor = getTeamPrimaryColor(player.teamTriCode ?? undefined);
  const teamColor =
    theme === 'dark' ? toDarkModeAccentColor(primaryColor) : primaryColor;
  const statusMessage = {
    loading: 'Loading stats…',
    failed: "Couldn't load stats. Try again in a moment.",
    loaded: undefined,
  }[statsLoad.status];

  return (
    <PlayerStatsDialog
      playerId={player.playerId}
      playerName={player.name}
      headshot={player.headshot}
      detail={formatTeamAndPosition(player)}
      headshotFallback={getInitials(player.name)}
      statCells={statsLoad.status === 'loaded' ? statsLoad.statCells : null}
      statusMessage={statusMessage}
      teamColor={teamColor}
      teamInk={getContrastTextColor(teamColor)}
      onClose={onClose}
    />
  );
}
