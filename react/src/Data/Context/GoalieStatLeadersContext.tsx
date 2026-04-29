import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PlayerStatLeader } from "../Models/PlayerStatLeader";
import { TopStatLeader } from "../Models/TopStatLeader";
import { GetGoalieStatLeaders } from "../../Services/ApiHandler";
import PlayerStatLeaderConverter from "../Helpers/PlayerStatLeaderConverter";
import { getTopStatLeader, storeTopStatLeader } from "../Helpers/LocalDB/TopStatLeadersDBHelpers";

const GoalieLeaderContext = createContext<any>(null);
const GoalieLeaderDataProvider = ({ children }: { children: ReactNode }) => {
  //All use states for stat leader data pertaining to the goaltenders
  const [winsLeaderData, setWinsLeaderData] = useState<TopStatLeader>();
  const [savePercentageLeaderData, setSavePercentageLeaderData] =
    useState<TopStatLeader>();
  const [gaaLeaderData, setGaaLeaderData] = useState<TopStatLeader>();
  const [shutoutLeaderData, setShutoutLeaderData] = useState<TopStatLeader>();

  const loadingRefs = useRef({
    loadingWins:true,
    loadingSavePercentage:true,
    loadingGaa:true,
    loadingShutouts:true
  })

  const [loadingGoalieLeaderData, setLoadingGoalieLeaderData] =
    useState<boolean>(true);


  function CheckLoadingStatus(){
    const allLoaded = !Object.values(loadingRefs.current).includes(true);
    if(allLoaded){
        setLoadingGoalieLeaderData(false);
    }
  }
  async function GetWinsLeader(){
    const cachedWinsLeaderData:TopStatLeader = await getTopStatLeader("Wins");
    if(cachedWinsLeaderData){
        setWinsLeaderData(cachedWinsLeaderData);
        loadingRefs.current.loadingWins = false;
    }else{
        try {
            const data = await GetGoalieStatLeaders("wins");
            const winsLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "wins"
            );
            const winsLeader: PlayerStatLeader = winsLeaders[0];
            const topWinLeader: TopStatLeader = new TopStatLeader(
              "Wins",
              winsLeader,
              winsLeaders
            );
            storeTopStatLeader(topWinLeader);
            setWinsLeaderData(topWinLeader);
            loadingRefs.current.loadingWins = false;
          } catch (error) {
            console.error("Error fetching wins: ", error);
          }
    }
  }
  async function GetSavePercentageLeader(){
    const cachedSavePercentageLeaderData:TopStatLeader = await getTopStatLeader("SV%");
      if(cachedSavePercentageLeaderData){
        setSavePercentageLeaderData(cachedSavePercentageLeaderData);
        loadingRefs.current.loadingSavePercentage = false;
      }else{
        try {
            const data = await GetGoalieStatLeaders("savePctg");
            const savePercentageLeaders: PlayerStatLeader[] =
              PlayerStatLeaderConverter(data, "savePctg");
            const savePercentageLeader: PlayerStatLeader = savePercentageLeaders[0];
            const topSavePercentageLeader: TopStatLeader = new TopStatLeader(
              "SV%",
              savePercentageLeader,
              savePercentageLeaders
            );
            storeTopStatLeader(topSavePercentageLeader);
            setSavePercentageLeaderData(topSavePercentageLeader);
            loadingRefs.current.loadingSavePercentage = false;
          } catch (error) {
            console.error("Error fetching save percentage: ", error);
          }
      }
  }
  async function GetGaaLeader(){
    const cachedGaaLeaderData:TopStatLeader = await getTopStatLeader("GAA");
    if(cachedGaaLeaderData){
        setGaaLeaderData(cachedGaaLeaderData);
        loadingRefs.current.loadingGaa = false;
    }else{
        try {
            const data = await GetGoalieStatLeaders("goalsAgainstAverage");
            const gaaLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "goalsAgainstAverage"
            );
            const gaaLeader: PlayerStatLeader = gaaLeaders[0];
            const topGaaLeader: TopStatLeader = new TopStatLeader(
              "GAA",
              gaaLeader,
              gaaLeaders
            );
            storeTopStatLeader(topGaaLeader);
            setGaaLeaderData(topGaaLeader);
            loadingRefs.current.loadingGaa = false;
          } catch (error) {
            console.error("Error fetching goals against average: ", error);
          }
    }
  }
  async function GetShutoutLeader(){
    const cachedShutoutLeaderData:TopStatLeader = await getTopStatLeader("Shutouts");
    if(cachedShutoutLeaderData){
        setShutoutLeaderData(cachedShutoutLeaderData);
        loadingRefs.current.loadingShutouts = false;
    }else{
        try {
            const data = await GetGoalieStatLeaders("shutouts");
            const shutoutLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "shutouts"
            );
            const shutoutLeader: PlayerStatLeader = shutoutLeaders[0];
            const topShutoutLeader: TopStatLeader = new TopStatLeader(
              "Shutouts",
              shutoutLeader,
              shutoutLeaders
            );
            storeTopStatLeader(topShutoutLeader);
            setShutoutLeaderData(topShutoutLeader);
            loadingRefs.current.loadingShutouts = false;
          } catch (error) {
            console.error("Error fetching shutouts: ", error);
          }
    }
  }
  async function FetchAllData(){
    try{
        await Promise.all([
            GetWinsLeader(),
            GetSavePercentageLeader(),
            GetGaaLeader(),
            GetShutoutLeader()
        ]);
    }finally{
        CheckLoadingStatus();
    }
  }
  useEffect(() => {
    FetchAllData();
  }, []);
  return (
    <GoalieLeaderContext.Provider
      value={{
        winsLeaderData,
        savePercentageLeaderData,
        gaaLeaderData,
        shutoutLeaderData,
        loadingGoalieLeaderData,
      }}
    >
      {children}
    </GoalieLeaderContext.Provider>
  );
};
const useGoalieLeaderData = () => useContext(GoalieLeaderContext);

export { GoalieLeaderDataProvider, useGoalieLeaderData };
