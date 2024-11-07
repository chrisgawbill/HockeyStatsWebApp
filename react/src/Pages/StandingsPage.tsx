import React, { useEffect, useRef, useState } from "react";
import "../style/StandingsPage/StandingsPage.css";
import { Button, Col, Container, Row } from "react-bootstrap";
import LandingPageStandingsTable from "../Components/LandingPage/LandingPageStandings/LandingPageStandingsTable";
import { StandingsTeam } from "../Data/Models/StandingsTeam";
import { GetCurrentStandings } from "../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../Data/Helpers/ConferenceStandingsHelper";
import { CreateDivisionStandingsArray } from "../Data/Helpers/DivisionStandingsHelper";

import StandingsContainer from "../Components/LandingPage/LandingPageStandings/StandingsContainer";
import { Link } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
export default function StandingsPage() {
  const [easternStandingsData, setEasternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [westernStandingsData, setWesternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [metropolitanStandings, setMetropolitanStandings] = useState<
    StandingsTeam[]
  >([]);
  const [centralStandings, setCentralStandings] = useState<StandingsTeam[]>([]);
  const [pacificStandings, setPacificStandings] = useState<StandingsTeam[]>([]);
  const [showDivisionStandings, setShowDivisionStandings] =
    useState<Boolean>(false);
  const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam[]>(
    []
  );

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
  function GetStandings(
    setEasternStandings: Function,
    setWesternStandings: Function,
    setMetropolitanStandings: Function,
    setAtlanticStandings: Function,
    setCentralStandings: Function,
    setPacificStandings: Function
  ) {
    GetCurrentStandings()
      .then((response) => {
        const responseStandings = response.data.standings;
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
      })
      .catch((error) => console.log(error));
  }

  return (
    <Container>
    <PageHeader pageTitle="Standings"/>
      <Row>
        <Col md={6} className="standings-page-header-box">
          <Button
            id="standings-page-conference-viewSwitcher"
            className="standings-page-viewSwitcher-btn"
            onClick={() => {
              setShowDivisionStandings(false);
              document.getElementById("standings-page-conference-viewSwitcher")!.style.borderColor="darkBlue";
              document.getElementById("standings-page-division-viewSwitcher")!.style.borderColor = "grey";
            }}
          >
            Conference Standings
          </Button>
        </Col>
        <Col md={6} className="standings-page-header-box">
          <Button
            id="standings-page-division-viewSwitcher"
            className="standings-page-viewSwitcher-btn"
            onClick={() => {
              setShowDivisionStandings(true);
              document.getElementById("standings-page-conference-viewSwitcher")!.style.borderColor="grey";;
              document.getElementById("standings-page-division-viewSwitcher")!.style.borderColor="darkBlue";;
            }}
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
