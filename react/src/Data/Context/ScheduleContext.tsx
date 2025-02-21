import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { ScheduledGame } from "../Models/ScheduledGame";
import { GetScheduledGames } from "../../Services/ApiHandler";
import ConvertWeekToGames from "../Helpers/ScheduleHelper";
import { GetAllGames, IsThereGamesScheduled, StoreScheduledGames } from "../Helpers/LocalDB/ScheduleDBHelpers";

const ListOfGamesContext = createContext<any>(null);

const ListOfGamesProvider = ({ children }: { children: ReactNode }) => {
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  const [loadingListOfGamesData, setLoadingListOfGamesData] =useState<boolean>(true);
  const [selectedDateGames, setSelectedDateGames] = useState<ScheduledGame[]>([]);

  useEffect(() => {
    console.log(listOfGamesData);
  }, [listOfGamesData]);

  async function ListOfGamesCall(){
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
      const currentDate:Date = new Date();
      await fetchGamesByDate(currentDate);
    }
  }

  async function GetListOfGames(){
    try{
      const isLeagueStandingsCached = await IsThereGamesScheduled();
      if(isLeagueStandingsCached === false){
        const response:any[] = await(GetAllGames());
        if(new Date(response[0][response.length-1].date).getTime() <= new Date().getTime()){
          await ListOfGamesCall();
        }
        setListOfGamesData(response[0]);
        setLoadingListOfGamesData(false);
        const currentDate:Date = new Date();
        await fetchGamesByDate(currentDate); 
      }else{
        await ListOfGamesCall();
      } 
    }catch(error){
      console.error("Error fetching games: ", error);
    }
  }
  const fetchGamesByDate = useCallback(async (date:Date) => {
    console.log(listOfGamesData);
    if(!loadingListOfGamesData){
      const todaysGames:ScheduledGame[] = listOfGamesData.filter((game:ScheduledGame) => isSameDate((new Date(game.date)),date));
      console.log(todaysGames);
      setSelectedDateGames(todaysGames);
    }
  },[listOfGamesData, loadingListOfGamesData, setSelectedDateGames]);
  function isSameDate(date1:Date, date2:Date){
    console.log(date1, date2);
    return (date1.getUTCFullYear() === date2.getUTCFullYear() && date1.getUTCMonth() === date2.getUTCMonth() && date1.getUTCDate() === date2.getUTCDate());
  }
  useEffect(() => {(GetListOfGames())}, []);
  return (
    <ListOfGamesContext.Provider value={{listOfGamesData, loadingListOfGamesData, selectedDateGames, fetchGamesByDate}}>
      {children}
    </ListOfGamesContext.Provider>
  );
};
const useListOfGames = () => useContext(ListOfGamesContext);
export { ListOfGamesProvider, useListOfGames };
