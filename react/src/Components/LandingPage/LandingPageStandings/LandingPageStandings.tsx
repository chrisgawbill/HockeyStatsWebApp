import { Button, Col, Container, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import StandingsContainer from "./StandingsContainer";
import { GetCurrentStandings } from "../../../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../../../Data/Helpers/ConferenceStandingsHelper";
import { CreateDivisionStandingsArray } from "../../../Data/Helpers/DivisionStandingsHelper";
import React from "react";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";

export default function LandingPageStandings() {
  const [easternStandingsData, setEasternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [westernStandingsData, setWesternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [metropolitanStandings, setMetropolitanStandings] = useState<
    StandingsTeam[]
  >([]);
  const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam[]>(
    []
  );
  const [centralStandings, setCentralStandings] = useState<StandingsTeam[]>([]);
  const [pacificStandings, setPacificStandings] = useState<StandingsTeam[]>([]);
  const [showConferenceStandings, setShowConferenceStandings] =
    useState<Boolean>(true);
  const [showDivisionStandings, setShowDivisionStandings] =
    useState<Boolean>(false);
  const [switchViewButtonText, setSwitchViewButtonText] = useState<String>(
    "Show Divisional Standings"
  );

  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    GetStandings(
      setEasternStandingsData,
      setWesternStandingsData,
      setMetropolitanStandings,
      setAtlanticStandings,
      setCentralStandings,
      setPacificStandings
    );
  }, []);
  async function GetStandings(
    setEasternStandings: Function,
    setWesternStandings: Function,
    setMetropolitanStandings: Function,
    setAtlanticStandings: Function,
    setCentralStandings: Function,
    setPacificStandings: Function
  ) {
    try{
      const data = await GetCurrentStandings();
      const responseStandings = data.standings;
        const easternStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Eastern");

        const metropolitanStandings: StandingsTeam[] =
          CreateDivisionStandingsArray(responseStandings, "Metropolitan");
        const atlanticStandings: StandingsTeam[] = CreateDivisionStandingsArray(
          responseStandings,
          "Atlantic"
        );

        const westernStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Western");
        const centralStandings: StandingsTeam[] = CreateDivisionStandingsArray(
          responseStandings,
          "Central"
        );
        const pacificStandings: StandingsTeam[] = CreateDivisionStandingsArray(
          responseStandings,
          "Pacific"
        );

        setEasternStandings(easternStandings);
        setWesternStandings(westernStandings);

        setMetropolitanStandings(metropolitanStandings);
        setAtlanticStandings(atlanticStandings);
        setCentralStandings(centralStandings);
        setPacificStandings(pacificStandings);
    }catch(error){
      console.error("Error fetching standings: ", error);
    }
  }

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
