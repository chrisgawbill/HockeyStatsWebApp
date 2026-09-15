import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import type { GameLength } from '@/features/board-game/types/game';
import {
  currentStreak,
  loadStreak,
} from '@/features/board-game/data/dailyStreak';
import { useGoogleAuthSession } from '@/features/board-game/hooks/useGoogleAuthSession';
import GameLengthPicker from '@/features/board-game/components/GameLengthPicker';
import GameButton from '@/features/board-game/components/GameButton';
import GoogleSignInButton from '@/features/board-game/components/GoogleSignInButton';
import GoogleAvatarBadge from '@/features/board-game/components/GoogleAvatarBadge';
import StreakCalendar from '@/features/board-game/components/StreakCalendar';
import BoardGame from '@/features/board-game/components/BoardGame';
import styles from '@/features/board-game/components/BoardGamePage.module.css';

type PreGameView = 'picker' | 'calendar';

/** Rink Quest board game page: picks a game length, then hands the match off to BoardGame. */
export default function BoardGamePage() {
  const [length, setLength] = useState<GameLength | null>(null);
  const [view, setView] = useState<PreGameView>('picker');
  const auth = useGoogleAuthSession();

  // useBoardGame() is only mounted once a length is picked (inside BoardGame), so the
  // pre-game screen reads the streak directly rather than restructuring that hook's scope.
  // Also picks up a sign-in's server-merged result: loadStreak() re-reads localStorage on
  // every render, and signing in triggers a re-render via the auth hook's own state.
  const streakData = loadStreak();
  const streak = currentStreak(streakData);

  return (
    <>
      <PageHeader
        corner={
          auth.email ? (
            <GoogleAvatarBadge
              email={auth.email}
              picture={auth.picture}
              onSignOut={auth.signOut}
            />
          ) : undefined
        }
      />
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
              {!auth.email && (
                <div className={styles.authRow}>
                  <GoogleSignInButton onCredential={auth.signIn} />
                </div>
              )}
            </>
          )
        ) : (
          <BoardGame
            length={length}
            onChangeLength={() => setLength(null)}
            authToken={auth.token}
          />
        )}
      </div>
    </>
  );
}
