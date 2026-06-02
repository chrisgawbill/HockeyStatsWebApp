import { Col, Container, Row } from "react-bootstrap";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings/LandingPageStandings";
import React from "react";
import PlayerStatLeaderRow from "../Components/LandingPage/PlayerStatLeaderRow";
import PageHeader from "../Components/PageHeader";
import styles from "../style/LandingPage/LandingPage.module.css";
import { useSkaterLeaderData } from "../Data/Context/SkaterStatLeadersContext";
import { useGoalieLeaderData } from "../Data/Context/GoalieStatLeadersContext";
import { useDraftLotteryOddsData } from "../Data/Context/StandingsContext";
import DraftLotteryOddsRow from "../Components/LandingPage/DraftLotteryOddsRow";
import LoadingState from "../Components/LoadingState";
import SeasonSelector from "../Components/SeasonSelector";

/**
 * Home route. Composes skater leaders, goalie leaders, draft-lottery odds, and
 * standings from their shared contexts; shows a single loading state until all of
 * them are ready. `?season=` (via SeasonSelector) drives every section.
 */
export default function LandingPage() {
  const { goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData, loadingSkaterLeaderData } = useSkaterLeaderData();
  const { winsLeaderData, savePercentageLeaderData, gaaLeaderData, shutoutLeaderData, loadingGoalieLeaderData } = useGoalieLeaderData();
  const draftLotteryOddsData = useDraftLotteryOddsData();

  const loading = loadingSkaterLeaderData || loadingGoalieLeaderData || !draftLotteryOddsData;

  return (
    <Container fluid>
      <PageHeader />
      <SeasonSelector />
      {loading ? (
        <LoadingState label="Loading data" fullPage />
      ) : (
        <Row className={styles["landingPage-content"]}>
          <Col lg={7}>
            <PlayerStatLeaderRow
              title="Skater Stat Leaders"
              topStatLeaders={[goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData]}
            />
            <PlayerStatLeaderRow
              title="Goalie Stat Leaders"
              topStatLeaders={[winsLeaderData, savePercentageLeaderData, gaaLeaderData, shutoutLeaderData]}
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
