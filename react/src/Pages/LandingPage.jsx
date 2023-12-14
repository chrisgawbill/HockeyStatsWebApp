import { Col, Container, Row } from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings/LandingPageStandings";
import {
  individualLeadersData,
  playerAwards,
  teamAwards,
} from "../Data/LocalData/LandingPageLocalData";
import { useState, useEffect } from "react";
import { CreateDraftLotteryOddsArray } from "../Data/Helpers/DraftLotteryOddsHelper";
const LandingPage = () => {
  //use States that will set with data that will be passed to components in landingPage
  const [draftLotteryOddsData, setDraftLotteryOddsData] = useState([]);
  //Custom hook that parses and modifies the api data to create draftLotteryOddsArray (which is then set in the useState)
  function getDraftLotteryOdds() {
    // GetStandingsByLeague()
    //   .then((response) => {
    //     const initialLeagueStandings = response.data.records[0];
    //     const draftLotteryOddsArray = CreateDraftLotteryOddsArray(
    //       initialLeagueStandings.teamRecords
    //     );
    //     setDraftLotteryOddsData(draftLotteryOddsArray);
    //   })
    //   .catch((error) => console.log(error));
  }
  return (
    <Container fluid>
      <Row>
        <Col md={7}>
          <QuickLinks></QuickLinks>
          <LandingPageRow
            title={"Individual Leaders"}
            data={individualLeadersData}
          ></LandingPageRow>
          <LandingPageRow
            title={"Draft Lottery Odds"}
            data={draftLotteryOddsData}
          ></LandingPageRow>
          <LandingPageRow
            title={"Player Awards (2022)"}
            data={playerAwards}
          ></LandingPageRow>
          <LandingPageRow
            title={"Team Awards (2022)"}
            data={teamAwards}
          ></LandingPageRow>
        </Col>
        <Col md={5}>
          <LandingPageStandings></LandingPageStandings>
        </Col>
      </Row>
    </Container>
  );
};
export default LandingPage;
