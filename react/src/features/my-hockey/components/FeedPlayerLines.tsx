import { Link } from 'react-router-dom';
import { isInProgressGameState } from '@/lib/gameStatus';
import type { FeedPlayerItem } from '@/features/my-hockey/types/myHockey';
import {
  formatLatestGameLine,
  formatSeasonLine,
} from '@/features/my-hockey/utils/feedFormat';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/**
 * A favorite player's feed lines for their card: the season line and the
 * latest game (linking to it).
 */
export default function FeedPlayerLines({ item }: { item: FeedPlayerItem }) {
  const { player, seasonTotals, latestGame } = item;
  return (
    <>
      {seasonTotals && <span>{formatSeasonLine(seasonTotals)}</span>}
      {latestGame && player.teamTriCode && (
        <Link
          to={`/game/${latestGame.game.gameId}`}
          className={styles.latestGame}
        >
          {formatLatestGameLine(
            latestGame.game,
            latestGame.line,
            player.teamTriCode,
            isInProgressGameState(latestGame.game.gameState),
          )}
        </Link>
      )}
    </>
  );
}
