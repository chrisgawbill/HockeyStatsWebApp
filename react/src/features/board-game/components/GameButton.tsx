import { forwardRef, type ReactNode } from 'react';
import styles from '@/features/board-game/components/GameButton.module.css';

export interface GameButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  ariaLabel?: string;
  /** Smaller secondary line shown under the label (e.g. GameLengthPicker's options). */
  subLabel?: string;
}

/** Shared pill button for board-game controls (dice roll, HUD actions, duel actions). */
const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  function GameButton(
    {
      children,
      onClick,
      disabled = false,
      variant = 'secondary',
      ariaLabel,
      subLabel,
    },
    ref,
  ) {
    const className = [
      styles.button,
      variant === 'primary' ? styles.primary : styles.secondary,
      subLabel ? styles.stacked : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        ref={ref}
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        <span className={styles.label}>{children}</span>
        {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
      </button>
    );
  },
);

export default GameButton;
