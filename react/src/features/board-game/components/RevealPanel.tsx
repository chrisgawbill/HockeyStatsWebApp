import type { GameState } from '@/features/board-game/types/game';
import { CARDS } from '@/features/board-game/data/cards';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import CardView from '@/features/board-game/components/CardView';
import styles from '@/features/board-game/components/RevealPanel.module.css';

/** The non-null shape of `GameState.lastReveal`. */
export type Reveal = NonNullable<GameState['lastReveal']>;

export interface RevealPanelProps {
  reveal: Reveal;
}

/** Simultaneous-reveal result for one duel round: both hands face-up plus damage/block. Dumb, read-only. */
export default function RevealPanel({ reveal }: RevealPanelProps) {
  return (
    <div className={styles.panel} role="status">
      <p className={styles.title}>Round {reveal.round} reveal</p>
      <div className={styles.sides}>
        <div className={styles.side}>
          <span className={styles.sideLabel}>{TEAM_NAME.user}</span>
          <div className={styles.cards}>
            {reveal.userCards.map((id, i) => (
              <CardView key={`${id}-${i}`} card={CARDS[id]} compact />
            ))}
          </div>
        </div>
        <div className={styles.side}>
          <span className={styles.sideLabel}>{TEAM_NAME.cpu}</span>
          <div className={styles.cards}>
            {reveal.cpuCards.map((id, i) => (
              <CardView key={`${id}-${i}`} card={CARDS[id]} compact />
            ))}
          </div>
        </div>
      </div>
      <p className={styles.summary}>
        You dealt {reveal.userDamageDealt} ({TEAM_NAME.cpu} blocked{' '}
        {reveal.cpuBlock}) · {TEAM_NAME.cpu} dealt {reveal.cpuDamageDealt} (you
        blocked {reveal.userBlock})
      </p>
    </div>
  );
}
