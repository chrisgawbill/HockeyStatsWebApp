import styles from '@/features/board-game/components/CardBack.module.css';

/** Face-down card back: a small token-styled pixel pattern. Purely decorative. */
export default function CardBack() {
  return <div className={styles.back} aria-hidden="true" />;
}
