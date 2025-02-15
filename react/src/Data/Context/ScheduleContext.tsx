import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ScheduledGame } from "../Models/ScheduledGame";
import { GetScheduledGames } from "../../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Helpers/TeamHelpers";
import ConvertWeekToGames from "../Helpers/ScheduleHelper";
import { GetAllGames, GetGameFromDay, IsThereGamesScheduled, StoreScheduledGames } from "../Helpers/LocalDB/ScheduleDBHelpers";

const ListOfGamesContext = createContext<any>(null);

const ListOfGamesProvider = ({ children }: { children: ReactNode }) => {
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  const [loadingListOfGamesData, setLoadingListOfGamesData] =useState<boolean>(true);

  async function GetListOfGames(){
    const isLeagueStandingsCached = await IsThereGamesScheduled();
    if(isLeagueStandingsCached === false){
      setListOfGamesData(await GetAllGames());
      setLoadingListOfGamesData(false); 
    }else{
      try{
        const response = await GetScheduledGames();
        const week = response.gameWeek;
        let localScheduledGames:ScheduledGame[] = [];
        for(let i = 0; i < response.gameWeek.length; i++){
          if(week[i].numberOfGames > 0){
            const dayOfGames:ScheduledGame[] = ConvertWeekToGames(week[i]);
            await StoreScheduledGames(dayOfGames);
            localScheduledGames.push(...dayOfGames);
          }
        }
        setListOfGamesData(localScheduledGames);
      }catch(error){
        console.error("Error fetching games: ", error);
      }finally{
        setLoadingListOfGamesData(false);
      }
    }
  }
  useEffect(() => {(GetListOfGames())}, []);
  return (
    <ListOfGamesContext.Provider value={{listOfGamesData, loadingListOfGamesData}}>
      {children}
    </ListOfGamesContext.Provider>
  );
};
const useListOfGames = () => useContext(ListOfGamesContext);
export { ListOfGamesProvider, useListOfGames };
