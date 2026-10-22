import { Link } from 'react-router-dom';
import styles from '@/components/SectionHeading.module.css';

export interface SectionHeadingProps {
  /** Ties the heading to its section's `aria-labelledby`. */
  id: string;
  title: string;
  /** Optional link at the right, such as "See all". */
  link?: { label: string; to: string };
}

/** A small section title, with an optional link on the same line. */
export default function SectionHeading({
  id,
  title,
  link,
}: SectionHeadingProps) {
  return (
    <div className={styles.row}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {link && (
        <Link to={link.to} className={styles.link}>
          {link.label}
        </Link>
      )}
    </div>
  );
}
