import { useEffect, useRef } from 'react';
import type { GameLength } from '@/features/board-game/types/game';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/GameLengthPicker.module.css';

export interface GameLengthPickerProps {
  onPick: (length: GameLength) => void;
}

/** Pre-match choice of game length. Dumb: props in, callback out. */
export default function GameLengthPicker({ onPick }: GameLengthPickerProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  return (
    <div className={styles.picker}>
      <h2 className={styles.title}>Choose game length</h2>
      <div className={styles.options}>
        <GameButton
          ref={firstButtonRef}
          onClick={() => onPick('short')}
          variant="primary"
          subLabel="~11 turns · goalies easier to beat"
        >
          Short game
        </GameButton>
        <GameButton
          onClick={() => onPick('long')}
          variant="primary"
          subLabel="~14 turns · tougher goalies"
        >
          Long game
        </GameButton>
      </div>
      <p className={styles.help}>
        Quick start: choose a skater, move the puck, and use cards to win
        duels. Score more goals before the final whistle.
      </p>
    </div>
  );
}
