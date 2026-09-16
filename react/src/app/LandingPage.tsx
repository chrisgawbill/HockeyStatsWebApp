import LandingPageStandings from '@/features/standings/components/LandingPageStandings';
import PlayerStatLeaderRow from '@/features/stat-leaders/components/PlayerStatLeaderRow';
import PageHeader from '@/components/PageHeader';
import styles from '@/app/LandingPage.module.css';
import {
  useSkaterLeaderData,
  useGoalieLeaderData,
} from '@/features/stat-leaders/hooks/StatLeadersContext';
import { useDraftLotteryOddsData } from '@/features/standings/hooks/StandingsContext';
import DraftLotteryOddsRow from '@/features/draft-lottery/components/DraftLotteryOddsRow';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';

/**
 * Home route. Composes skater leaders, goalie leaders, draft-lottery odds, and
 * standings from their shared contexts; shows a single loading state until all of
 * them are ready. The global nav season selector drives every section.
 */
export default function LandingPage() {
  const { season } = useSeason();
  const {
    goalLeaderData,
    assistLeaderData,
    pointsLeaderData,
    faceoffLeadersData,
    loadingSkaterLeaderData,
    errorSkaterLeaderData,
    retrySkaterLeaderData,
  } = useSkaterLeaderData();
  const {
    winsLeaderData,
    savePercentageLeaderData,
    gaaLeaderData,
    shutoutLeaderData,
    loadingGoalieLeaderData,
    errorGoalieLeaderData,
    retryGoalieLeaderData,
  } = useGoalieLeaderData();
  const draftLotteryOddsData = useDraftLotteryOddsData();

  const loading =
    loadingSkaterLeaderData || loadingGoalieLeaderData || !draftLotteryOddsData;
  // Skater and goalie leaders are fetched independently; a single provider
  // only reports an error once every category within it has failed, so
  // either one being non-null already means the stat-leaders API is down
  // rather than one category being empty.
  const statLeadersError = errorSkaterLeaderData ?? errorGoalieLeaderData;

  /**
   * Re-runs both stat-leader fetches together since this page renders a
   * single combined error for either failing.
   */
  const retryStatLeaders = () => {
    retrySkaterLeaderData();
    retryGoalieLeaderData();
  };

  return (
    <main className="ds-page-shell ds-container">
      <PageHeader />
      <header className={styles['landingPage-intro']}>
        <div className={styles['landingPage-intro-copy']}>
          <p className={styles['landingPage-kicker']}>Season overview</p>
          <h1>{formatSeasonLabel(season)} at a glance</h1>
          <p>Track the teams, leaders, and stories shaping the season.</p>
        </div>
      </header>
      {loading ? (
        <LoadingState label="Loading data" fullPage />
      ) : statLeadersError ? (
        <ErrorState
          fullPage
          title="Couldn't load stat leaders"
          message={statLeadersError}
          onRetry={retryStatLeaders}
        />
      ) : (
        <div className={`${styles['landingPage-content']} ds-grid`}>
          <section>
            <PlayerStatLeaderRow
              title="Skater Stat Leaders"
              topStatLeaders={[
                goalLeaderData,
                assistLeaderData,
                pointsLeaderData,
                faceoffLeadersData,
              ]}
            />
            <PlayerStatLeaderRow
              title="Goalie Stat Leaders"
              topStatLeaders={[
                winsLeaderData,
                savePercentageLeaderData,
                gaaLeaderData,
                shutoutLeaderData,
              ]}
            />
            <DraftLotteryOddsRow
              title="Draft Lottery Odds"
              data={draftLotteryOddsData}
            />
          </section>
          <section>
            <LandingPageStandings />
          </section>
        </div>
      )}
    </main>
  );
}
