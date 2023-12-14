import { Col, Row } from "react-bootstrap";
import LandingPageStandingsTitleRow from "./LandingPageStandingsTitleRow";
import LandingPageStandingsRow from "./LandingPageStandingsRow";
import "../../../style/LandingPage/LandingPageStandings.css";

const StandingsContainer = (standingsName, standingsData) => {
  let copyOfStandings = new Array(16);
  for (let i = 0; i < standingsData.length; i++) {
    copyOfStandings[i] = standingsData[i];
  }
  return (
    <div>
      <Row>
        <Col className="standings-header">
          <h2>{standingsName}</h2>
        </Col>
      </Row>
      <Row className="standings-row">
        <LandingPageStandingsTitleRow></LandingPageStandingsTitleRow>
        {copyOfStandings.map((standingsTeam) => (
          <LandingPageStandingsRow
            key={standingsTeam.id}
            team={standingsTeam}
          ></LandingPageStandingsRow>
        ))}
      </Row>
    </div>
  );
};
export default StandingsContainer;
