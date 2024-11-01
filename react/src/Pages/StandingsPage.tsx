import React, { useEffect, useState } from "react";
import "../style/StandingsPage/StandingsPage.css";
import { Container } from "react-bootstrap";
import LandingPageStandingsTable from "../Components/LandingPage/LandingPageStandings/LandingPageStandingsTable";
import { StandingsTeam } from "../Data/Models/StandingsTeam";
import { GetCurrentStandings } from "../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../Data/Helpers/ConferenceStandingsHelper";
import { CreateDivisionStandingsArray } from "../Data/Helpers/DivisionStandingsHelper";

import StandingsContainer from "../Components/LandingPage/LandingPageStandings/StandingsContainer";
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
  const [showConferenceStandings, setShowConferenceStandings] =
    useState<Boolean>(true);
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
      <div>
        <div className="standings-page-header-box">
            <p>Conference Standings</p>
        </div>
        <div className="standings-page-header-box">
            <p>Division Standings</p>
        </div>
      </div>
      <div>
        <div>
          <StandingsContainer
            standingsName="Eastern"
            standingsData={easternStandingsData}
            standingFormat={"Conference"}
          />
        </div>
        <div>
          <StandingsContainer
            standingsName="Western"
            standingsData={westernStandingsData}
            standingFormat={"Conference"}
          />
        </div>
      </div>
    </Container>
  );
}
