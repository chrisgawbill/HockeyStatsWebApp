import { useId } from 'react';

import AppDialog from '@/components/AppDialog';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
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
  const cells = buildPlayerStatCells(player.id, slot, lookup, player.stat);

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
          <PlayerHeadshot
            playerId={player.id}
            playerName={player.name}
            src={player.headshot}
            className={styles.avatarFrame}
            innerClassName={styles.avatar}
            imgClassName={styles.avatar__img}
            fallback={
              <span className={styles.avatar__number} aria-hidden="true">
                {player.number}
              </span>
            }
          />
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
