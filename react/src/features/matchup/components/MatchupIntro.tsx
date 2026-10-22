import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import PuckDropStatus from '@/features/matchup/components/PuckDropStatus';
import { isPreviewGame } from '@/lib/gamePath';
import styles from '@/features/matchup/components/MatchupPage.module.css';

/** Weekday, month and day of a game, e.g. "Thu, Oct 23". */
function formatGameDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The page heading: the named game (away at home, date, arena, puck drop or
 * a link to its game page) when the URL names a game between the two teams,
 * else the head-to-head intro.
 */
export default function MatchupIntro({
  previewGame,
}: {
  previewGame: ScheduledGame | null;
}) {
  if (!previewGame) {
    return (
      <header className={styles.intro}>
        <p className={styles.kicker}>Season series</p>
        <h1>Head-to-Head Matchup</h1>
        <p>Compare meetings, results, goals, team DNA, and recent form.</p>
      </header>
    );
  }
  return (
    <header className={styles.intro}>
      <p className={styles.kicker}>
        {isPreviewGame(previewGame.gameState, previewGame.gameTime)
          ? 'Game preview'
          : 'Season series'}
      </p>
      <h1>
        {previewGame.awayTeam} at {previewGame.homeTeam}
      </h1>
      <div className={styles.gameContext}>
        <span>
          {formatGameDay(previewGame.date)}
          {previewGame.venue && ` · ${previewGame.venue}`}
        </span>
        <PuckDropStatus game={previewGame} />
      </div>
    </header>
  );
}
