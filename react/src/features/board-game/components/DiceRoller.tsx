import { useEffect, useState } from 'react';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/DiceRoller.module.css';

export interface DiceRollerProps {
  dice: [number, number] | null;
  canRoll: boolean;
  onRoll: () => void;
}

const PIP_LAYOUTS: Record<number, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

function Die({ value }: { value: number | null }) {
  const pips = value ? PIP_LAYOUTS[value] : new Array(9).fill(false);
  return (
    <div
      className={styles.die}
      role="img"
      aria-label={value ? `Die showing ${value}` : 'Die'}
    >
      {pips.map((on, i) => (
        <span key={i} className={on ? styles.pipOn : styles.pip} />
      ))}
    </div>
  );
}

/** Two pixel-style dice plus a Roll button, enabled only in the user's roll phase. */
export default function DiceRoller({ dice, canRoll, onRoll }: DiceRollerProps) {
  const [justRolled, setJustRolled] = useState(false);

  useEffect(() => {
    if (!dice) return;
    setJustRolled(true);
    const timer = setTimeout(() => setJustRolled(false), 300);
    return () => clearTimeout(timer);
  }, [dice]);

  const diceClassName = [styles.dice, justRolled ? styles.rolling : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={diceClassName}>
        <Die value={dice ? dice[0] : null} />
        <Die value={dice ? dice[1] : null} />
      </div>
      <GameButton onClick={onRoll} disabled={!canRoll} variant="primary">
        Roll
      </GameButton>
    </div>
  );
}
