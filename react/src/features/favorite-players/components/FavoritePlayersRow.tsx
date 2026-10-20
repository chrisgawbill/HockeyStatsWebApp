import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
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
 * top border, then name, team and position, and the category badge. The card
 * links to the player's team page when the team is known. The star never
 * navigates.
 */
function FavoritePlayerCard({ player }: { player: FavoritePlayer }) {
  return (
    <FavoriteCard
      picture={
        <PlayerHeadshot
          playerId={player.playerId}
          playerName={player.name}
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
      category={player}
      linkTo={player.teamTriCode ? `/team/${player.teamTriCode}` : undefined}
    />
  );
}

/**
 * Shows the signed-in user's favorite players, Diehard first, as a
 * horizontally scrolling row on the landing page, or a hint when they have
 * none. Renders nothing when signed out or when the API predates favorite
 * players.
 */
export default function FavoritePlayersRow() {
  const { isSignedIn, available, favorites } = useFavoritePlayers();
  if (!isSignedIn || !available) return null;

  const visibleFavorites = sortByFanTier(
    favorites.slice(0, MAX_FAVORITE_PLAYERS),
  );

  return (
    <FavoriteRowSection
      titleId="favorite-players-title"
      title="Your favorite players"
      emptyHint="Star a player's headshot to pin them here."
      hasFavorites={favorites.length > 0}
    >
      {visibleFavorites.map((player) => (
        <FavoritePlayerCard key={player.playerId} player={player} />
      ))}
    </FavoriteRowSection>
  );
}
