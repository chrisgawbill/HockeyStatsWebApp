import BenchStrip from '@/features/teams/components/BenchStrip';
import JerseyToken from '@/features/teams/components/JerseyToken';
import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import styles from '@/features/teams/components/RosterLines.module.css';

interface GoalieCreaseProps {
  starter: RosterPlayer | null;
  backups: RosterPlayer[];
}

/** One rink end with the crease (starter inside) and a Bench strip for backups. */
export default function GoalieCrease({ starter, backups }: GoalieCreaseProps) {
  if (!starter) {
    return <p className={styles.empty}>No goalies on the roster.</p>;
  }
  return (
    <div className={styles.goalie}>
      <figure className={`${styles.stripFigure} ${styles.goalie__rink}`}>
        <div
          className={`${styles.strip} ${styles['strip--goal']} ${styles['strip--live']}`}
        >
          <span className={styles.goal__line} aria-hidden="true" />
          <span className={styles.goal__crease} aria-hidden="true" />
          <span className={styles.goal__net} aria-hidden="true" />
          <div className={`${styles.spot} ${styles['spot--G']}`}>
            <JerseyToken player={starter} slot="G" />
          </div>
        </div>
        <figcaption className={styles.stripCaption}>Starter</figcaption>
      </figure>
      <BenchStrip title="Bench" players={backups} slot="G" />
    </div>
  );
}
