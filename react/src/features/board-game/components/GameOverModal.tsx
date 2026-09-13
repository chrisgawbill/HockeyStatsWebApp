import { useEffect, useId, useRef } from 'react';
import type { TeamId } from '@/features/board-game/types/game';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import GameButton from '@/features/board-game/components/GameButton';
import ModalOverlay from '@/features/board-game/components/ModalOverlay';
import styles from '@/features/board-game/components/GameOverModal.module.css';

export interface GameOverModalProps {
  winner: TeamId;
  onPlayAgain: () => void;
  onChangeLength: () => void;
}

/** Win/lose dialog shown when `phase === 'gameOver'`. Dumb: props in, callbacks out. */
export default function GameOverModal({
  winner,
  onPlayAgain,
  onChangeLength,
}: GameOverModalProps) {
  const titleId = useId();
  const playAgainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    playAgainRef.current?.focus();
  }, []);

  const message =
    winner === 'user'
      ? `Goal! ${TEAM_NAME.user} wins`
      : `${TEAM_NAME.cpu} scores — you lose`;

  return (
    <ModalOverlay>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={styles.title}>
          {message}
        </h2>
        <div className={styles.actions}>
          <GameButton
            ref={playAgainRef}
            onClick={onPlayAgain}
            variant="primary"
          >
            Play again
          </GameButton>
          <GameButton onClick={onChangeLength}>Change length</GameButton>
        </div>
      </div>
    </ModalOverlay>
  );
}
