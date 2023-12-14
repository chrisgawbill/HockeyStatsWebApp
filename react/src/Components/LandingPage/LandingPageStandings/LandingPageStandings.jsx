import { Container } from "react-bootstrap";
import { useState, useEffect } from "react";
import StandingsContainer from "./StandingsContainer";
import { GetCurrentStandings } from "../../../Services/ApiHandler";
import { CreateConferenceStandingsArray, CreateStandingsArray } from "../../../Data/Helpers/ConferenceStandingsHelper";

const LandingPageStandings = () => {
  const [easternStandingsData, setEasternStandingsData] = useState(new Array(16));
  const [westernStandingsData, setWesternStandingsData] = useState(new Array(16));

  //This useEffect will call apis to get data that will be used in components
  useEffect(() => {
    getStandingsData();
  }, []);
  function getStandingsData() {
    GetCurrentStandings()
      .then((response) => {
        const initialEasternStandings = CreateConferenceStandingsArray(
          response.data.standings,
          "Eastern"
        );
        const initialWesternStandings = CreateConferenceStandingsArray(
          response.data.standings,
          "Western"
        );

        const fixedEasternStandings = CreateStandingsArray(
          initialEasternStandings
        );
        const fixedWesternStandings = CreateStandingsArray(
          initialWesternStandings
        );

        console.log(fixedEasternStandings);
        console.log(fixedWesternStandings);

        setEasternStandingsData(fixedEasternStandings);
        setWesternStandingsData(fixedWesternStandings);
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
export default LandingPageStandings;
