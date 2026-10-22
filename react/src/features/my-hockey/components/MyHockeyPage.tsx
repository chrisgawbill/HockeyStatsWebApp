import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import PageIntro from '@/components/PageIntro';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import { useFeedFavorites } from '@/features/my-hockey/hooks/useFeedFavorites';
import { useMyHockeyData } from '@/features/my-hockey/hooks/useMyHockeyData';
import { buildMyHockeyFeed } from '@/features/my-hockey/utils/feedSelection';
import type { MyHockeyFeed } from '@/features/my-hockey/types/myHockey';
import FeedSection from '@/features/my-hockey/components/FeedSection';
import UpNextRow from '@/features/my-hockey/components/UpNextRow';
import LastResultRow from '@/features/my-hockey/components/LastResultRow';
import FeedPlayerRow from '@/features/my-hockey/components/FeedPlayerRow';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/** Up next, Last results and Your players, built from the loaded data. */
function FeedSections({
  feed,
  hasTeams,
  now,
}: {
  feed: MyHockeyFeed;
  hasTeams: boolean;
  now: Date;
}) {
  const { reports, markRead } = useAfterActionReports();
  const findReport = (gameId: number) =>
    reports.find((report) => report.gameId === gameId) ?? null;
  const favoriteTeamHint = (
    <>
      Favorite a team from its page to follow its games.{' '}
      <Link to="/teamList">Browse teams</Link>
    </>
  );

  return (
    <div className={styles.sections}>
      <FeedSection
        title="Up next"
        className={styles.upNext}
        emptyText={hasTeams ? 'No upcoming games.' : favoriteTeamHint}
      >
        {feed.upNext.map((item) => (
          <UpNextRow key={item.game.gameId} item={item} now={now} />
        ))}
      </FeedSection>
      <FeedSection
        title="Last results"
        className={styles.lastResults}
        emptyText={hasTeams ? 'No results yet this season.' : favoriteTeamHint}
      >
        {feed.lastResults.map((item) => (
          <LastResultRow
            key={item.game.gameId}
            item={item}
            report={findReport(item.game.gameId)}
            onOpenReport={markRead}
          />
        ))}
      </FeedSection>
      <FeedSection
        title="Your players"
        className={styles.players}
        emptyText={
          <>
            Star players on the <Link to="/">stat leaders</Link> or a team page
            to follow them here.
          </>
        }
      >
        {feed.players.map((item) => (
          <FeedPlayerRow key={item.player.playerId} item={item} />
        ))}
      </FeedSection>
    </div>
  );
}

/**
 * `/my-hockey`: the signed-in user's favorite teams' next games and last
 * results, and how their favorite players are doing. Signed out it shows a
 * sign-in prompt and makes no private calls.
 */
export default function MyHockeyPage() {
  const { isSignedIn, teams, players } = useFeedFavorites();
  const hasFavorites = teams.length > 0 || players.length > 0;
  const dataLoad = useMyHockeyData(
    isSignedIn && hasFavorites,
    teams.map((team) => team.triCode),
    players,
  );

  let content: ReactNode;
  if (!isSignedIn) {
    content = (
      <EmptyState
        title="Sign in to see your feed"
        message="Sign in with Google at the top of the page to see your favorite teams' games and how your players are doing."
      />
    );
  } else if (!hasFavorites) {
    content = (
      <p className={styles.hint}>
        Nothing to follow yet. Favorite a team from its page on the{' '}
        <Link to="/teamList">team list</Link>, or star players on the{' '}
        <Link to="/">stat leaders</Link>.
      </p>
    );
  } else if (dataLoad.status !== 'ready') {
    content = <LoadingState label="Loading My Hockey" />;
  } else {
    content = (
      <FeedSections
        feed={buildMyHockeyFeed(
          teams,
          players,
          dataLoad.data,
          dataLoad.loadedAt,
        )}
        hasTeams={teams.length > 0}
        now={new Date(dataLoad.loadedAt)}
      />
    );
  }

  return (
    <>
      <PageHeader />
      <main className={`${styles.page} ds-page-shell ds-container`}>
        <PageIntro kicker="My Hockey" title="Your teams and players" />
        {content}
      </main>
    </>
  );
}
