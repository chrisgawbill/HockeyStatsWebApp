import { useEffect, useRef, useState, type MouseEvent } from 'react';
import FavoriteCategoryMenu from '@/components/FavoriteCategoryMenu';
import FavoriteStarIcon from '@/components/FavoriteStarIcon';
import { DEFAULT_FAN_TIER } from '@/lib/favoriteCategory';
import {
  FavoriteLimitError,
  useFavoritePlayers,
} from '@/features/favorite-players/hooks/FavoritePlayersContext';
import { MAX_FAVORITE_PLAYERS } from '@/features/favorite-players/utils/weeklyReportFormat';
import styles from '@/components/FavoriteStar.module.css';
import { useLeague } from '@/lib/LeagueContext';
import type { League } from '@/lib/league';

/** How long a hint or error toast stays up. */
const MESSAGE_VISIBLE_MS = 6000;

export interface FavoritePlayerStarProps {
  playerId: number;
  playerName: string;
  /** The player's league; defaults to the league the site shows. */
  league?: League;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Round star button that favorites a player for the Weekly Player Report.
 * Once the player is a favorite, it opens the fan category menu (tier, label,
 * Unfavorite) instead. It never triggers the surrounding row or card. Signed-out users get a
 * pointer to the header's Google sign-in; hints and failures show as a toast
 * so they are not clipped by scrolling rows. Hidden when the API predates
 * favorite players. AHL players have no Weekly Player Report yet, so their copy
 * leaves it out.
 */
export default function FavoritePlayerStar({
  playerId,
  playerName,
  league: playerLeague,
  size = 'md',
  className,
}: FavoritePlayerStarProps) {
  const {
    isSignedIn,
    available,
    favorites,
    isFavorite,
    toggleFavorite,
    updatePlayerCategory,
  } = useFavoritePlayers();
  const { league: viewLeague } = useLeague();
  const league = playerLeague ?? viewLeague;
  const reportSuffix = league === 'nhl' ? ' for the Weekly Player Report' : '';
  const starRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const favorite = isSignedIn && isFavorite(playerId, league);
  const favoritePlayer = favorites.find(
    (player) => player.league === league && player.playerId === playerId,
  );

  useEffect(() => {
    if (!message) return;
    const hideMessageTimer = window.setTimeout(
      () => setMessage(null),
      MESSAGE_VISIBLE_MS,
    );
    return () => window.clearTimeout(hideMessageTimer);
  }, [message]);

  if (isSignedIn && !available) return null;

  const respondToStarPress = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isSignedIn) {
      setMessage({
        text: `Sign in with Google at the top of the page to favorite ${playerName}${league === 'nhl' ? ' and get a Weekly Player Report every Monday' : ''}.`,
        isError: false,
      });
      return;
    }
    if (favorite) {
      setIsMenuOpen((isOpen) => !isOpen);
      return;
    }
    setMessage(null);
    setPending(true);
    try {
      await toggleFavorite(playerId, league, playerName);
    } catch (error) {
      setMessage({
        text:
          error instanceof FavoriteLimitError
            ? `You can favorite up to ${MAX_FAVORITE_PLAYERS} players across the NHL and AHL. Unstar one first.`
            : "Couldn't save your favorite. Try again in a moment.",
        isError: true,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        ref={starRef}
        type="button"
        className={[styles.star, styles[size], className]
          .filter(Boolean)
          .join(' ')}
        onClick={respondToStarPress}
        disabled={pending}
        aria-pressed={isSignedIn ? favorite : undefined}
        aria-haspopup={favorite ? 'dialog' : undefined}
        aria-expanded={favorite ? isMenuOpen : undefined}
        aria-label={
          favorite
            ? `Fan category and options for ${playerName}`
            : `Favorite ${playerName}${reportSuffix}`
        }
        title={
          favorite ? `Fan category for ${playerName}` : `Favorite ${playerName}`
        }
      >
        <FavoriteStarIcon filled={favorite} />
      </button>
      {isMenuOpen && favorite && (
        <FavoriteCategoryMenu
          itemName={playerName}
          category={{
            tier: favoritePlayer?.tier ?? DEFAULT_FAN_TIER,
            label: favoritePlayer?.label ?? null,
          }}
          anchorRef={starRef}
          onSave={(category) =>
            updatePlayerCategory(playerId, league, category)
          }
          onUnfavorite={() => toggleFavorite(playerId, league, playerName)}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
      {message && (
        <p className={styles.toast} role={message.isError ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </>
  );
}
