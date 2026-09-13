import { useId } from 'react';
import type {
  CardBlockReason,
  CardDef,
  Role,
} from '@/features/board-game/types/game';
import { cardBlockReasonLabel } from '@/features/board-game/utils/cardBlockReasonLabel';
import { cardPerkBadge, cardText } from '@/features/board-game/utils/cardText';
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
  /** Acting skater's role; when given, shows perk-adjusted numbers and a bonus badge. Omit to render `card.text` unchanged. */
  role?: Role;
  /** Tooltip shown when disabled and there's no blockReason (e.g. a queued card that can't be pulled back). Ignored if blockReason is set. */
  title?: string;
}

/** Border colour class per card tag; cards carry exactly one tag. */
const TAG_CLASS: Record<string, string> = {
  block: styles.tagBlock,
  check: styles.tagCheck,
  shot: styles.tagShot,
  skill: styles.tagSkill,
};

/** One card: a cost+name header row, then text and tags. Dims and disables when unplayable. */
export default function CardView({
  card,
  disabled = false,
  onClick,
  compact = false,
  blockReason = null,
  energy = 0,
  role,
  title,
}: CardViewProps) {
  const reasonId = useId();
  const tagClass = TAG_CLASS[card.tags[0]] ?? '';
  const className = [
    styles.card,
    tagClass,
    compact ? styles.compact : '',
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  const displayText = cardText(card, role);
  const perkBadge = cardPerkBadge(card, role);

  if (compact) {
    return (
      <div className={className} aria-disabled="true">
        <span className={styles.header}>
          <span className={styles.cost}>{card.cost}</span>
          <span className={styles.name}>{card.name}</span>
        </span>
        <span className={styles.text}>{displayText}</span>
        {perkBadge && <span className={styles.perkBadge}>{perkBadge}</span>}
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
      title={reasonLabel ?? title}
    >
      <span className={styles.header}>
        <span className={styles.cost}>{card.cost}</span>
        <span className={styles.name}>{card.name}</span>
      </span>
      <span className={styles.text}>{displayText}</span>
      {perkBadge && <span className={styles.perkBadge}>{perkBadge}</span>}
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
