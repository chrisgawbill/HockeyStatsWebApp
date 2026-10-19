import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import {
  buildTokenAriaLabel,
  getLastName,
  TokenSlot,
} from '@/features/teams/utils/teamLinesHelper';
import styles from '@/features/teams/components/RosterLines.module.css';

interface JerseyTokenProps {
  player: RosterPlayer;
  slot: TokenSlot;
  /** Small label above the lastname ("LW", "C", ...). */
  showSlotLabel?: boolean;
  size?: 'md' | 'sm';
}

/**
 * Round jersey token: team-color disc with the jersey number, the last name
 * below and an optional slot label. Tapping a player does nothing today (the
 * old PlayerCard was not interactive either); the token is focusable so it is
 * reachable by keyboard and announced with name, number and position.
 */
export default function JerseyToken({
  player,
  slot,
  showSlotLabel = true,
  size = 'md',
}: JerseyTokenProps) {
  return (
    <div
      className={`${styles.token} ${size === 'sm' ? styles['token--sm'] : ''}`}
      role="group"
      tabIndex={0}
      aria-label={buildTokenAriaLabel(player, slot)}
    >
      <span className={styles.token__disc} aria-hidden="true">
        {player.number}
      </span>
      <span className={styles.token__name} aria-hidden="true">
        {getLastName(player.name)}
      </span>
      {showSlotLabel && (
        <span className={styles.token__slot} aria-hidden="true">
          {slot}
        </span>
      )}
    </div>
  );
}
