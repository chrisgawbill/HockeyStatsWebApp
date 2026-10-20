import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { localTeamList } from '@/lib/teamListData';
import { GetTeamStatsById } from '@/features/teams/api/teamsApi';
import { ConvertToListOfTeams } from '@/features/teams/utils/teamHelpers';
import { Team } from '@/features/teams/types/team';
import { useSeason } from '@/features/season/hooks/SeasonContext';

interface ListOfTeamsData {
  listOfTeamsData: Team[];
  loadingListOfTeamsData: boolean;
  errorListOfTeamsData: string | null;
  refetchListOfTeams: () => void;
}

const ListOfTeamsContext = createContext<ListOfTeamsData | null>(null);

/** Loads every club with its per-season stats for the selected season and shares it with the team pages. */
function ListOfTeamsDataProvider({ children }: { children: ReactNode }) {
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] =
    useState<boolean>(true);
  const [errorListOfTeamsData, setErrorListOfTeamsData] = useState<
    string | null
  >(null);
  const { season } = useSeason();

  /** Fetches season stats and merges them onto the local team list. */
  const loadTeams = useCallback(async () => {
    setErrorListOfTeamsData(null);
    const sortedLocalTeams = [...localTeamList].sort((first, second) =>
      second.fullName.localeCompare(first.fullName),
    );
    try {
      const teamStatsData = await GetTeamStatsById('', season);
      const finalTeamData = ConvertToListOfTeams(
        sortedLocalTeams,
        teamStatsData.data,
      );
      setListOfTeamsData(finalTeamData);
    } catch (error) {
      console.error('Error fetching data: ', error);
      setErrorListOfTeamsData("Couldn't load teams.");
    } finally {
      setLoadingListOfTeamsData(false);
    }
  }, [season]);

  /** Re-runs the team list fetch for the current season. */
  const refetchListOfTeams = useCallback(() => {
    setLoadingListOfTeamsData(true);
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    refetchListOfTeams();
  }, [refetchListOfTeams]);
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
