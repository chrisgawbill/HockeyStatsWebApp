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
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import { useLeague } from '@/features/league/hooks/LeagueContext';

/**
 * Home route. Composes skater leaders, goalie leaders, draft-lottery odds, and
 * standings from their shared contexts. The intro and Up next strip render at
 * once; each data section shows its own loading state and its own error with
 * Try again, so one slow or failed call never hides the rest. The global nav
 * league toggle and season selector drive every section; the AHL view leaves
 * out the NHL-only draft lottery and favorites' Up next strip.
 */
export default function LandingPage() {
  const { season } = useSeason();
  const { league } = useLeague();
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
        {/* Favorites and the draft lottery are NHL only for now. */}
        {league === 'nhl' && <UpNextStrip />}
        <div className={`${styles['landingPage-content']} ds-grid`}>
          <section>
            <StatLeadersSection
              skaters={{
                categoryLeaders: [
                  goalLeaderData,
                  assistLeaderData,
                  pointsLeaderData,
                  faceoffLeadersData,
                ],
                loading: loadingSkaterLeaderData,
                error: errorSkaterLeaderData,
                retry: retrySkaterLeaderData,
              }}
              goalies={{
                categoryLeaders: [
                  winsLeaderData,
                  savePercentageLeaderData,
                  gaaLeaderData,
                  shutoutLeaderData,
                ],
                loading: loadingGoalieLeaderData,
                error: errorGoalieLeaderData,
                retry: retryGoalieLeaderData,
              }}
            />
            {league === 'nhl' && (
              <DraftLotteryOddsRow
                title="Draft lottery"
                data={draftLotteryOddsData}
                loading={loadingStandingsData}
                error={errorStandingsData}
                onRetry={refetchStandings}
              />
            )}
          </section>
          <section className={styles['landingPage-standings-col']}>
            <LandingPageStandings />
          </section>
        </div>
      </main>
    </div>
  );
}
