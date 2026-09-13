import styles from '@/features/board-game/components/PuckToken.module.css';

export interface PuckTokenProps {
  /** True for a loose puck on the ice (scaled to ~45% of its tile and pulses); false for the carrier's badge (fills its own, already-sized container). */
  loose: boolean;
}

/** Round token representing the puck: a black disc with a high-contrast ring. */
export default function PuckToken({ loose }: PuckTokenProps) {
  const className = [
    styles.puck,
    loose ? styles.loose : styles.carried,
    loose ? styles.pulse : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={className} aria-hidden="true" />;
}
