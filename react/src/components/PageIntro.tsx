import type { ReactNode } from 'react';
import styles from '@/components/PageIntro.module.css';

export interface PageIntroProps {
  /** Small uppercase line above the title, naming the page. */
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
}

/** A page's opening header: kicker, the page's h1, and an optional line under it. */
export default function PageIntro({
  kicker,
  title,
  description,
}: PageIntroProps) {
  return (
    <header className={styles.header}>
      <p className={styles.kicker}>{kicker}</p>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  );
}
