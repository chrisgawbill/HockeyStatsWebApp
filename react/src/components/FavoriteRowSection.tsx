import type { ReactNode } from 'react';
import styles from '@/components/FavoriteRow.module.css';

export interface FavoriteRowSectionProps {
  /** Unique per section, ties the heading to the region. */
  titleId: string;
  title: string;
  /** Shown instead of the cards when the user has no favorites. */
  emptyHint: string;
  hasFavorites: boolean;
  /** The `FavoriteCard` items. */
  children: ReactNode;
}

/**
 * A titled home-page section holding a horizontally scrolling row of favorite
 * cards, or a hint line when there are none. The row's top padding leaves room
 * for the picture that overhangs each card's top edge.
 */
export default function FavoriteRowSection({
  titleId,
  title,
  emptyHint,
  hasFavorites,
  children,
}: FavoriteRowSectionProps) {
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {hasFavorites ? (
        <ul className={styles.row}>{children}</ul>
      ) : (
        <p className={styles.hint}>{emptyHint}</p>
      )}
    </section>
  );
}
