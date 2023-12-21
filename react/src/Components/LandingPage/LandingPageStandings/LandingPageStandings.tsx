import { Container } from "react-bootstrap";
import { useState, useEffect } from "react";
import StandingsContainer from "./StandingsContainer";
import { GetCurrentStandings } from "../../../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../../../Data/Helpers/ConferenceStandingsHelper";
import React from "react";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";

export default function LandingPageStandings() {
  const [easternStandingsData, setEasternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [westernStandingsData, setWesternStandingsData] = useState<
    StandingsTeam[]
  >([]);

  // const [metroStandings, setMetroStandings] = useState<StandingsTeam[]>(
  //   new Array(16)
  // );
  // const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam[]>(
  //   new Array(16)
  // );
  // const [centralStandings, setCentralStandings] = useState<StandingsTeam[]>(
  //   new Array(16)
  // );
  // const [pacificStandings, setPacificStandings] = useState<StandingsTeam[]>(
  //   new Array(16)
  // );

  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    GetStandings(setEasternStandingsData, setWesternStandingsData);
  }, []);
  // useEffect(() => {
  //   if (
  //     easternStandingsData !== undefined ||
  //     westernStandingsData !== undefined
  //   ) {
  //     GetDivisionStandings(
  //       setMetroStandings,
  //       "Metropolitan",
  //       easternStandingsData
  //     );
  //     GetDivisionStandings(
  //       setAtlanticStandings,
  //       "Atlantic",
  //       easternStandingsData
  //     );
  //     GetDivisionStandings(
  //       setCentralStandings,
  //       "Central",
  //       westernStandingsData
  //     );
  //     GetDivisionStandings(
  //       setPacificStandings,
  //       "Pacific",
  //       westernStandingsData
  //     );
  //   }
  // }, [easternStandingsData, westernStandingsData]);
  function GetStandings(
    setEasternStandings: Function,
    setWesternStandings: Function
  ) {
    GetCurrentStandings()
      .then((response) => {
        const responseStandings = response.data.standings;
        const easternStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Eastern");
        const westernStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Western");

        setEasternStandings(easternStandings);
        setWesternStandings(westernStandings);
      })
      .catch((error) => console.log(error));
  }
    return (
      <Container>
        <div>
          <StandingsContainer
            standingsName="Eastern"
            standingsData={easternStandingsData}
          />
        </div>
        <div>
          <StandingsContainer
            standingsName="Western"
            standingsData={westernStandingsData}
          />
        </div>
      </Container>
    );
}
// function GetDivisionStandings(
//   setDivisionStandings: Function,
//   divisionName: string,
//   conferenceStandings: StandingsTeam[]
// ) {
//   let divisionStandingsArray: StandingsTeam[] = new Array(8);
//   divisionStandingsArray = conferenceStandings.filter((team) => team.divisionName === divisionName)
//   setDivisionStandings(divisionStandingsArray);
// }
