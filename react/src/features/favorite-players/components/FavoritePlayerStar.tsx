import { useEffect, useState, type MouseEvent } from 'react';
import {
  FavoriteLimitError,
  useFavoritePlayers,
} from '@/features/favorite-players/hooks/FavoritePlayersContext';
import { MAX_FAVORITE_PLAYERS } from '@/features/favorite-players/utils/weeklyReportFormat';
import styles from '@/features/favorite-players/components/FavoritePlayerStar.module.css';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/** How long a hint or error toast stays up. */
const MESSAGE_VISIBLE_MS = 6000;

export interface FavoritePlayerStarProps {
  playerId: number;
  playerName: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Round star button that favorites a player for the Weekly Player Report.
 * It never triggers the surrounding row or card. Signed-out users get a
 * pointer to the header's Google sign-in; hints and failures show as a toast
 * so they are not clipped by scrolling rows. Hidden when the API predates
 * favorite players.
 */
export default function FavoritePlayerStar({
  playerId,
  playerName,
  size = 'md',
  className,
}: FavoritePlayerStarProps) {
  const { isSignedIn, available, isFavorite, toggleFavorite } =
    useFavoritePlayers();
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const favorite = isSignedIn && isFavorite(playerId);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), MESSAGE_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (isSignedIn && !available) return null;

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isSignedIn) {
      setMessage({
        text: `Sign in with Google at the top of the page to favorite ${playerName} and get a Weekly Player Report every Monday.`,
        isError: false,
      });
      return;
    }
    setMessage(null);
    setPending(true);
    try {
      await toggleFavorite(playerId, playerName);
    } catch (error) {
      setMessage({
        text:
          error instanceof FavoriteLimitError
            ? `You can favorite up to ${MAX_FAVORITE_PLAYERS} players. Unstar one first.`
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
        type="button"
        className={[styles.star, styles[size], className]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={isSignedIn ? favorite : undefined}
        aria-label={
          favorite
            ? `Unfavorite ${playerName}`
            : `Favorite ${playerName} for the Weekly Player Report`
        }
        title={favorite ? `Unfavorite ${playerName}` : `Favorite ${playerName}`}
      >
        <StarIcon filled={favorite} />
      </button>
      {message && (
        <p className={styles.toast} role={message.isError ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </>
  );
}
