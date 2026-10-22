import {
  getCategoryBadgeText,
  type FavoriteCategory,
} from '@/lib/favoriteCategory';
import styles from '@/components/FanCategoryBadge.module.css';

export interface FanCategoryBadgeProps {
  category: FavoriteCategory;
  /** `md` for favorite cards, `sm` beside a name in a list row. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Pill showing a favorite's fan category: its custom label if set, else the
 * tier name. Diehard gets a tinted background; Curious muted text.
 */
export default function FanCategoryBadge({
  category,
  size = 'md',
  className,
}: FanCategoryBadgeProps) {
  return (
    <span
      className={[styles.badge, styles[size], className]
        .filter(Boolean)
        .join(' ')}
      data-tier={category.tier}
    >
      {getCategoryBadgeText(category)}
    </span>
  );
}
