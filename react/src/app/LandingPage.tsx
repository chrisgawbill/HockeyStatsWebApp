import LandingPageStandings from '@/features/standings/components/LandingPageStandings';
import StatLeadersSection from '@/features/stat-leaders/components/StatLeadersSection';
import PageHeader from '@/components/PageHeader';
import styles from '@/app/LandingPage.module.css';
import {
  useSkaterLeaderData,
  useGoalieLeaderData,
} from '@/features/stat-leaders/hooks/StatLeadersContext';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import DraftLotteryOddsRow from '@/features/draft-lottery/components/DraftLotteryOddsRow';
import UpNextStrip from '@/features/my-hockey/components/UpNextStrip';
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
  const {
    draftLotteryOdds: draftLotteryOddsData,
    loadingStandingsData,
    errorStandingsData,
    refetchStandings,
  } = useStandingsData();

  const loading =
    loadingSkaterLeaderData || loadingGoalieLeaderData || loadingStandingsData;
  // Skater and goalie leaders are fetched independently; a single provider
  // only reports an error once every category within it has failed, so
  // either one being non-null already means the stat-leaders API is down
  // rather than one category being empty.
  const statLeadersError = errorSkaterLeaderData ?? errorGoalieLeaderData;

  /**
   * Re-runs both stat-leader fetches together since this page renders a
   * single combined error for either failing. Standings usually fail in the
   * same outage, and their section would otherwise stay on its own error after
   * this retry succeeds, so a failed standings fetch is re-run too.
   */
  const retryStatLeaders = () => {
    retrySkaterLeaderData();
    retryGoalieLeaderData();
    if (errorStandingsData) refetchStandings();
  };

  return (
    <div className="ds-page-shell">
      <PageHeader />
      <main>
        <header className={styles['landingPage-intro']}>
          <div className={styles['landingPage-intro-copy']}>
            <p className={styles['landingPage-kicker']}>Season overview</p>
            <h1>{formatSeasonLabel(season)} at a glance</h1>
            <p>Track the teams, leaders, and stories shaping the season.</p>
          </div>
        </header>
        <UpNextStrip />
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
              <StatLeadersSection
                skaterLeaders={[
                  goalLeaderData,
                  assistLeaderData,
                  pointsLeaderData,
                  faceoffLeadersData,
                ]}
                goalieLeaders={[
                  winsLeaderData,
                  savePercentageLeaderData,
                  gaaLeaderData,
                  shutoutLeaderData,
                ]}
              />
              <DraftLotteryOddsRow
                title="Draft lottery"
                data={draftLotteryOddsData}
              />
            </section>
            <section className={styles['landingPage-standings-col']}>
              <LandingPageStandings />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
