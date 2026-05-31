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

export default function LandingPage() {
  const { goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData, loadingSkaterLeaderData } = useSkaterLeaderData();
  const { winsLeaderData, savePercentageLeaderData, gaaLeaderData, shutoutLeaderData, loadingGoalieLeaderData } = useGoalieLeaderData();
  const draftLotteryOddsData = useDraftLotteryOddsData();

  if (loadingSkaterLeaderData || loadingGoalieLeaderData || !draftLotteryOddsData) {
    return <LoadingState label="Loading data" fullPage />;
  }

  return (
    <Container fluid>
      <PageHeader />
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
    </Container>
  );
}
