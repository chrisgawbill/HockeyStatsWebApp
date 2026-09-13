import type { ReactNode } from 'react';
import styles from '@/features/board-game/components/ModalOverlay.module.css';

export interface ModalOverlayProps {
  children: ReactNode;
}

/** Fixed, centered, dimmed backdrop shared by full-screen modals (DuelScreen, GameOverModal). */
export default function ModalOverlay({ children }: ModalOverlayProps) {
  return <div className={styles.overlay}>{children}</div>;
}
