import { Button, Container } from "react-bootstrap";
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
  const [metropolitanStandings, setMetropolitanStandings] = useState<StandingsTeam []>([]);
  const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam []>([]);
  const [centralStandings, setCentralStandings] = useState<StandingsTeam []>([]);
  const [pacificStandings, setPacificStandings] = useState<StandingsTeam []>([]);
  const [showConferenceStandings, setShowConferenceStandings] = useState<Boolean>(true);
  const [showDivisionStandings, setShowDivisionStandings] = useState<Boolean>(false);

  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    GetStandings(setEasternStandingsData, setWesternStandingsData, setMetropolitanStandings, setAtlanticStandings, setCentralStandings, setPacificStandings);
  }, []);
  function GetStandings(
    setEasternStandings: Function,
    setWesternStandings: Function,
    setMetropolitanStandings:Function,
    setAtlanticStandings:Function,
    setCentralStandings:Function,
    setPacificStandings:Function
  ) {
    GetCurrentStandings()
      .then((response) => {
        const responseStandings = response.data.standings;
        const easternStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Eastern");

        const metropolitanStandings:StandingsTeam[] = CreateDivisionStandingsArray(responseStandings, "Metropolitan");
        const atlanticStandings:StandingsTeam[] = CreateDivisionStandingsArray(responseStandings, "Atlantic")

        const westernStandings: StandingsTeam[] =
          CreateConferenceStandingsArray(responseStandings, "Western");
        const centralStandings:StandingsTeam[] = CreateDivisionStandingsArray(responseStandings, "Central");
        const pacificStandings:StandingsTeam[] = CreateDivisionStandingsArray(responseStandings, "Pacific");

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
        <Button  onClick={()=>{
          setShowConferenceStandings(!showConferenceStandings);
          setShowDivisionStandings(!showDivisionStandings);
        }}>Switch Standing Format</Button>
      </div>
      {
        showConferenceStandings ? 
        <StandingsContainer
        standingsName="Eastern"
        standingsData={easternStandingsData}
        standingFormat={"Conference"}
        />
      :null
      }
      {
        showConferenceStandings ? 
          <StandingsContainer
            standingsName="Western"
            standingsData={westernStandingsData}
            standingFormat={"Conference"}
          />
      :null
      }
      {
        showDivisionStandings ?
          <StandingsContainer standingsName="Metro" standingsData={metropolitanStandings} standingFormat={"Division"}/>
        :null
      }
      {
        showDivisionStandings ?
          <StandingsContainer standingsName="Atlantic" standingsData={atlanticStandings} standingFormat={"Division"}/>
        :null
      }
      {
        showDivisionStandings ?
          <StandingsContainer standingsName="Central" standingsData={centralStandings} standingFormat={"Division"}/>
        :null
      }
      {
        showDivisionStandings ?
          <StandingsContainer standingsName="Pacific" standingsData={pacificStandings} standingFormat={"Division"}/>
        :null
      }
    </Container>
  );
}