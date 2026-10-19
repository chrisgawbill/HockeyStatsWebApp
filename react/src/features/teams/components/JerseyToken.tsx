import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import { useState } from 'react';

import { useOpenPlayerDialog } from '@/features/teams/hooks/PlayerDialogContext';

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
 * below and an optional slot label. It is a real button that opens the
 * player stats dialog (via PlayerDialogContext) and is announced with name,
 * number and position.
 */
export default function JerseyToken({
  player,
  slot,
  showSlotLabel = true,
  size = 'md',
}: JerseyTokenProps) {
  // Remember which URL failed so a changed headshot gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(player.headshot) && failedUrl !== player.headshot;
  const openPlayer = useOpenPlayerDialog();
  const imgSize = size === 'sm' ? 34 : 44;
  // Rendered larger on desktop via CSS; request a sharper pixel size there.

  return (
    <button
      type="button"
      className={`${styles.token} ${size === 'sm' ? styles['token--sm'] : ''}`}
      aria-label={buildTokenAriaLabel(player, slot)}
      aria-haspopup="dialog"
      onClick={(e) => openPlayer(player, slot, e.currentTarget)}
    >
      {showPhoto ? (
        <span
          className={`${styles.token__disc} ${styles['token__disc--photo']}`}
          aria-hidden="true"
        >
          <img
            className={styles.token__photo}
            src={player.headshot}
            alt=""
            width={imgSize}
            height={imgSize}
            loading="lazy"
            decoding="async"
            onError={() => setFailedUrl(player.headshot ?? null)}
          />
          <span className={styles.token__badge}>{player.number}</span>
        </span>
      ) : (
        <span className={styles.token__disc} aria-hidden="true">
          {player.number}
        </span>
      )}
      <span className={styles.token__name} aria-hidden="true">
        {getLastName(player.name)}
      </span>
      {showSlotLabel && (
        <span className={styles.token__slot} aria-hidden="true">
          {slot}
        </span>
      )}
    </button>
  );
}
