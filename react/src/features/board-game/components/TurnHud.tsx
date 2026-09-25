import type { GameLength, TeamId } from '@/features/board-game/types/game';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/TurnHud.module.css';

export interface TurnHudProps {
  activeTeam: TeamId;
  initiativeTeam: TeamId;
  length: GameLength;
  possession: string;
  activationsRemaining: number;
  movementRemaining: number | null;
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

/** Active team, shift progress, movement allowance, and legal actions. */
export default function TurnHud({
  activeTeam,
  initiativeTeam,
  length,
  possession,
  activationsRemaining,
  movementRemaining,
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
        {TEAM_NAME[activeTeam]}&apos;s activation · {TEAM_NAME[initiativeTeam]}{' '}
        has initiative
      </span>
      <span className={styles.lengthLabel}>{LENGTH_LABEL[length]}</span>
      <span className={styles.possession}>{possession}</span>
      <span>
        {activationsRemaining} activations left ·{' '}
        {movementRemaining === null
          ? 'Select a skater'
          : `${movementRemaining} moves left`}
      </span>
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
          End Activation
        </GameButton>
      </div>
    </div>
  );
}
