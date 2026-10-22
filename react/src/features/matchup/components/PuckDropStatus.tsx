import { Link, useLocation } from 'react-router-dom';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { useHasTimePassed } from '@/features/matchup/hooks/useHasTimePassed';
import { formatLocalTime } from '@/lib/dateFormat';
import { isPreviewGame } from '@/lib/gamePath';
import { isCompletedGameState } from '@/lib/gameStatus';
import styles from '@/features/matchup/components/MatchupPage.module.css';

/**
 * The previewed game's puck drop. Before the scheduled start it is plain text
 * ("Puck drop 7:00 PM"); from that moment (a local timer, no polling) or once
 * the season list shows the game under way, it links to the game page.
 */
export default function PuckDropStatus({ game }: { game: ScheduledGame }) {
  const location = useLocation();
  const hasStartTimePassed = useHasTimePassed(game.gameTime);
  const isGameOn =
    hasStartTimePassed || !isPreviewGame(game.gameState, game.gameTime);

  if (!isGameOn) {
    return (
      <span className={styles.puckDrop}>
        <span className={styles.puckDropDot} aria-hidden="true" />
        Puck drop {formatLocalTime(game.gameTime)}
      </span>
    );
  }

  const linkText = isCompletedGameState(game.gameState)
    ? 'Final · open the game page'
    : 'Game on · open the game page';
  return (
    <Link
      to={`/game/${game.gameId}`}
      state={location.state}
      className={`${styles.puckDrop} ${styles.puckDropLink}`}
    >
      <span className={styles.puckDropDot} aria-hidden="true" />
      {linkText}
    </Link>
  );
}
