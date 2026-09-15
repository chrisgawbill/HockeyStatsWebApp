import PlayerCard from '@/features/teams/components/PlayerCard';
import { RosterLine } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface RosterLineRowProps {
  line: RosterLine;
}

/**
 * Renders one forward line or defense pair as a single lifted unit (one
 * `surfaceElevated` container holding 1-3 players) rather than several
 * separate player cards, so a line reads as one cohesive group. The line
 * number renders as a small corner badge instead of a text heading, echoing
 * the jersey-number badge already used on `PlayerCard`.
 */
export default function RosterLineRow({ line }: RosterLineRowProps) {
  const badge = line.label && /\d+$/.exec(line.label)?.[0];

  return (
    <div className={`${styles['roster-line-row']} ${shared.surfaceElevated}`}>
      {badge && (
        <span className={styles['roster-line-row__badge']} title={line.label}>
          {badge}
        </span>
      )}
      {line.players.map((player, i) => (
        <div key={player.id} className={styles['roster-line-row__slot']}>
          {i > 0 && <span className={styles['roster-line-row__divider']} />}
          <PlayerCard player={player} variant="slot" />
        </div>
      ))}
    </div>
  );
}
