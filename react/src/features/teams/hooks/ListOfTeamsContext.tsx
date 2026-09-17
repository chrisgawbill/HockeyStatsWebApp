import React, {
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

function ListOfTeamsDataProvider({ children }: { children: ReactNode }) {
  const teamListData = React.useRef<any[]>([]);
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] =
    useState<boolean>(true);
  const [errorListOfTeamsData, setErrorListOfTeamsData] = useState<
    string | null
  >(null);
  const { season } = useSeason();

  /** Fetches season stats and merges them onto the local team list. */
  const GetTeams = useCallback(async () => {
    setErrorListOfTeamsData(null);
    let rawLocalList: any[] = [...localTeamList];
    rawLocalList.sort((a, b) => b.fullName.localeCompare(a.fullName));
    teamListData.current = rawLocalList;
    try {
      const teamStatsData = await GetTeamStatsById('', season);
      const finalTeamData = ConvertToListOfTeams(
        teamListData.current,
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
    GetTeams();
  }, [GetTeams]);

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
function useListOfTeamsData(): ListOfTeamsData {
  const context = useContext(ListOfTeamsContext);
  if (!context)
    throw new Error(
      'useListOfTeamsData must be used within ListOfTeamsDataProvider',
    );
  return context;
}
export { ListOfTeamsDataProvider, useListOfTeamsData };
