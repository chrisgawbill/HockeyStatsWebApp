import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { GetScheduledGames } from '@/features/schedule/api/scheduleApi';
import { GetGameDetails } from '@/features/game-detail/api/gameDetailApi';
import {
  getScheduleClockLabel,
  LIVE_POLL_INTERVAL_MS,
} from '@/features/game-detail/utils/gameDetailHelper';
import { ConvertContractsToGames } from '@/features/schedule/utils/scheduleHelper';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useLeague } from '@/lib/LeagueContext';
import { League } from '@/lib/league';
import { isCompletedGameState, isInProgressGameState } from '@/lib/gameStatus';

interface ListOfGamesData {
  listOfGamesData: ScheduledGame[];
  loadingListOfGamesData: boolean;
  errorListOfGamesData: string | null;
  selectedDateGames: ScheduledGame[];
  fetchGamesByDate: (date: Date) => Promise<void>;
  refetchGames: () => void;
}

const ListOfGamesContext = createContext<ListOfGamesData | null>(null);

/**
 * Loads the selected season's full schedule once and shares it. Every schedule
 * view (day/week/month) is a client-side projection of this one array, so only a
 * season or league change triggers a re-fetch. Also exposes the games for a chosen day and
 * a setter to change that day.
 */
function ListOfGamesProvider({ children }: { children: ReactNode }) {
  const [listOfGamesData, setListOfGamesData] = useState<ScheduledGame[]>([]);
  const [loadingListOfGamesData, setLoadingListOfGamesData] =
    useState<boolean>(true);
  const [errorListOfGamesData, setErrorListOfGamesData] = useState<
    string | null
  >(null);
  const [selectedDateGames, setSelectedDateGames] = useState<ScheduledGame[]>(
    [],
  );
  const { season } = useSeason();
  const { league } = useLeague();
  const latestRequest = useRef(0);
  // Games whose scores were already backfilled (or attempted) for the loaded
  // season, so updatePastGames requests each game detail at most once.
  const backfilledGameIds = useRef(new Set<number>());
  // Latest games for the live poll's interval, which outlives each render.
  const latestGames = useRef<ScheduledGame[]>([]);
  latestGames.current = listOfGamesData;

  /**
   * Fetches the full schedule for one season, converts backend contracts into
   * ScheduledGame models, and stores the result for every schedule view to
   * project locally. On failure it clears any stale games (rather than leaving
   * the previous season's schedule on screen) and stores a human-readable
   * message for the UI instead of the raw API error.
   */
  const fetchGames = useCallback(async (seasonId: string, league: League) => {
    const requestId = ++latestRequest.current;
    const isStale = () => requestId !== latestRequest.current;
    setErrorListOfGamesData(null);
    try {
      const response = await GetScheduledGames(seasonId, league);
      if (isStale()) return;
      backfilledGameIds.current = new Set();
      setListOfGamesData(ConvertContractsToGames(response.games));
    } catch (error) {
      if (isStale()) return;
      console.error('Error fetching games: ', error);
      setErrorListOfGamesData("Couldn't load the schedule.");
      setListOfGamesData([]);
    } finally {
      if (!isStale()) setLoadingListOfGamesData(false);
    }
  }, []);

  /**
   * Re-runs the season fetch for the current `season`. Shared by the mount/
   * season-change effect and the manual "Try again" retry action so there is
   * one fetch code path instead of two copies of the same reset-then-fetch
   * sequence.
   */
  const refetchGames = useCallback(() => {
    setLoadingListOfGamesData(true);
    setSelectedDateGames([]);
    fetchGames(season, league);
  }, [season, league, fetchGames]);

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
   * Finds past games whose schedule entry lacks a score or a final state,
   * fetches each game detail payload, and swaps updated copies into
   * `listOfGamesData`. This keeps stale schedule-cache rows useful without
   * reloading the whole season. Each
   * game is attempted once per season load: the state update below re-runs
   * this effect, and a game that still has no score (failed request, postponed
   * game) would otherwise be re-requested in an endless loop.
   */
  const updatePastGames = useCallback(async () => {
    if (!loadingListOfGamesData) {
      const gamesThatNeedToUpdate: ScheduledGame[] = listOfGamesData.filter(
        (game: ScheduledGame) =>
          !backfilledGameIds.current.has(game.gameId) &&
          doesGameNeedToUpdate(game),
      );
      if (gamesThatNeedToUpdate.length === 0) return;
      for (const game of gamesThatNeedToUpdate) {
        backfilledGameIds.current.add(game.gameId);
      }

      const updatedGames = await Promise.all(
        gamesThatNeedToUpdate.map((game) => updateGame(game)),
      );

      const refreshedGamesById = new Map<number, ScheduledGame>();
      for (const game of updatedGames) {
        if (game) refreshedGamesById.set(game.gameId, game);
      }
      if (refreshedGamesById.size === 0) return;

      setListOfGamesData((currentGames) =>
        currentGames.map((game) => refreshedGamesById.get(game.gameId) ?? game),
      );
    }
  }, [listOfGamesData, loadingListOfGamesData]);

  /**
   * Fetches one game-detail payload and returns a ScheduledGame copy with the
   * scores, game state and period type from the detail response. Returns
   * undefined when the detail payload is missing the team data needed to
   * update safely.
   */
  async function updateGame(game: ScheduledGame) {
    try {
      const response = await GetGameDetails(game.gameId, league);
      if (!response?.homeTeam || !response?.awayTeam) return undefined;
      return new ScheduledGame(
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
        '',
        game.gameCenter,
        game.isPlayoff,
        game.isPreseason,
        game.playoffRound,
        response.periodDescriptor?.periodType ?? game.periodType,
        game.seriesWins,
        game.topSeedTeamAbbrev,
        game.bottomSeedTeamAbbrev,
        response.gameState ?? game.gameState,
        getScheduleClockLabel(response),
      );
    } catch (error) {
      console.error('Error updating game: ', error);
    }
  }

  /**
   * Returns true when a game is in the past and either both scores are still
   * absent or it is not yet marked final. `== null` is deliberate because
   * missing scores can arrive as null or undefined depending on which layer
   * produced the ScheduledGame.
   */
  function doesGameNeedToUpdate(game: ScheduledGame) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isMissingScores = game.homeScore == null && game.awayScore == null;
    return (
      game.date < today &&
      (isMissingScores || !isCompletedGameState(game.gameState))
    );
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
    refetchGames();
  }, [refetchGames]);

  useEffect(() => {
    if (!loadingListOfGamesData && listOfGamesData.length > 0) {
      updatePastGames();
    }
  }, [loadingListOfGamesData, listOfGamesData, updatePastGames]);

  /**
   * Refreshes every in-progress game's score and clock from its boxscore,
   * right away and then every LIVE_POLL_INTERVAL_MS while the season is
   * loaded.
   */
  useEffect(() => {
    if (loadingListOfGamesData) return;
    let cancelled = false;
    async function refreshLiveGames() {
      const liveGames = latestGames.current.filter((game) =>
        isInProgressGameState(game.gameState),
      );
      if (liveGames.length === 0) return;
      const updatedGames = await Promise.all(liveGames.map(updateGame));
      if (cancelled) return;
      const refreshedGamesById = new Map<number, ScheduledGame>();
      for (const game of updatedGames) {
        if (game) refreshedGamesById.set(game.gameId, game);
      }
      if (refreshedGamesById.size === 0) return;
      setListOfGamesData((currentGames) =>
        currentGames.map((game) => refreshedGamesById.get(game.gameId) ?? game),
      );
    }
    refreshLiveGames();
    const interval = window.setInterval(
      refreshLiveGames,
      LIVE_POLL_INTERVAL_MS,
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadingListOfGamesData]);

  return (
    <ListOfGamesContext.Provider
      value={{
        listOfGamesData,
        loadingListOfGamesData,
        errorListOfGamesData,
        selectedDateGames,
        fetchGamesByDate,
        refetchGames,
      }}
    >
      {children}
    </ListOfGamesContext.Provider>
  );
}

/** Reads the season schedule; throws outside the schedule provider. */
function useListOfGames(): ListOfGamesData {
  const context = useContext(ListOfGamesContext);
  if (!context)
    throw new Error('useListOfGames must be used within ListOfGamesProvider');
  return context;
}
export { ListOfGamesProvider, useListOfGames };
