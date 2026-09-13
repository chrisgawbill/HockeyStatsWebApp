import type { GameLength, TeamId } from '@/features/board-game/types/game';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/TurnHud.module.css';

export interface TurnHudProps {
  activeTeam: TeamId;
  length: GameLength;
  possession: string;
  mp: number;
  canPass: boolean;
  canShoot: boolean;
  canEnd: boolean;
  onPass: () => void;
  onShoot: () => void;
  onEndTurn: () => void;
}

const LENGTH_LABEL: Record<GameLength, string> = {
  short: 'Short game',
  long: 'Long game',
};

/** Whose turn it is, the game length, MP pips, and the Pass / Shoot / End Turn actions. */
export default function TurnHud({
  activeTeam,
  length,
  possession,
  mp,
  canPass,
  canShoot,
  canEnd,
  onPass,
  onShoot,
  onEndTurn,
}: TurnHudProps) {
  return (
    <div className={styles.hud}>
      <span className={styles.turnLabel}>
        {TEAM_NAME[activeTeam]}&apos;s turn
      </span>
      <span className={styles.lengthLabel}>{LENGTH_LABEL[length]}</span>
      <span className={styles.possession}>{possession}</span>
      <div
        className={styles.pips}
        role="img"
        aria-label={`${mp} movement points left`}
      >
        {Array.from({ length: Math.max(mp, 0) }, (_, i) => (
          <span key={i} className={styles.pip} />
        ))}
      </div>
      <div className={styles.actions}>
        <GameButton onClick={onPass} disabled={!canPass}>
          Pass
        </GameButton>
        <GameButton onClick={onShoot} disabled={!canShoot}>
          Shoot
        </GameButton>
        <GameButton onClick={onEndTurn} disabled={!canEnd} variant="primary">
          End Turn
        </GameButton>
      </div>
    </div>
  );
}
