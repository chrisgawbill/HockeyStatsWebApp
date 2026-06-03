import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ScheduledGame } from "../Models/scheduledGame";
import { GetGameDetails, GetScheduledGames } from "../../Services/apiHandler";
import { ConvertContractsToGames, parseLocalDate } from "../Helpers/scheduleHelper";
import { useSeason } from "./SeasonContext";

const ListOfGamesContext = createContext<any>(null);

/**
 * Loads the selected season's full schedule once and shares it. Every schedule
 * view (day/week/month) is a client-side projection of this one array, so only a
 * season change triggers a re-fetch. Also exposes the games for a chosen day and
 * a setter to change that day.
 */
function ListOfGamesProvider({ children }: { children: ReactNode }) {
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  const [loadingListOfGamesData, setLoadingListOfGamesData] = useState<boolean>(true);
  const [selectedDateGames, setSelectedDateGames] = useState<ScheduledGame[]>([]);
  const { season } = useSeason();

  /**
   * Fetches the full schedule for one season, converts backend contracts into
   * ScheduledGame models, and stores the result for every schedule view to
   * project locally.
   */
  async function fetchGames(seasonId: string) {
    try {
      const response = await GetScheduledGames(seasonId);
      setListOfGamesData(ConvertContractsToGames(response.games));
    } catch (error) {
      console.error("Error fetching games: ", error);
    } finally {
      setLoadingListOfGamesData(false);
    }
  }

  /**
   * Filters the loaded season schedule to one local calendar day and stores it
   * for the day view. It returns no data directly; consumers read
   * `selectedDateGames` from context after this runs.
   */
  const fetchGamesByDate = useCallback(
    async (date: Date) => {
      if (!loadingListOfGamesData) {
        const todaysGames: ScheduledGame[] = listOfGamesData.filter(
          (game: ScheduledGame) => isSameDate(game.date, date),
        );
        setSelectedDateGames(todaysGames);
      }
    },
    [listOfGamesData, loadingListOfGamesData],
  );

  /**
   * Finds completed games whose schedule entry lacks a score, fetches each game
   * detail payload, and swaps scored copies into `listOfGamesData`. This keeps
   * stale schedule-cache rows useful without reloading the whole season.
   */
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
        }
      }
      setListOfGamesData(updatedGamesList);
    }
  }, [listOfGamesData, loadingListOfGamesData]);

  /**
   * Fetches one game-detail payload and returns a ScheduledGame copy with scores
   * filled from the detail response. Returns undefined when the detail payload is
   * missing the team data needed to update safely.
   */
  async function updateGame(game: ScheduledGame) {
    try {
      const response = await GetGameDetails(game.gameId);
      if (!response?.homeTeam || !response?.awayTeam) return undefined;
      return new ScheduledGame(
        game.gameId, game.date, game.gameTime, game.dayOfWeek, game.venue,
        game.homeTeam, game.homeLogo, response.homeTeam.score ?? game.homeScore,
        game.awayTeam, game.awayLogo, response.awayTeam.score ?? game.awayScore,
        game.broadcasts, "", game.gameCenter, game.isPlayoff, game.playoffRound,
        game.periodType, game.seriesWins, game.topSeedTeamAbbrev,
        game.bottomSeedTeamAbbrev, game.gameState,
      );
    } catch (error) {
      console.error("Error updating game: ", error);
    }
  }

  /**
   * Returns true when a game is in the past and both scores are still absent.
   * `== null` is deliberate because missing scores can arrive as null or
   * undefined depending on which layer produced the ScheduledGame.
   */
  function doesGameNeedToUpdate(game: ScheduledGame) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return game.date < today && game.homeScore == null && game.awayScore == null;
  }

  /**
   * Compares two Date objects by local calendar day only, ignoring their time.
   */
  function isSameDate(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  useEffect(() => {
    setLoadingListOfGamesData(true);
    setSelectedDateGames([]);
    fetchGames(season);
  }, [season]);

  useEffect(() => {
    if (!loadingListOfGamesData && listOfGamesData.length > 0) {
      updatePastGames();
      fetchGamesByDate(new Date());
    }
  }, [loadingListOfGamesData, listOfGamesData, updatePastGames, fetchGamesByDate]);

  return (
    <ListOfGamesContext.Provider value={{ listOfGamesData, loadingListOfGamesData, selectedDateGames, fetchGamesByDate }}>
      {children}
    </ListOfGamesContext.Provider>
  );
}

function useListOfGames() {
  return useContext(ListOfGamesContext);
}
export { ListOfGamesProvider, useListOfGames };
