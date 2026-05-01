import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { StandingsTeam } from "../Models/StandingsTeam";
import { GetCurrentStandings } from "../../Services/ApiHandler";
import { CreateLeagueStandingsArray } from "../Helpers/LeagueStandingsHelper";
import { GetConferenceStandings, GetDivisionStandings, GetDraftLotteryOddsArray, IsLeagueStandingsStored, StoreLeagueStandings } from "../Helpers/LocalDB/StandingsDBHelpers";

export const StandingsContext = createContext<any>(null);

interface StandingsData{
  easternStandingsData:StandingsTeam[];
  westernStandingsData:StandingsTeam[];
  metropolitanStandings:StandingsTeam[];
  atlanticStandings:StandingsTeam[];
  centralStandings:StandingsTeam[];
  pacificStandings:StandingsTeam[];
  draftLotteryOdds:StandingsTeam[];
  loadingStandingsData:boolean;
}
const  StandingsDataProvider = ({children}: {children:ReactNode}) => {
    const loadingRefs = useRef({
          loadingEasternStandings:true,
          loadingWesternStandings:true,
          loadingMetropolitanStandings:true,
          loadingAtlanticStandings:true,
          loadingPacificStandings:true,
          loadingCentralStandings:true,
          loadingDraftLotteryOdds:true,
    })
  
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
  const [draftLotteryOdds, setDraftLotteryOdds] = useState<StandingsTeam[]>([]);

  const [loadingStandingsData, setLoadingStandingsData] = useState<boolean>(true);
  function CheckLoadingStatus() {
    const allStatsLoaded = !Object.values(loadingRefs.current).includes(true);
    if (allStatsLoaded) {
      setLoadingStandingsData(false);
    }
  }

  async function GetEasternConferenceStandings() {
    try {
      const easternStandings = await GetConferenceStandings("Eastern");
      setEasternStandingsData(easternStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingEasternStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetWesternConferenceStandings() {
    try {
      const westernStandings = await GetConferenceStandings("Western");
      setWesternStandingsData(westernStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingWesternStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetMetropolitanDivisionStandings() {
    try {
      const metropolitanStandings = await GetDivisionStandings("Metropolitan");
      setMetropolitanStandings(metropolitanStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingMetropolitanStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetAtlanticDivisionStandings() {
    try {
      const atlanticStandings = await GetDivisionStandings("Atlantic");
      setAtlanticStandings(atlanticStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingAtlanticStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetCentralDivisionStandings() {
    try {
      const centralStandings = await GetDivisionStandings("Central");
      setCentralStandings(centralStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingCentralStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetPacificDivisionStandings() {
    try {
      const pacificStandings = await GetDivisionStandings("Pacific");
      setPacificStandings(pacificStandings);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingPacificStandings = false;
      CheckLoadingStatus();
    }
  }
  async function GetDraftLotteryOdds() {
    try {
      const draftLotteryOdds = await GetDraftLotteryOddsArray();
      setDraftLotteryOdds(draftLotteryOdds);
    } catch (error) {
      console.error("Could not retrieve data");
    } finally {
      loadingRefs.current.loadingDraftLotteryOdds = false;
      CheckLoadingStatus();
    }
  }

  async function GetStandings() {
    try {
      const hasStoredStandings = await IsLeagueStandingsStored();
      if (hasStoredStandings) {
        await Promise.all([
          GetEasternConferenceStandings(),
          GetWesternConferenceStandings(),
          GetMetropolitanDivisionStandings(),
          GetAtlanticDivisionStandings(),
          GetCentralDivisionStandings(),
          GetPacificDivisionStandings(),
          GetDraftLotteryOdds(),
        ]);
      } else {
        const data = await GetCurrentStandings();
        const responseStandings = data.standings;
        const leagueStandings: StandingsTeam[] =
          CreateLeagueStandingsArray(responseStandings);
        await StoreLeagueStandings(leagueStandings);

        await Promise.all([
          GetEasternConferenceStandings(),
          GetWesternConferenceStandings(),
          GetMetropolitanDivisionStandings(),
          GetAtlanticDivisionStandings(),
          GetCentralDivisionStandings(),
          GetPacificDivisionStandings(),
          GetDraftLotteryOdds(),
        ]);
      }
    } catch (error) {
      console.error("Error fetching standings: ", error);
    } finally {
      setLoadingStandingsData(false);
    }
  }

    //This useEffect will call apis to get data that will be used in components
    useEffect(() => {
      GetStandings();
    }, []);

    return(
        <StandingsContext.Provider value={{easternStandingsData, westernStandingsData, metropolitanStandings, atlanticStandings, centralStandings, pacificStandings, draftLotteryOdds, loadingStandingsData}}>
            {children}
        </StandingsContext.Provider>
    )
};
export const useStandingsContext = (): StandingsData => {
  const context = useContext(StandingsContext);
  if(context  === undefined){
    throw new Error("useStandingsContext must be used withing Standings Provider");
  }
  return context;
}

export const useDraftLotteryOddsData = () => {
  const context = useStandingsContext();
  return context.draftLotteryOdds;
};

const useStandingsData = () => useContext(StandingsContext);
export{StandingsDataProvider, useStandingsData};