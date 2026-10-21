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
  /** Fan category badge; leave out for stat cards. */
  category?: FavoriteCategory;
  /** Stat variant: category name above the name, big value in the badge's place. */
  stat?: { label: string; value: string | number };
  /** Fills its grid cell instead of the fixed row width. */
  fillWidth?: boolean;
  /** Where the card body links to. */
  linkTo?: string;
  /** Called when the card body is pressed, for cards that open a dialog instead of a page. */
  onSelect?: () => void;
}

/**
 * Vertical favorite card: the picture straddles the top border, then the name,
 * an optional detail line, and the category badge (label if set, else tier);
 * a stat card shows its category name and value above the name instead.
 * The body is a link (`linkTo`), a button (`onSelect`), or plain text.
 * Controls inside `picture` (the star) stay clickable above the card body.
 */
export default function FavoriteCard({
  picture,
  name,
  detail,
  category,
  stat,
  fillWidth = false,
  linkTo,
  onSelect,
}: FavoriteCardProps) {
  const cardText = (
    <>
      {stat && <span className={styles.statLabel}>{stat.label}</span>}
      {stat && <span className={styles.statValue}>{stat.value}</span>}
      <span className={styles.name}>{name}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
      {category && (
        <span className={styles.badge} data-tier={category.tier}>
          {getCategoryBadgeText(category)}
        </span>
      )}
    </>
  );

  return (
    <li className={`${styles.card} ${fillWidth ? styles.cardFill : ''}`}>
      <div className={styles.picture}>{picture}</div>
      {linkTo ? (
        <Link to={linkTo} className={`${styles.body} ${styles.link}`}>
          {cardText}
        </Link>
      ) : onSelect ? (
        <button
          type="button"
          className={`${styles.body} ${styles.link} ${styles.button}`}
          onClick={onSelect}
          aria-haspopup="dialog"
        >
          {cardText}
        </button>
      ) : (
        <div className={styles.body}>{cardText}</div>
      )}
    </li>
  );
}
