import { Button, Col, Container, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import StandingsContainer from "./StandingsContainer";
import { GetCurrentStandings } from "../../../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../../../Data/Helpers/ConferenceStandingsHelper";
import { CreateDivisionStandingsArray } from "../../../Data/Helpers/DivisionStandingsHelper";
import React from "react";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import { useStandingsData } from "../../../Data/Context/StandingsContext";

export default function LandingPageStandings() {
  const {easternStandingsData, westernStandingsData, metropolitanStandings, atlanticStandings, centralStandings, pacificStandings, loadingData} = useStandingsData();
  const [showConferenceStandings, setShowConferenceStandings] =
    useState<Boolean>(true);
  const [showDivisionStandings, setShowDivisionStandings] =
    useState<Boolean>(false);
  const [switchViewButtonText, setSwitchViewButtonText] = useState<String>(
    "Show Divisional Standings"
  );
  if(loadingData){
    return (
      <p>Loading Data</p>
    )
  }else{
    return (
      <Container>
        <Row>
          <Col className="landing-header">
            <h2>League Standings</h2>
          </Col>
        </Row>
        <Row>
          <Button
            variant="secondary"
            id="landingPage-standings-switcher"
            onClick={() => {
              if (showDivisionStandings === true) {
                setSwitchViewButtonText("Show Divisional Standings");
              } else {
                setSwitchViewButtonText("Show Conference Standings");
              }
              setShowConferenceStandings(!showConferenceStandings);
              setShowDivisionStandings(!showDivisionStandings);
            }}
          >
            {switchViewButtonText}
          </Button>
        </Row>
        <Row>
          {showConferenceStandings ? (
            <StandingsContainer
              standingsName="Eastern"
              standingsData={easternStandingsData}
              standingFormat={"Conference"}
            />
          ) : null}
        </Row>
        <Row>
          {showConferenceStandings ? (
            <StandingsContainer
              standingsName="Western"
              standingsData={westernStandingsData}
              standingFormat={"Conference"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              standingsName="Metro"
              standingsData={metropolitanStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              standingsName="Atlantic"
              standingsData={atlanticStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              standingsName="Central"
              standingsData={centralStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              standingsName="Pacific"
              standingsData={pacificStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
      </Container>
    );
  }
}
