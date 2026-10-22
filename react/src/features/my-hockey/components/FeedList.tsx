import type { ReactNode } from 'react';
import shared from '@/styles/shared.module.css';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/** The divided list on a surface that holds feed rows. */
export default function FeedList({ children }: { children: ReactNode }) {
  return <ul className={`${styles.list} ${shared.surface}`}>{children}</ul>;
}
