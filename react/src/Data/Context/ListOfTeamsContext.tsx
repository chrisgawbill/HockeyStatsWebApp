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

function hasValidGoalsPerGame(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;

  const sample = data[0];
  const latest = Array.isArray(sample?.seasonStats)
    ? sample.seasonStats.reduce((best: any, stat: any) =>
        !best || stat.seasonId > best.seasonId ? stat : best,
      )
    : null;

  return typeof latest?.goalsPerGame === "number";
}

const ListOfTeamsDataProvider = ({ children }: { children: ReactNode }) => {
  const teamListData = React.useRef<any[]>([]);
  const [listOfTeamsData, setListOfTeamsData] = useState<Team[]>([]);
  const [loadingListOfTeamsData, setLoadingListOfTeamsData] = useState<boolean>(true);

  async function GetTeams() {
    const cachedListOfTeams = localStorage.getItem('listOfTeams-key');
    if (cachedListOfTeams) {
        try {
          const parsed = JSON.parse(cachedListOfTeams);
          if (hasValidGoalsPerGame(parsed)) {
            setListOfTeamsData(parsed);
            setLoadingListOfTeamsData(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing cached team list", error);
        }
    }
    {
      let rawLocalList: any[] = [...localTeamList];
      rawLocalList.sort((a, b) => b.fullName.localeCompare(a.fullName));
      teamListData.current = rawLocalList;
      try {
        const teamStatsData = await GetTeamStatsById("");
        const rawData: any[] = teamStatsData.data || teamStatsData;
        const finalTeamData = ConvertToListOfTeams(teamListData.current, rawData);
        localStorage.setItem("listOfTeams-key", JSON.stringify(finalTeamData));
        setListOfTeamsData(finalTeamData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
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
