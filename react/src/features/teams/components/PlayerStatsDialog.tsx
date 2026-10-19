import { useId, useState } from 'react';

import AppDialog from '@/components/AppDialog';
import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import {
  buildPlayerStatCells,
  getPositionLabel,
  PlayerStatsLookup,
} from '@/features/teams/utils/playerStatsHelper';
import { TokenSlot } from '@/features/teams/utils/teamLinesHelper';
import styles from '@/features/teams/components/PlayerStatsDialog.module.css';

interface PlayerStatsDialogProps {
  player: RosterPlayer;
  slot: TokenSlot;
  lookup: PlayerStatsLookup;
  teamColor: string;
  teamInk: string;
  onClose: () => void;
}

export default function PlayerStatsDialog({
  player,
  slot,
  lookup,
  teamColor,
  teamInk,
  onClose,
}: PlayerStatsDialogProps) {
  const titleId = useId();
  const [photoFailed, setPhotoFailed] = useState(false);
  const cells = buildPlayerStatCells(player.id, slot, lookup, player.stat);
  const showPhoto = Boolean(player.headshot) && !photoFailed;

  return (
    <AppDialog
      open
      labelledBy={titleId}
      onClose={onClose}
      className={styles.dialog}
    >
      <div
        className={styles.body}
        style={
          {
            '--pd-team': teamColor,
            '--pd-team-ink': teamInk,
          } as React.CSSProperties
        }
      >
        <header className={styles.header}>
          <span className={styles.avatar} aria-hidden="true">
            {showPhoto ? (
              <img
                className={styles.avatar__img}
                src={player.headshot}
                alt=""
                width={72}
                height={72}
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span className={styles.avatar__number}>{player.number}</span>
            )}
          </span>
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.name}>
              {player.name}
            </h2>
            <p className={styles.meta}>
              #{player.number} · {getPositionLabel(slot, lookup, player.id)}
            </p>
          </div>
        </header>
        {cells ? (
          <dl className={styles.grid}>
            {cells.map((cell) => (
              <div key={cell.label} className={styles.cell}>
                <dt className={styles.cell__label}>{cell.label}</dt>
                <dd className={styles.cell__value}>{cell.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.empty}>No stats this season yet</p>
        )}
        <footer className={styles.footer}>
          <button
            type="button"
            className={`ds-button ${styles.close}`}
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </AppDialog>
  );
}
