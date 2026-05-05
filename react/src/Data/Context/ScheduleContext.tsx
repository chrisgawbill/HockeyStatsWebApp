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
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  const [loadingListOfGamesData, setLoadingListOfGamesData] =
    useState<boolean>(true);
  const [datesWithGames, setDatesWithGames] = useState<Date[]>([]);
  const [selectedDateGames, setSelectedDateGames] = useState<ScheduledGame[]>(
    [],
  );

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

          const firstDateStr =
            response.map((g: ScheduledGame) => String(g.date)).sort()[0] ?? "";
          const seasonStartYear =
            today.getMonth() >= 9
              ? today.getFullYear()
              : today.getFullYear() - 1;
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
  const fetchGamesByDate = useCallback(
    async (date: Date) => {
      if (!loadingListOfGamesData) {
        const todaysGames: ScheduledGame[] = listOfGamesData.filter(
          (game: ScheduledGame) => isSameDate(parseLocalDate(game.date), date),
        );
        setSelectedDateGames(todaysGames);
      }
    },
    [listOfGamesData, loadingListOfGamesData, setSelectedDateGames],
  );
  const updatePastGames = useCallback(async () => {
    if (!loadingListOfGamesData) {
      const gamesThatNeedToUpdate: ScheduledGame[] = listOfGamesData.filter(
        (game: ScheduledGame) => doesGameNeedToUpdate(game),
      );
      if (gamesThatNeedToUpdate.length === 0) return;

      const updatedGamesList: ScheduledGame[] = [...listOfGamesData];
      for (const game of gamesThatNeedToUpdate) {
        const updatedGame: ScheduledGame | undefined = await updateGame(game);
        if (updatedGame) {
          const index = updatedGamesList.findIndex(
            (g: ScheduledGame) => g.gameId === updatedGame.gameId,
          );
          updatedGamesList[index] = updatedGame;
          UpdateGameDB(updatedGame);
        }
      }
      setListOfGamesData(updatedGamesList);
    }
  }, [listOfGamesData, loadingListOfGamesData]);

  async function updateGame(game: ScheduledGame) {
    try {
      const id = game.gameId;
      const response = await GetGameDetails(id);
      if (!response?.homeTeam || !response?.awayTeam) {
        return undefined;
      }
      const updatedGame = new ScheduledGame(
        game.gameId,
        game.date,
        game.gameTime,
        game.dayOfWeek,
        game.venue,
        game.homeTeam,
        game.homeLogo,
        response.homeTeam.score ?? game.homeScore,
        game.awayTeam,
        game.awayLogo,
        response.awayTeam.score ?? game.awayScore,
        game.broadcasts,
        "",
        game.gameCenter,
        game.isPlayoff,
        game.playoffRound,
        game.periodType,
        game.seriesWins,
        game.topSeedTeamAbbrev,
        game.bottomSeedTeamAbbrev,
        game.gameState
      );
      return updatedGame;
    } catch (error) {
      console.error("Error updating game: ", error);
    }
  }

  function doesGameNeedToUpdate(game: ScheduledGame) {
    const gameDate = parseLocalDate(game.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      gameDate < today &&
      game.homeScore === undefined &&
      game.awayScore === undefined
    );
  }

  function parseLocalDate(dateStr: string | Date): Date {
    if (dateStr instanceof Date) {
      return new Date(
        dateStr.getFullYear(),
        dateStr.getMonth(),
        dateStr.getDate(),
      );
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function isSameDate(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  useEffect(() => {
    GetListOfGames();
  }, []);

  useEffect(() => {
    if (!loadingListOfGamesData && listOfGamesData.length > 0) {
      const currentDate: Date = new Date();
      updatePastGames();
      fetchGamesByDate(currentDate);
    }
  }, [
    loadingListOfGamesData,
    listOfGamesData,
    updatePastGames,
    fetchGamesByDate,
  ]);
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
