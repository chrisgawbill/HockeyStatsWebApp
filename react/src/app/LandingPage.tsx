import { Col, Container, Row } from 'react-bootstrap';
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
import SeasonSelector from '@/components/SeasonSelector';

/**
 * Home route. Composes skater leaders, goalie leaders, draft-lottery odds, and
 * standings from their shared contexts; shows a single loading state until all of
 * them are ready. `?season=` (via SeasonSelector) drives every section.
 */
export default function LandingPage() {
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
    <Container fluid className="ds-page-shell">
      <PageHeader />
      <SeasonSelector />
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
        <Row className={styles['landingPage-content']}>
          <Col lg={7}>
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
          </Col>
          <Col lg={5}>
            <LandingPageStandings />
          </Col>
        </Row>
      )}
    </Container>
  );
}
