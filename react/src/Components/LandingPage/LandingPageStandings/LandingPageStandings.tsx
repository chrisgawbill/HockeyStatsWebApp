import { Container } from "react-bootstrap";
import { useState, useEffect } from "react";
import StandingsContainer from "./StandingsContainer";
import { GetCurrentStandings } from "../../../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../../../Data/Helpers/ConferenceStandingsHelper";
import React from "react";

export default function LandingPageStandings(){
  const [easternStandingsData, setEasternStandingsData] = useState(new Array(16));
  const [westernStandingsData, setWesternStandingsData] = useState(new Array(16));

  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    getStandingsData();
  }, []);
  function getStandingsData() {
    GetCurrentStandings()
      .then((response) => {
        const responseStandings = response.data.standings;
        const easternStandings = CreateConferenceStandingsArray(
          responseStandings,
          "Eastern"
        );
        const westernStandings = CreateConferenceStandingsArray(
          responseStandings,
          "Western"
        );

        setEasternStandingsData(easternStandings);
        setWesternStandingsData(westernStandings);
      })
      .catch((error) => console.log(error));
  }

  return (
    <Container>
      <div>
        <StandingsContainer standingsName="Eastern" standingsData={easternStandingsData}/>
      </div>
      <div>
        <StandingsContainer standingsName="Western" standingsData={westernStandingsData}/>
      </div>
    </Container>
  );
};
