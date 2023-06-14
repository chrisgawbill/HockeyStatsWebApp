import { Col, Container, Row } from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings";
import {
  getStandingsByConference,
  getStandingsByLeague,
} from "../Services/ApiHandler";
import {
  individualLeadersData,
  playerAwards,
  teamAwards,
} from "../Data/LocalData/LandingPageLocalData";
import { useState, useEffect } from "react";
import draftLotteryOddsHelper from "../Data/Helpers/DraftLotteryOddsHelper";
import conferenceStandingsHelper from "../Data/Helpers/ConferenceStandingsHelper";
const LandingPage = () => {
  //use States that will set with data that will be passed to components in landingPage
  const [easternStandingsData, setEasternStandingsData] = useState([]);
  const [westernStandingsData, setWesternStandingsData] = useState([]);
  const [draftLotteryOddsData, setDraftLotteryOddsData] = useState([]);
  //Custom hook that parses and modifies the api data to create draftLotteryOddsArray (which is then set in the useState)
  const { createDraftLotteryOddsArray } = draftLotteryOddsHelper();
  const { createStandingsArray } = conferenceStandingsHelper();
  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    getStandingsData();
    getDraftLotteryOdds();
  }, []);
  function getStandingsData() {
    getStandingsByConference()
      .then((response) => {
        const initialEasternStandings = response.data.records[0];
        const initialWesternStandings = response.data.records[1];

        const fixedEasternStandings = createStandingsArray(
          initialEasternStandings.teamRecords
        );
        const fixedWesternStandings = createStandingsArray(
          initialWesternStandings.teamRecords
        );

        setEasternStandingsData(fixedEasternStandings);
        setWesternStandingsData(fixedWesternStandings);
      })
      .catch((error) => console.log(error));
  }
  function getDraftLotteryOdds() {
    getStandingsByLeague()
      .then((response) => {
        const initialLeagueStandings = response.data.records[0];
        const draftLotteryOddsArray = createDraftLotteryOddsArray(
          initialLeagueStandings.teamRecords
        );
        setDraftLotteryOddsData(draftLotteryOddsArray);
      })
      .catch((error) => console.log(error));
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
          <LandingPageStandings
            title={"Eastern Conference"}
            data={easternStandingsData}
          ></LandingPageStandings>
          <LandingPageStandings
            title={"Western Conference"}
            data={westernStandingsData}
          ></LandingPageStandings>
        </Col>
      </Row>
    </Container>
  );
};
export default LandingPage;
