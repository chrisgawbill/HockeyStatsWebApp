import { useState, type ReactNode } from 'react';
import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import FavoritePlayerStatsDialog from '@/features/favorite-players/components/FavoritePlayerStatsDialog';
import FavoriteCard from '@/components/FavoriteCard';
import FavoriteRowSection from '@/components/FavoriteRowSection';
import {
  formatTeamAndPosition,
  getInitials,
} from '@/features/favorite-players/utils/playerCardFormat';
import { MAX_FAVORITE_PLAYERS } from '@/features/favorite-players/utils/weeklyReportFormat';
import { sortByFanTier } from '@/lib/favoriteCategory';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import styles from '@/features/favorite-players/components/FavoritePlayersRow.module.css';

/**
 * Shows one favorite player: headshot with its favorite star on the card's
 * top border, then name, team and position, the category badge, and any
 * footer lines. Pressing the card opens the player's season stats; the star
 * opens the fan category menu instead.
 */
function FavoritePlayerCard({
  player,
  footer,
}: {
  player: FavoritePlayer;
  footer?: ReactNode;
}) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  return (
    <>
      <FavoriteCard
        picture={
          <PlayerHeadshot
            playerId={player.playerId}
            playerName={player.name}
            league={player.league}
            src={player.headshot}
            starSize="sm"
            className={styles.avatar}
            imgClassName={styles.avatarImg}
            fallback={
              <span className={styles.avatarInitials} aria-hidden="true">
                {getInitials(player.name)}
              </span>
            }
          />
        }
        name={player.name}
        detail={formatTeamAndPosition(player)}
        leagueTag={player.league === 'ahl' ? 'AHL' : undefined}
        category={player}
        onSelect={() => setIsStatsOpen(true)}
        footer={footer}
      />
      {isStatsOpen && (
        <FavoritePlayerStatsDialog
          player={player}
          onClose={() => setIsStatsOpen(false)}
        />
      )}
    </>
  );
}

export interface FavoritePlayersRowProps {
  /** Extra lines under a player's card, such as their season and last game. */
  renderCardFooter?: (player: FavoritePlayer) => ReactNode;
}

/**
 * Shows the signed-in user's favorite players, Diehard first, as a
 * horizontally scrolling row on My Hockey, or a hint when they have none.
 * Renders nothing when signed out or when the API predates favorite players.
 */
export default function FavoritePlayersRow({
  renderCardFooter,
}: FavoritePlayersRowProps) {
  const { isSignedIn, available, favorites } = useFavoritePlayers();
  if (!isSignedIn || !available) return null;

  const visibleFavorites = sortByFanTier(
    favorites.slice(0, MAX_FAVORITE_PLAYERS),
  );

  return (
    <FavoriteRowSection
      titleId="favorite-players-title"
      title="Your players"
      emptyHint="Star a player's headshot to pin them here."
      hasFavorites={favorites.length > 0}
    >
      {visibleFavorites.map((player) => (
        <FavoritePlayerCard
          key={`${player.league}-${player.playerId}`}
          player={player}
          footer={renderCardFooter?.(player)}
        />
      ))}
    </FavoriteRowSection>
  );
}
