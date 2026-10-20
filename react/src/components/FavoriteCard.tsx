import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getCategoryBadgeText,
  type FavoriteCategory,
} from '@/lib/favoriteCategory';
import styles from '@/components/FavoriteRow.module.css';

export interface FavoriteCardProps {
  /** Picture centred on the card's top border (headshot or logo). */
  picture: ReactNode;
  name: string;
  /** Second line, such as "EDM · C"; omitted when empty. */
  detail?: string;
  category: FavoriteCategory;
  /** Where the card body links to; the card is not a link without it. */
  linkTo?: string;
}

/**
 * Vertical favorite card: the picture straddles the top border, then the name,
 * an optional detail line, and the category badge (label if set, else tier).
 * Controls inside `picture` (the star) stay clickable above the card's link.
 */
export default function FavoriteCard({
  picture,
  name,
  detail,
  category,
  linkTo,
}: FavoriteCardProps) {
  const cardText = (
    <>
      <span className={styles.name}>{name}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
      <span className={styles.badge} data-tier={category.tier}>
        {getCategoryBadgeText(category)}
      </span>
    </>
  );

  return (
    <li className={styles.card}>
      <div className={styles.picture}>{picture}</div>
      {linkTo ? (
        <Link to={linkTo} className={`${styles.body} ${styles.link}`}>
          {cardText}
        </Link>
      ) : (
        <div className={styles.body}>{cardText}</div>
      )}
    </li>
  );
}
