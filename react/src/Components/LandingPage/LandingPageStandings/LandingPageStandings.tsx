import { Button, Container, Row } from "react-bootstrap";
import { useState } from "react";
import StandingsContainer from "./StandingsContainer";
import React from "react";
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
          <Button
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
              key={"easternStandings"}
              standingsName="Eastern"
              standingsData={easternStandingsData}
              standingFormat={"Conference"}
            />
          ) : null}
        </Row>
        <Row>
          {showConferenceStandings ? (
            <StandingsContainer
              key={"westernStandings"}
              standingsName="Western"
              standingsData={westernStandingsData}
              standingFormat={"Conference"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              key={"metropolitanStandings"}
              standingsName="Metro"
              standingsData={metropolitanStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              key={"atlanticStandings"}
              standingsName="Atlantic"
              standingsData={atlanticStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              key={"centralStandings"}
              standingsName="Central"
              standingsData={centralStandings}
              standingFormat={"Division"}
            />
          ) : null}
        </Row>
        <Row>
          {showDivisionStandings ? (
            <StandingsContainer
              key={"pacificStandings"}
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
