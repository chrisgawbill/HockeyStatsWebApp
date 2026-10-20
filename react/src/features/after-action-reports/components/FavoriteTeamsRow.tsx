import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import FavoriteCard from '@/components/FavoriteCard';
import FavoriteRowSection from '@/components/FavoriteRowSection';
import { localTeamList } from '@/lib/teamListData';
import { sortByFanTier } from '@/lib/favoriteCategory';
import { useTheme } from '@/lib/ThemeContext';
import type { Theme } from '@/lib/themeSchedule';
import type { FavoriteTeam } from '@/features/after-action-reports/types/afterActionReport';
import styles from '@/features/after-action-reports/components/FavoriteTeamsRow.module.css';

/** Returns the team's full name from the local team list, or its tri-code. */
function getTeamDisplayName(triCode: string): string {
  const team = localTeamList.find((entry) => entry.triCode === triCode);
  return team?.fullName ?? triCode;
}

/** Returns the NHL logo drawn for the current theme's background. */
function getTeamLogoUrl(triCode: string, theme: Theme): string {
  const logoVariant = theme === 'dark' ? 'dark' : 'light';
  return `https://assets.nhle.com/logos/nhl/svg/${triCode}_${logoVariant}.svg`;
}

/**
 * Shows one favorite team: its logo on the card's top border, the team name,
 * and the category badge. The card links to the team page.
 */
function FavoriteTeamCard({ team }: { team: FavoriteTeam }) {
  const { theme } = useTheme();
  return (
    <FavoriteCard
      picture={
        <img
          className={styles.logo}
          src={getTeamLogoUrl(team.triCode, theme)}
          alt=""
        />
      }
      name={getTeamDisplayName(team.triCode)}
      category={team}
      linkTo={`/team/${team.triCode}`}
    />
  );
}

/**
 * Shows the signed-in user's favorite teams, Diehard first, as a
 * horizontally scrolling row on the landing page. Renders nothing when signed
 * out.
 */
export default function FavoriteTeamsRow() {
  const { isSignedIn, favorites } = useAfterActionReports();
  if (!isSignedIn) return null;

  return (
    <FavoriteRowSection
      titleId="favorite-teams-title"
      title="Your teams"
      emptyHint="Favorite a team from its page to pin it here."
      hasFavorites={favorites.length > 0}
    >
      {sortByFanTier(favorites).map((team) => (
        <FavoriteTeamCard key={team.triCode} team={team} />
      ))}
    </FavoriteRowSection>
  );
}
