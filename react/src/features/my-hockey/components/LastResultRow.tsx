import { Link } from 'react-router-dom';
import TeamLogo from '@/components/TeamLogo';
import type { FeedGameItem } from '@/features/my-hockey/types/myHockey';
import {
  formatShortDate,
  getExtraTimeLabel,
  getOpponent,
  getResultLetter,
  getScoreFor,
  getVenueWord,
} from '@/features/my-hockey/utils/feedFormat';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

export interface LastResultRowProps {
  item: FeedGameItem;
  /** Present when the game has an After Action Report in the inbox. */
  report: { read: boolean } | null;
  onOpenReport: (gameId: number) => void;
}

/**
 * One final: W/L/OTL, the score from the favorite's side, and the date. A
 * "Report" pill (with an unread dot) marks games that have an After Action
 * Report; opening the row marks it read. Links to the game page.
 */
export default function LastResultRow({
  item,
  report,
  onOpenReport,
}: LastResultRowProps) {
  const { game, team } = item;
  const resultLetter = getResultLetter(game, team.triCode);
  const { teamScore, opponentScore } = getScoreFor(game, team.triCode);
  const extraTime = getExtraTimeLabel(game);
  return (
    <li>
      <Link
        to={`/game/${game.gameId}`}
        className={styles.row}
        onClick={() => {
          if (report && !report.read) onOpenReport(game.gameId);
        }}
      >
        <span className={styles.result} data-result={resultLetter}>
          {resultLetter}
        </span>
        <span className={styles.matchup}>
          <TeamLogo triCode={team.triCode} className={styles.logo} />
          <span className={styles.matchText}>
            <span className={styles.rowTitle}>
              {team.triCode} {teamScore}–{opponentScore}{' '}
              {getVenueWord(game, team.triCode)}{' '}
              {getOpponent(game, team.triCode)}
              {extraTime && (
                <span className={styles.extraTime}> {extraTime}</span>
              )}
            </span>
            <span className={styles.meta}>
              {formatShortDate(game.startTime)}
            </span>
          </span>
        </span>
        {report && (
          <span className={styles.reportPill}>
            Report
            {!report.read && (
              <span className={styles.dot} aria-label="Unread" />
            )}
          </span>
        )}
      </Link>
    </li>
  );
}
