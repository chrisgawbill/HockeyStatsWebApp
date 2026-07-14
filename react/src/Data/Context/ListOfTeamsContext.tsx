import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { localTeamList } from '../LocalData/teamListData';
import { GetTeamStatsById } from '../../Services/apiHandler';
import { ConvertToListOfTeams } from '../Helpers/teamHelpers';
import { Team } from '../Models/team';

interface ListOfTeamsData {
  listOfTeamsData: Team[];
  loadingListOfTeamsData: boolean;
}

const ListOfTeamsContext = createContext<ListOfTeamsData | null>(null);

function ListOfTeamsDataProvider({ children }: { children: ReactNode }) {
  const teamListData = React.useRef<any[]>([]);
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] =
    useState<boolean>(true);

  async function GetTeams() {
      let rawLocalList: any[] = [...localTeamList];
      rawLocalList.sort((a, b) => b.fullName.localeCompare(a.fullName));
      teamListData.current = rawLocalList;
      try {
        const teamStatsData = await GetTeamStatsById('');
        const rawData: any[] = teamStatsData.data || teamStatsData;
        const finalTeamData = ConvertToListOfTeams(
          teamListData.current,
          rawData,
        );
        setListOfTeamsData(finalTeamData);
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoadingListOfTeamsData(false);
      }
    }
  useEffect(() => {
    GetTeams();
  }, []);
  return (
    <ListOfTeamsContext.Provider
      value={{ listOfTeamsData, loadingListOfTeamsData }}
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
