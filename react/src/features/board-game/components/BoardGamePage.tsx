import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import type { GameLength } from '@/features/board-game/types/game';
import GameLengthPicker from '@/features/board-game/components/GameLengthPicker';
import BoardGame from '@/features/board-game/components/BoardGame';
import styles from '@/features/board-game/components/BoardGamePage.module.css';

/** Rink Quest board game page: picks a game length, then hands the match off to BoardGame. */
export default function BoardGamePage() {
  const [length, setLength] = useState<GameLength | null>(null);

  return (
    <>
      <PageHeader />
      <div className={styles.page}>
        <h1 className={styles.title}>Rink Quest</h1>
        {length === null ? (
          <GameLengthPicker onPick={setLength} />
        ) : (
          <BoardGame length={length} onChangeLength={() => setLength(null)} />
        )}
      </div>
    </>
  );
}
