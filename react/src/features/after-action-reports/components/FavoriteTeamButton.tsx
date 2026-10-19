import { useEffect, useState } from 'react';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import styles from '@/features/after-action-reports/components/FavoriteTeamButton.module.css';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/** How long the save-failed message stays up. */
const ERROR_VISIBLE_MS = 6000;

export interface FavoriteTeamButtonProps {
  triCode: string;
  teamName: string;
}

/**
 * Follows a team for After Action Reports. Signed-out users get a pointer to
 * the header's Google sign-in instead of a dead button. A failed save reverts
 * the star and says so briefly rather than failing silently.
 */
export default function FavoriteTeamButton({
  triCode,
  teamName,
}: FavoriteTeamButtonProps) {
  const { isSignedIn, isFavorite, toggleFavorite } = useAfterActionReports();
  const [showHint, setShowHint] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const favorite = isSignedIn && isFavorite(triCode);

  useEffect(() => {
    if (!saveFailed) return;
    const timer = window.setTimeout(
      () => setSaveFailed(false),
      ERROR_VISIBLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [saveFailed]);

  const handleClick = async () => {
    if (!isSignedIn) {
      setShowHint((value) => !value);
      return;
    }
    setSaveFailed(false);
    setPending(true);
    try {
      await toggleFavorite(triCode);
    } catch {
      // The provider already restored the star and logged the cause.
      setSaveFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={isSignedIn ? favorite : undefined}
        aria-label={
          favorite
            ? `Unfavorite ${teamName}`
            : `Favorite ${teamName} for After Action Reports`
        }
      >
        <StarIcon filled={favorite} />
        <span>{favorite ? 'Favorited' : 'Favorite'}</span>
      </button>
      {showHint && !isSignedIn && (
        <p className={styles.hint} role="status">
          Sign in with Google at the top of the page to favorite {teamName} and
          get an After Action Report after every game.
        </p>
      )}
      {saveFailed && (
        <p className={styles.hint} role="alert">
          Couldn&apos;t save your favorite. Try again in a moment.
        </p>
      )}
    </div>
  );
}
