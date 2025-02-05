import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { localTeamList } from "../LocalData/TeamListData";
import { GetTeamStatsById } from "../../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Helpers/TeamHelpers";
import { Team } from "../Models/Team";

const ListOfTeamsContext = createContext<any>(null);

const ListOfTeamsDataProvider = ({ children }: { children: ReactNode }) => {
  const teamListData = React.useRef<any[]>([]);
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] = useState<boolean>(true);

  async function GetTeams() {
    const cachedListOfTeams = localStorage.getItem('listOfTeams-key');
    if(cachedListOfTeams){
        setListOfTeamsData(JSON.parse(cachedListOfTeams));
        setLoadingListOfTeamsData(false);
    }else{
        let rawLocalList: any[] = localTeamList;
        rawLocalList.sort((a, b) => {
          return b.fullName - a.fullName;
        });
        teamListData.current = rawLocalList;
        try {
          const temStatsData = await GetTeamStatsById("");
          const rawData: any[] = temStatsData.data;
          const finalTeamData = ConvertToListOfTeams(teamListData.current, rawData);
          localStorage.setItem('listOfTeams-key', JSON.stringify(finalTeamData));
          setListOfTeamsData(finalTeamData);
        } catch (error) {
          console.error("Error fetching data: ", error);
        }finally{
            setLoadingListOfTeamsData(false);
        }
    }
  }
  useEffect(() => {GetTeams()},[]);
  return (
    <ListOfTeamsContext.Provider value={{ listOfTeamsData, loadingListOfTeamsData }}>
      {children}
    </ListOfTeamsContext.Provider>
  );
};
const useListOfTeamsData = () => useContext(ListOfTeamsContext);
export { ListOfTeamsDataProvider, useListOfTeamsData };
