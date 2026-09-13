import type { ReactNode } from 'react';
import GameButton from '@/features/board-game/components/GameButton';
import styles from '@/features/board-game/components/DuelResultBanner.module.css';

export interface DuelResultBannerProps {
  summary: string;
  onContinue: () => void;
  /** Optional content shown between the summary and the Continue button (e.g. RevealPanel). */
  children?: ReactNode;
}

/** Shows the duel outcome summary with a Continue action. Dumb: props in, callback out. */
export default function DuelResultBanner({
  summary,
  onContinue,
  children,
}: DuelResultBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <p className={styles.summary}>{summary}</p>
      {children}
      <GameButton onClick={onContinue} variant="primary">
        Continue
      </GameButton>
    </div>
  );
}
