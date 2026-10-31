import type { ReactNode } from 'react';
import PageHeader from '@/components/PageHeader';
import PageIntro from '@/components/PageIntro';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import FavoriteTeamsRow from '@/features/after-action-reports/components/FavoriteTeamsRow';
import FavoritePlayersRow from '@/features/favorite-players/components/FavoritePlayersRow';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import { useFeedFavorites } from '@/features/my-hockey/hooks/useFeedFavorites';
import { useMyHockeyData } from '@/features/my-hockey/hooks/useMyHockeyData';
import { buildMyHockeyFeed } from '@/features/my-hockey/utils/feedSelection';
import type { MyHockeyFeed } from '@/features/my-hockey/types/myHockey';
import FeedSection from '@/features/my-hockey/components/FeedSection';
import UpNextRow from '@/features/my-hockey/components/UpNextRow';
import LastResultRow from '@/features/my-hockey/components/LastResultRow';
import FeedPlayerLines from '@/features/my-hockey/components/FeedPlayerLines';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/** Up next and Last results for the favorite teams, from the loaded feed. */
function GameSections({ feed, now }: { feed: MyHockeyFeed; now: Date }) {
  const { reports, markRead } = useAfterActionReports();
  const findReport = (gameId: number) =>
    reports.find((report) => report.gameId === gameId) ?? null;

  return (
    <div className={styles.sections}>
      <FeedSection
        title="Up next"
        className={styles.upNext}
        emptyText="No upcoming games."
      >
        {feed.upNext.map((item) => (
          <UpNextRow key={item.game.gameId} item={item} now={now} />
        ))}
      </FeedSection>
      <FeedSection
        title="Last results"
        className={styles.lastResults}
        emptyText="No results yet this season."
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
    </div>
  );
}

/**
 * `/my-hockey`: the signed-in user's favorite teams and players at the top
 * (players with their season and last game once loaded), then the teams' next
 * games and last results. Signed out it shows a sign-in prompt and makes no
 * private calls.
 */
export default function MyHockeyPage() {
  const { isSignedIn, teams, players } = useFeedFavorites();
  const dataLoad = useMyHockeyData(
    isSignedIn && (teams.length > 0 || players.length > 0),
    teams.map((team) => team.triCode),
    players,
  );
  const feed =
    dataLoad.status === 'ready'
      ? buildMyHockeyFeed(teams, players, dataLoad.data, dataLoad.loadedAt)
      : null;
  const now = dataLoad.status === 'ready' ? new Date(dataLoad.loadedAt) : null;

  const renderPlayerLines = (player: FavoritePlayer) => {
    // The feed holds NHL players only; an AHL id can match an NHL one.
    const item =
      player.league === 'nhl'
        ? feed?.players.find(
            (entry) => entry.player.playerId === player.playerId,
          )
        : undefined;
    return item ? <FeedPlayerLines item={item} /> : null;
  };

  let gameContent: ReactNode = null;
  if (teams.length > 0) {
    gameContent =
      feed && now ? (
        <GameSections feed={feed} now={now} />
      ) : (
        <LoadingState label="Loading games" />
      );
  }

  return (
    <div className="ds-page-shell">
      <PageHeader />
      <main className={`${styles.page} ds-container`}>
        <PageIntro kicker="My Hockey" title="Your teams and players" />
        {isSignedIn ? (
          <>
            <FavoriteTeamsRow />
            <FavoritePlayersRow renderCardFooter={renderPlayerLines} />
            {gameContent}
          </>
        ) : (
          <EmptyState
            title="Sign in to see your feed"
            message="Sign in with Google at the top of the page to see your favorite teams' games and how your players are doing."
          />
        )}
      </main>
    </div>
  );
}
