import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import AppDialog from '@/components/AppDialog';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import { StatCell } from '@/features/teams/utils/playerStatsHelper';
import { getComparePath } from '@/lib/comparePath';
import styles from '@/features/teams/components/PlayerStatsDialog.module.css';

interface PlayerStatsDialogProps {
  playerId: number;
  playerName: string;
  headshot?: string | null;
  /** Line under the name, such as "#97 · Center". */
  detail: string;
  /** Shown in the headshot circle when there is no photo. */
  headshotFallback: ReactNode;
  /** The player's stat cells, or null when they have no stat line. */
  statCells: StatCell[] | null;
  /** Shown instead of the stat cells while they load or when loading failed. */
  statusMessage?: string;
  teamColor: string;
  teamInk: string;
  onClose: () => void;
}

/**
 * Dialog showing one player's stat cells, tinted with the team's colors, with
 * a Compare link that opens the comparison page with this player filled in.
 */
export default function PlayerStatsDialog({
  playerId,
  playerName,
  headshot,
  detail,
  headshotFallback,
  statCells,
  statusMessage,
  teamColor,
  teamInk,
  onClose,
}: PlayerStatsDialogProps) {
  const titleId = useId();

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
            playerId={playerId}
            playerName={playerName}
            src={headshot}
            className={styles.avatarFrame}
            innerClassName={styles.avatar}
            imgClassName={styles.avatar__img}
            fallback={
              <span className={styles.avatar__number} aria-hidden="true">
                {headshotFallback}
              </span>
            }
          />
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.name}>
              {playerName}
            </h2>
            <p className={styles.meta}>{detail}</p>
          </div>
        </header>
        {statusMessage ? (
          <p className={styles.empty} role="status">
            {statusMessage}
          </p>
        ) : statCells ? (
          <dl className={styles.grid}>
            {statCells.map((cell) => (
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
          <Link
            to={getComparePath([playerId])}
            className={`ds-button ${styles.compare}`}
            onClick={onClose}
          >
            Compare
          </Link>
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
