import { Link } from 'react-router-dom';
import FanCategoryBadge from '@/components/FanCategoryBadge';
import TeamLogo from '@/components/TeamLogo';
import { isInProgressGameState } from '@/lib/gameStatus';
import type { FeedGameItem } from '@/features/my-hockey/types/myHockey';
import {
  describeMatchup,
  formatGameDay,
  formatLivePeriod,
  formatStartTime,
  getOpponent,
  getScoreFor,
} from '@/features/my-hockey/utils/feedFormat';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

export interface UpNextRowProps {
  item: FeedGameItem;
  now: Date;
  /** The home strip leaves out the fan category badge. */
  showCategory?: boolean;
}

/**
 * One upcoming or live game: when it starts (or LIVE and the period), the
 * matchup from the favorite's side between the two teams' logos, and the
 * score once it is live. Links to the game page.
 */
export default function UpNextRow({
  item,
  now,
  showCategory = true,
}: UpNextRowProps) {
  const { game, team } = item;
  const isLive = isInProgressGameState(game.gameState);
  const opponent = getOpponent(game, team.triCode);
  const { teamScore, opponentScore } = getScoreFor(game, team.triCode);
  return (
    <li>
      <Link to={`/game/${game.gameId}`} className={styles.row}>
        <span className={styles.when} data-live={isLive || undefined}>
          <span className={styles.whenDay}>
            {isLive ? 'Live' : formatGameDay(game.startTime, now)}
          </span>
          <span className={styles.whenTime}>
            {isLive ? formatLivePeriod(game) : formatStartTime(game.startTime)}
          </span>
        </span>
        <span className={styles.matchup}>
          <TeamLogo triCode={team.triCode} className={styles.logo} />
          <span className={styles.matchText}>
            <span className={styles.rowTitle}>
              {describeMatchup(game, team.triCode)}
            </span>
            {showCategory && <FanCategoryBadge category={team} size="sm" />}
          </span>
          <TeamLogo triCode={opponent} className={styles.logo} />
        </span>
        {isLive && (
          <span
            className={styles.score}
            aria-label={`${team.triCode} ${teamScore}, ${opponent} ${opponentScore}`}
          >
            {teamScore}–{opponentScore}
          </span>
        )}
      </Link>
    </li>
  );
}
