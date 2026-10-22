import { Link } from 'react-router-dom';
import FanCategoryBadge from '@/components/FanCategoryBadge';
import { isInProgressGameState } from '@/lib/gameStatus';
import { DEFAULT_HEADSHOT_URL } from '@/lib/playerHeadshot';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import type { FeedPlayerItem } from '@/features/my-hockey/types/myHockey';
import {
  formatLatestGameLine,
  formatSeasonLine,
} from '@/features/my-hockey/utils/feedFormat';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/**
 * One favorite player: starred headshot, name and tier badge, team ·
 * position · season line, and the latest game (linking to it).
 */
export default function FeedPlayerRow({ item }: { item: FeedPlayerItem }) {
  const { player, seasonTotals, latestGame } = item;
  const details = [
    player.teamTriCode,
    player.position,
    seasonTotals ? formatSeasonLine(seasonTotals) : null,
  ].filter(Boolean);
  return (
    <li className={styles.playerRow}>
      <PlayerHeadshot
        playerId={player.playerId}
        playerName={player.name}
        src={player.headshot ?? DEFAULT_HEADSHOT_URL}
        className={styles.headshot}
        imgClassName={styles.headshotImg}
        starSize="sm"
      />
      <div className={styles.playerBody}>
        <div className={styles.playerTop}>
          <span className={styles.rowTitle}>{player.name}</span>
          <FanCategoryBadge category={player} size="sm" />
        </div>
        <span className={styles.meta}>{details.join(' · ')}</span>
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
      </div>
    </li>
  );
}
