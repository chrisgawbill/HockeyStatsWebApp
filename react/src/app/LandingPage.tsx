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
  } = useSkaterLeaderData();
  const {
    winsLeaderData,
    savePercentageLeaderData,
    gaaLeaderData,
    shutoutLeaderData,
    loadingGoalieLeaderData,
  } = useGoalieLeaderData();
  const draftLotteryOddsData = useDraftLotteryOddsData();

  const loading =
    loadingSkaterLeaderData || loadingGoalieLeaderData || !draftLotteryOddsData;

  return (
    <Container fluid>
      <PageHeader />
      <SeasonSelector />
      {loading ? (
        <LoadingState label="Loading data" fullPage />
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
