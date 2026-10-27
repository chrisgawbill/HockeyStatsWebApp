import type { GameLength, TeamId } from '@/features/board-game/types/game';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/TurnHud.module.css';

export interface TurnHudProps {
  activeTeam: TeamId;
  length: GameLength;
  possession: string;
  shift: number;
  activationsLeft: Record<TeamId, number>;
  stepsLeft: number;
  canPass: boolean;
  canShoot: boolean;
  canEnd: boolean;
  onPass: () => void;
  onShoot: () => void;
  onEndActivation: () => void;
}

const LENGTH_LABEL: Record<GameLength, string> = {
  short: 'Short game',
  long: 'Long game',
};

/** Whose activation it is, the shift and activations left, tiles-left pips, and the Pass / Shoot / End activation actions. */
export default function TurnHud({
  activeTeam,
  length,
  possession,
  shift,
  activationsLeft,
  stepsLeft,
  canPass,
  canShoot,
  canEnd,
  onPass,
  onShoot,
  onEndActivation,
}: TurnHudProps) {
  return (
    <div className={styles.hud}>
      <span className={styles.turnLabel}>
        {TEAM_NAME[activeTeam]}&apos;s turn
      </span>
      <span className={styles.lengthLabel}>{LENGTH_LABEL[length]}</span>
      <span className={styles.shiftLabel}>
        Shift {shift} · activations left: {TEAM_NAME.user}{' '}
        {activationsLeft.user}, {TEAM_NAME.cpu} {activationsLeft.cpu}
      </span>
      <span className={styles.possession}>{possession}</span>
      <div
        className={styles.pips}
        role="img"
        aria-label={`${stepsLeft} tiles left this activation`}
      >
        {Array.from({ length: Math.max(stepsLeft, 0) }, (_, i) => (
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
        <GameButton
          onClick={onEndActivation}
          disabled={!canEnd}
          variant="primary"
        >
          End activation
        </GameButton>
      </div>
    </div>
  );
}
