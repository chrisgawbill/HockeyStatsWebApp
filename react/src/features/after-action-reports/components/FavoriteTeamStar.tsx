import { useRef, useState } from 'react';
import FavoriteCategoryMenu from '@/components/FavoriteCategoryMenu';
import FavoriteStarIcon from '@/components/FavoriteStarIcon';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import type { FavoriteTeam } from '@/features/after-action-reports/types/afterActionReport';
import styles from '@/components/FavoriteStar.module.css';

export interface FavoriteTeamStarProps {
  team: FavoriteTeam;
  teamName: string;
  className?: string;
}

/**
 * Small round star on a favorite team's home card. It opens the fan category
 * menu (tier, label, Unfavorite), matching the star on favorite player cards.
 */
export default function FavoriteTeamStar({
  team,
  teamName,
  className,
}: FavoriteTeamStarProps) {
  const { toggleFavorite, updateTeamCategory } = useAfterActionReports();
  const starRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <button
        ref={starRef}
        type="button"
        className={[styles.star, styles.sm, className]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        aria-pressed
        aria-haspopup="dialog"
        aria-expanded={isMenuOpen}
        aria-label={`Fan category and options for ${teamName}`}
        title={`Fan category for ${teamName}`}
      >
        <FavoriteStarIcon filled />
      </button>
      {isMenuOpen && (
        <FavoriteCategoryMenu
          itemName={teamName}
          category={team}
          anchorRef={starRef}
          onSave={(category) =>
            updateTeamCategory(team.triCode, team.league, category)
          }
          onUnfavorite={() => toggleFavorite(team.triCode, team.league)}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
