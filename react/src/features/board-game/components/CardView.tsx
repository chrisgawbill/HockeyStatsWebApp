import { useId } from 'react';
import type {
  CardBlockReason,
  CardDef,
} from '@/features/board-game/types/game';
import { cardBlockReasonLabel } from '@/features/board-game/utils/cardBlockReasonLabel';
import styles from '@/features/board-game/components/CardView.module.css';

export interface CardViewProps {
  card: CardDef;
  disabled?: boolean;
  onClick?: () => void;
  /** Renders a smaller, non-interactive, tag-less card (e.g. RevealPanel's face-up hands). */
  compact?: boolean;
  /** Why this card can't be played right now; shown as a one-line reason instead of the tags row. */
  blockReason?: CardBlockReason | null;
  /** Current energy, used by the 'energy' blockReason's text. */
  energy?: number;
}

/** One card: cost, name, text, tags. Dims and disables when unplayable. */
export default function CardView({
  card,
  disabled = false,
  onClick,
  compact = false,
  blockReason = null,
  energy = 0,
}: CardViewProps) {
  const reasonId = useId();
  const className = [
    styles.card,
    compact ? styles.compact : '',
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (compact) {
    return (
      <div className={className} aria-disabled="true">
        <span className={styles.cost}>{card.cost}</span>
        <span className={styles.name}>{card.name}</span>
        <span className={styles.text}>{card.text}</span>
      </div>
    );
  }

  const reasonLabel = blockReason
    ? cardBlockReasonLabel(blockReason, card, energy)
    : null;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-describedby={reasonLabel ? reasonId : undefined}
      title={reasonLabel ?? undefined}
    >
      <span className={styles.cost}>{card.cost}</span>
      <span className={styles.name}>{card.name}</span>
      <span className={styles.text}>{card.text}</span>
      {reasonLabel ? (
        <span id={reasonId} className={styles.blockReason}>
          {reasonLabel}
        </span>
      ) : (
        <span className={styles.tags}>{card.tags.join(', ')}</span>
      )}
    </button>
  );
}
