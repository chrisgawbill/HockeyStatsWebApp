import { Link } from 'react-router-dom';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import FavoriteCard from '@/components/FavoriteCard';
import FavoriteTeamStar from '@/features/after-action-reports/components/FavoriteTeamStar';
import FavoriteRowSection from '@/components/FavoriteRowSection';
import TeamLogo from '@/components/TeamLogo';
import { localTeamList } from '@/lib/teamListData';
import { sortByFanTier } from '@/lib/favoriteCategory';
import type { FavoriteTeam } from '@/features/after-action-reports/types/afterActionReport';
import styles from '@/features/after-action-reports/components/FavoriteTeamsRow.module.css';

/** Returns the team's full name from the local team list, or its tri-code. */
function getTeamDisplayName(triCode: string): string {
  const team = localTeamList.find((entry) => entry.triCode === triCode);
  return team?.fullName ?? triCode;
}

/**
 * Shows one favorite team: its logo with the favorite star on the card's top
 * border, the team name, and the category badge. The card links to the team
 * page; the star opens the fan category menu instead.
 */
function FavoriteTeamCard({ team }: { team: FavoriteTeam }) {
  const teamName = getTeamDisplayName(team.triCode);
  return (
    <FavoriteCard
      picture={
        <span className={styles.logoFrame}>
          <TeamLogo triCode={team.triCode} className={styles.logo} />
          <FavoriteTeamStar
            team={team}
            teamName={teamName}
            className={styles.star}
          />
        </span>
      }
      name={teamName}
      category={team}
      linkTo={`/team/${team.triCode}`}
    />
  );
}

/**
 * Shows the signed-in user's favorite teams, Diehard first, as a
 * horizontally scrolling row on My Hockey. Renders nothing when signed out.
 */
export default function FavoriteTeamsRow() {
  const { isSignedIn, favorites } = useAfterActionReports();
  if (!isSignedIn) return null;

  return (
    <FavoriteRowSection
      titleId="favorite-teams-title"
      title="Your teams"
      emptyHint={
        <>
          Favorite a team from its page to pin it here.{' '}
          <Link to="/teamList">Browse teams</Link>
        </>
      }
      hasFavorites={favorites.length > 0}
    >
      {sortByFanTier(favorites).map((team) => (
        <FavoriteTeamCard key={team.triCode} team={team} />
      ))}
    </FavoriteRowSection>
  );
}
