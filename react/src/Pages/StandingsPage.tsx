import React, { useState } from "react";
import "../style/StandingsPage/StandingsPage.css";
import { Button, Col, Container, Row } from "react-bootstrap";
import StandingsContainer from "../Components/LandingPage/LandingPageStandings/StandingsContainer";
import PageHeader from "../Components/PageHeader";
import { useStandingsData } from "../Data/Context/StandingsContext";

export default function StandingsPage() {
  const {easternStandingsData, westernStandingsData, metropolitanStandings, atlanticStandings, centralStandings, pacificStandings, draftLotteryOddsData, loadingData} = useStandingsData();

  const [showDivisionStandings, setShowDivisionStandings] = useState<Boolean>(false);

  if(loadingData){
    return(
      <p>Loading Data</p>
    )
  }else{
    return (
      <Container fluid>
        <PageHeader />
        <Row>
          <Col md={6} className="standings-page-header-box">
            <Button
              className={`standings-page-viewSwitcher-btn${!showDivisionStandings ? " viewSwitcher-selected" : ""}`}
              onClick={() => setShowDivisionStandings(false)}
            >
              Conference Standings
            </Button>
          </Col>
          <Col md={6} className="standings-page-header-box">
            <Button
              className={`standings-page-viewSwitcher-btn${showDivisionStandings ? " viewSwitcher-selected" : ""}`}
              onClick={() => setShowDivisionStandings(true)}
            >
              Division Standings
            </Button>
          </Col>
        </Row>
        <Row id="standings-page-table-container">
          {!showDivisionStandings ? (
            <>
              <StandingsContainer
                standingsName="Eastern"
                standingsData={easternStandingsData}
                standingFormat={"Conference"}
              />
              <StandingsContainer
                standingsName="Western"
                standingsData={westernStandingsData}
                standingFormat={"Conference"}
              />
            </>
          ) : null}
          {showDivisionStandings ? (
            <>
              <StandingsContainer
                standingsName="Metropolitan"
                standingsData={metropolitanStandings}
                standingFormat={"Division"}
              />
              <StandingsContainer
                standingsName="Atlantic"
                standingsData={atlanticStandings}
                standingFormat={"Division"}
              />
              <StandingsContainer
                standingsName="Central"
                standingsData={centralStandings}
                standingFormat={"Division"}
              />
              <StandingsContainer
                standingsName="Pacific"
                standingsData={pacificStandings}
                standingFormat={"Division"}
              />
            </>
          ) : null}
        </Row>
      </Container>
    );
  }
}
