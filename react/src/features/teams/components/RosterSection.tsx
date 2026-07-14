import {
  POSITIONS,
  Position,
  RosterPlayer,
} from '@/features/teams/types/teamPageTypes';
import PlayerCard from '@/features/teams/components/PlayerCard';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface RosterSectionProps {
  roster: Record<Position, RosterPlayer[]>;
}

export default function RosterSection({ roster }: RosterSectionProps) {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Roster</h2>
      <div className={styles['roster-grid']}>
        {POSITIONS.map((pos) => (
          <div key={pos} className={styles['roster-column']}>
            <h3 className={styles['roster-column__header']}>{pos}</h3>
            {roster[pos].map((player) => (
              <PlayerCard key={`${player.id}-${player.name}`} player={player} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
