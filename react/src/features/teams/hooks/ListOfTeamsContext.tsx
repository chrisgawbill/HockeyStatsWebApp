import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getTeamList } from '@/lib/teamListData';
import { GetTeamStatsById } from '@/features/teams/api/teamsApi';
import { ConvertToListOfTeams } from '@/features/teams/utils/teamHelpers';
import { Team } from '@/features/teams/types/team';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import { useRefreshOnStatsChange } from '@/lib/statsVersion';

interface ListOfTeamsData {
  listOfTeamsData: Team[];
  loadingListOfTeamsData: boolean;
  errorListOfTeamsData: string | null;
  refetchListOfTeams: () => void;
}

const ListOfTeamsContext = createContext<ListOfTeamsData | null>(null);

/**
 * Loads every club of the selected league with its stats for the selected season and
 * shares it with the team pages. When the API's stored stats change
 * they refresh in the background, keeping the shown list when a refresh fails.
 */
function ListOfTeamsDataProvider({ children }: { children: ReactNode }) {
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] =
    useState<boolean>(true);
  const [errorListOfTeamsData, setErrorListOfTeamsData] = useState<
    string | null
  >(null);
  const { season } = useSeason();
  const { league } = useLeague();
  const requestKey = `${league}:${season}`;
  const requestKeyRef = useRef(requestKey);
  requestKeyRef.current = requestKey;

  /**
   * Fetches season stats and merges them onto the local team list. A `silent`
   * refresh leaves the error state alone; a response for a league or season
   * the user has left is dropped.
   */
  const loadTeams = useCallback(
    async (silent = false) => {
      const isCurrent = () => requestKeyRef.current === requestKey;
      if (!silent) setErrorListOfTeamsData(null);
      const sortedLocalTeams = [...getTeamList(league)].sort((first, second) =>
        second.fullName.localeCompare(first.fullName),
      );
      try {
        const teamStatsData = await GetTeamStatsById('', season, league);
        const finalTeamData = ConvertToListOfTeams(
          sortedLocalTeams,
          teamStatsData.data,
        );
        if (!isCurrent()) return;
        setListOfTeamsData(finalTeamData);
        if (silent) setErrorListOfTeamsData(null);
      } catch (error) {
        console.error('Error fetching data: ', error);
        if (!silent && isCurrent())
          setErrorListOfTeamsData("Couldn't load teams.");
      } finally {
        if (isCurrent()) setLoadingListOfTeamsData(false);
      }
    },
    [season, league, requestKey],
  );

  /** Re-runs the team list fetch for the current season. */
  const refetchListOfTeams = useCallback(() => {
    setLoadingListOfTeamsData(true);
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    refetchListOfTeams();
  }, [refetchListOfTeams]);

  useRefreshOnStatsChange(() => loadTeams(true));
  return (
    <ListOfTeamsContext.Provider
      value={{
        listOfTeamsData,
        loadingListOfTeamsData,
        errorListOfTeamsData,
        refetchListOfTeams,
      }}
    >
      {children}
    </ListOfTeamsContext.Provider>
  );
}
/** Reads the team list; throws outside `ListOfTeamsDataProvider`. */
function useListOfTeamsData(): ListOfTeamsData {
  const context = useContext(ListOfTeamsContext);
  if (!context)
    throw new Error(
      'useListOfTeamsData must be used within ListOfTeamsDataProvider',
    );
  return context;
}
export { ListOfTeamsDataProvider, useListOfTeamsData };
