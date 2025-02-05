import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { StandingsTeam } from "../Models/StandingsTeam";
import { GetCurrentStandings } from "../../Services/ApiHandler";
import { CreateConferenceStandingsArray } from "../Helpers/ConferenceStandingsHelper";
import { CreateDivisionStandingsArray } from "../Helpers/DivisionStandingsHelper";

const StandingsContext = createContext<any>(null);

const  StandingsDataProvider = ({children}: {children:ReactNode}) => {
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

  const [loadingData, setLoadingData] = useState<boolean>(true);

  async function GetStandings() {
    const cachedEasternConferenceStandings = localStorage.getItem('eastern-conference-standings-key');
    const cachedWesternConferenceStandings = localStorage.getItem('western-conference standings-key');
    const cachedMetropolitanDivisionStandings = localStorage.getItem('metropolitan-division-standings-key');
    const cachedAtlanticDivisionStandings = localStorage.getItem('atlantic-division-standings-key');
    const cachedCentralDivisionStandings = localStorage.getItem('central-divsion-standings-key');
    const cachedPacificDivisionStandings = localStorage.getItem('pacific-division-standings-key');

    if(cachedEasternConferenceStandings && cachedWesternConferenceStandings && cachedMetropolitanDivisionStandings && cachedAtlanticDivisionStandings && cachedCentralDivisionStandings && cachedPacificDivisionStandings){
        setEasternStandingsData(JSON.parse(cachedEasternConferenceStandings));
        setWesternStandingsData(JSON.parse(cachedWesternConferenceStandings));
        setMetropolitanStandings(JSON.parse(cachedMetropolitanDivisionStandings));
        setAtlanticStandings(JSON.parse(cachedAtlanticDivisionStandings));
        setCentralStandings(JSON.parse(cachedCentralDivisionStandings));
        setPacificStandings(JSON.parse(cachedPacificDivisionStandings));

        setLoadingData(false);
    }else{
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
              localStorage.setItem('eastern-conference-standings-key', JSON.stringify(easternStandings));
              localStorage.setItem('western-conference standings-key', JSON.stringify(westernStandings));
              localStorage.setItem('metropolitan-division-standings-key',JSON.stringify(metropolitanStandings));
              localStorage.setItem('atlantic-division-standings-key', JSON.stringify(atlanticStandings));
              localStorage.setItem('central-divsion-standings-key', JSON.stringify(centralStandings));
              localStorage.setItem('pacific-division-standings-key', JSON.stringify(pacificStandings));

              setEasternStandingsData(easternStandings);
              setWesternStandingsData(westernStandings);
      
              setMetropolitanStandings(metropolitanStandings);
              setAtlanticStandings(atlanticStandings);
              setCentralStandings(centralStandings);
              setPacificStandings(pacificStandings);
          }catch(error){
            console.error("Error fetching standings: ", error);
          }finally{
            setLoadingData(false);
          }
    }
  }

    //This useEffect will call apis to get data that will be used in components
    useEffect(() => {
      GetStandings();
    }, []);

    return(
        <StandingsContext.Provider value={{easternStandingsData, westernStandingsData, metropolitanStandings, atlanticStandings, centralStandings, pacificStandings, loadingData}}>
            {children}
        </StandingsContext.Provider>
    )
};

const useStandingsData = () => useContext(StandingsContext);
export{StandingsDataProvider, useStandingsData};