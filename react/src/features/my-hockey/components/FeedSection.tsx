import type { ReactNode } from 'react';
import FeedList from '@/features/my-hockey/components/FeedList';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

export interface FeedSectionProps {
  title: string;
  className: string;
  /** Shown instead of the list when it is empty. */
  emptyText: ReactNode;
  children: ReactNode[];
}

/** A titled feed section: its rows in a `FeedList`, or one line when empty. */
export default function FeedSection({
  title,
  className,
  emptyText,
  children,
}: FeedSectionProps) {
  const titleId = `my-hockey-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section className={className} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.sectionTitle}>
        {title}
      </h2>
      {children.length > 0 ? (
        <FeedList>{children}</FeedList>
      ) : (
        <p className={styles.hint}>{emptyText}</p>
      )}
    </section>
  );
}
