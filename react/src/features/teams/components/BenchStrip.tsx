import JerseyToken from '@/features/teams/components/JerseyToken';
import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import { TokenSlot } from '@/features/teams/utils/teamLinesHelper';
import styles from '@/features/teams/components/RosterLines.module.css';

interface BenchStripProps {
  title: string;
  players: RosterPlayer[];
  slot: TokenSlot;
}

/** Compact bench row of small tokens (Extras / goalie Bench). */
export default function BenchStrip({ title, players, slot }: BenchStripProps) {
  if (players.length === 0) return null;
  return (
    <section className={styles.bench} aria-label={title}>
      <h3 className={styles.bench__title}>{title}</h3>
      <div className={styles.bench__list}>
        {players.map((player) => (
          <JerseyToken
            key={player.id}
            player={player}
            slot={slot}
            size="sm"
            showSlotLabel={false}
          />
        ))}
      </div>
    </section>
  );
}
