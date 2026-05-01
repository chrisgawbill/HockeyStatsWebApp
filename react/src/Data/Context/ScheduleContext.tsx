import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ScheduledGame } from "../Models/ScheduledGame";
import { GetGameDetails, GetScheduledGames } from "../../Services/ApiHandler";
import ConvertWeekToGames from "../Helpers/ScheduleHelper";
import {
  GetAllGames,
  IsScheduleStored,
  StoreScheduledGames,
  UpdateGameDB,
} from "../Helpers/LocalDB/ScheduleDBHelpers";

const ListOfGamesContext = createContext<any>(null);

const ListOfGamesProvider = ({ children }: { children: ReactNode }) => {
  /**List of scheduled games */
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  /**Loading state for listOfGamesData */
  const [loadingListOfGamesData, setLoadingListOfGamesData] =
    useState<boolean>(true);
  const [datesWithGames, setDatesWithGames] = useState<Date[]>([]);
  /**List of games on a specific date */
  const [selectedDateGames, setSelectedDateGames] = useState<ScheduledGame[]>(
    []
  );

  /**Method that calls the service method to get a list of games */
  async function ListOfGamesCall() {
    try {
      const response = await GetScheduledGames();
      const week = response.gameWeek;
      let localScheduledGames: ScheduledGame[] = [];
      for (let i = 0; i < response.gameWeek.length; i++) {
        if (week[i].numberOfGames > 0) {
          const dayOfGames: ScheduledGame[] = ConvertWeekToGames(week[i]);
          await StoreScheduledGames(dayOfGames);
          localScheduledGames.push(...dayOfGames);
        }
      }
      setListOfGamesData(localScheduledGames);
    } catch (error) {
      console.error("Error fetching games: ", error);
    } finally {
      setLoadingListOfGamesData(false);
    }
  }
  /**Method that checks to see if there are games in local storage or if an api call needs to be made */
  async function GetListOfGames() {
    try {
      const hasStoredGames = await IsScheduleStored();
      if (hasStoredGames) {
        const response: ScheduledGame[] = await GetAllGames();
        if (response && response.length > 0) {
          const today = new Date();
          const lastResponseDate = new Date(response[response.length - 1].date);
          const isStale =
            lastResponseDate.getUTCMonth() <= today.getUTCMonth() &&
            lastResponseDate.getUTCDate() < today.getUTCDate() &&
            lastResponseDate.getUTCFullYear() <= today.getUTCFullYear();

          const firstDateStr = response
            .map((g: ScheduledGame) => String(g.date))
            .sort()[0] ?? "";
          const seasonStartYear = today.getMonth() >= 9 ? today.getFullYear() : today.getFullYear() - 1;
          const isIncomplete = firstDateStr > `${seasonStartYear}-10-01`;

          if (isStale || isIncomplete) {
            await ListOfGamesCall();
          } else {
            setListOfGamesData(response);
            setLoadingListOfGamesData(false);
          }
        } else {
          await ListOfGamesCall();
        }
      } else {
        await ListOfGamesCall();
      }
    } catch (error) {
      console.error("Error fetching games: ", error);
      setLoadingListOfGamesData(false);
    }
  }
  /**Method that fetches games by date */
  const fetchGamesByDate = useCallback(
    async (date: Date) => {
      if (!loadingListOfGamesData) {
        const todaysGames: ScheduledGame[] = listOfGamesData.filter(
          (game: ScheduledGame) => isSameDate(parseLocalDate(game.date), date)
        );
        setSelectedDateGames(todaysGames);
      }
    },
    [listOfGamesData, loadingListOfGamesData, setSelectedDateGames]
  );
  /**Method that updates past games, it checks to see which games, if any, need to be updated and then updates them */
  const updatePastGames = useCallback(async () => {
    if (!loadingListOfGamesData) {
      const gamesThatNeedToUpdate: ScheduledGame[] = listOfGamesData.filter(
        (game: ScheduledGame) => doesGameNeedToUpdate(game)
      );
      let updatedGamesList:ScheduledGame[] = listOfGamesData;
      for(const game of gamesThatNeedToUpdate){
        const updatedGame:ScheduledGame | undefined = await updateGame(game);
        if(updatedGame){
          const index = updatedGamesList.findIndex((g: ScheduledGame) => g.gameId === updatedGame.gameId);
          updatedGamesList[index] = updatedGame;
          UpdateGameDB(updatedGame);
        }
      }
      setListOfGamesData(updatedGamesList);
    }
  }, [listOfGamesData, loadingListOfGamesData]);
  /**Method that gets an updated game */
  async function updateGame(game: ScheduledGame) {
    try{
      const id = game.gameId;
      const response = await GetGameDetails(id);
      const updatedGame = new ScheduledGame(
        game.gameId,
        game.date,
        game.gameTime,
        game.dayOfWeek,
        game.venue,
        game.homeTeam,
        game.homeLogo,
        response.homeTeam.score,
        game.awayTeam,
        game.awayLogo,
        response.awayTeam.score,
        game.broadcasts,
        "",
        game.gameCenter
      );
      return updatedGame;
    }catch(error){
      console.error("Error updating game: ", error);
    }
  }
 /**Method that checks to see whether a game needs to be updated */
  function doesGameNeedToUpdate(game: ScheduledGame) {
    const date = new Date(game.date);
    const gameDay = date.getUTCDay();
    const gameMonth = date.getUTCMonth();
    const gameYear = date.getUTCFullYear();
    const currentDate = new Date();
    if (
      gameMonth <= currentDate.getUTCMonth() &&
      gameYear <= currentDate.getUTCFullYear() &&
      gameDay < currentDate.getUTCDay()
    ) {
      if (game.homeScore === undefined && game.awayScore === undefined) {
        return true;
      }
    }
    return false;
  }
  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**Method that checks to see if two dates are the same*/
  function isSameDate(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  /**Initial useEffect to get the list of scheduled games */
  useEffect(() => {
    GetListOfGames();
  }, []);
  /**useEffect that is used to update games and to fetch games by the current date */
  useEffect(() => {
    if(!loadingListOfGamesData && listOfGamesData.length > 0){
      const currentDate: Date = new Date();
      updatePastGames();
      fetchGamesByDate(currentDate);
    }
  }, [loadingListOfGamesData, listOfGamesData, updatePastGames, fetchGamesByDate]);
  return (
    <ListOfGamesContext.Provider
      value={{
        listOfGamesData,
        loadingListOfGamesData,
        selectedDateGames,
        fetchGamesByDate,
      }}
    >
      {children}
    </ListOfGamesContext.Provider>
  );
};
const useListOfGames = () => useContext(ListOfGamesContext);
export { ListOfGamesProvider, useListOfGames };
