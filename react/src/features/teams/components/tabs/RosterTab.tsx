import PlayerCard from '@/features/teams/components/PlayerCard';
import { groupRosterByPositionGroup } from '@/features/teams/utils/teamPageHelper';
import {
  POSITION_GROUPS,
  Position,
  RosterPlayer,
} from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface Props {
  roster: Record<Position, RosterPlayer[]>;
}

/**
 * Roster tab: three groups (Forwards / Defense / Goalies), collapsed from the
 * existing 5-bucket roster via `groupRosterByPositionGroup`, each rendering a
 * grid of the existing `PlayerCard`. `RosterSection` (the 5-column layout) is
 * intentionally not used here — it stays available for wherever it's already
 * wired up, unmodified.
 */
export default function RosterTab({ roster }: Props) {
  const grouped = groupRosterByPositionGroup(roster);

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Roster</h2>
      {POSITION_GROUPS.map((group) => (
        <div key={group} className={styles['roster-group-section']}>
          <h3 className={styles['roster-group-section__header']}>{group}</h3>
          <div className={styles['roster-group-cards']}>
            {grouped[group].map((player) => (
              <PlayerCard key={`${player.id}-${player.name}`} player={player} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
