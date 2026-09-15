import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import type { GameLength } from '@/features/board-game/types/game';
import {
  currentStreak,
  loadStreak,
} from '@/features/board-game/data/dailyStreak';
import GameLengthPicker from '@/features/board-game/components/GameLengthPicker';
import GameButton from '@/features/board-game/components/GameButton';
import StreakCalendar from '@/features/board-game/components/StreakCalendar';
import BoardGame from '@/features/board-game/components/BoardGame';
import styles from '@/features/board-game/components/BoardGamePage.module.css';

type PreGameView = 'picker' | 'calendar';

/** Rink Quest board game page: picks a game length, then hands the match off to BoardGame. */
export default function BoardGamePage() {
  const [length, setLength] = useState<GameLength | null>(null);
  const [view, setView] = useState<PreGameView>('picker');

  // useBoardGame() is only mounted once a length is picked (inside BoardGame), so the
  // pre-game screen reads the streak directly rather than restructuring that hook's scope.
  const streakData = loadStreak();
  const streak = currentStreak(streakData);

  return (
    <>
      <PageHeader />
      <div className={styles.page}>
        <h1 className={styles.title}>Rink Quest</h1>
        {length === null ? (
          view === 'calendar' ? (
            <StreakCalendar
              streakData={streakData}
              streak={streak}
              onClose={() => setView('picker')}
            />
          ) : (
            <>
              <GameLengthPicker onPick={setLength} />
              {streak >= 1 && (
                <p className={styles.streakSummary}>
                  🔥 {streak}-day streak · +1⚡ today
                </p>
              )}
              <GameButton
                onClick={() => setView('calendar')}
                variant="secondary"
              >
                Daily Streak
              </GameButton>
            </>
          )
        ) : (
          <BoardGame length={length} onChangeLength={() => setLength(null)} />
        )}
      </div>
    </>
  );
}
