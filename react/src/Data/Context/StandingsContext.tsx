import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { StandingsTeam } from "../Models/StandingsTeam";
import { GetCurrentStandings } from "../../Services/ApiHandler";
import { CreateLeagueStandingsArray } from "../Helpers/LeagueStandingsHelper";

interface StandingsData {
  easternStandingsData: StandingsTeam[];
  westernStandingsData: StandingsTeam[];
  metropolitanStandings: StandingsTeam[];
  atlanticStandings: StandingsTeam[];
  centralStandings: StandingsTeam[];
  pacificStandings: StandingsTeam[];
  draftLotteryOdds: StandingsTeam[];
  loadingStandingsData: boolean;
}

export const StandingsContext = createContext<StandingsData | null>(null);

const StandingsDataProvider = ({ children }: { children: ReactNode }) => {
  const [easternStandingsData, setEasternStandingsData] = useState<StandingsTeam[]>([]);
  const [westernStandingsData, setWesternStandingsData] = useState<StandingsTeam[]>([]);
  const [metropolitanStandings, setMetropolitanStandings] = useState<StandingsTeam[]>([]);
  const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam[]>([]);
  const [centralStandings, setCentralStandings] = useState<StandingsTeam[]>([]);
  const [pacificStandings, setPacificStandings] = useState<StandingsTeam[]>([]);
  const [draftLotteryOdds, setDraftLotteryOdds] = useState<StandingsTeam[]>([]);
  const [loadingStandingsData, setLoadingStandingsData] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const data = await GetCurrentStandings();
        const all: StandingsTeam[] = CreateLeagueStandingsArray(data.standings);

        const byConference = (name: string) =>
          all.filter(t => t.conferenceName === name)
             .sort((a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace);

        const byDivision = (name: string) =>
          all.filter(t => t.divisionName === name)
             .sort((a, b) => a.divisionStandingsPlace - b.divisionStandingsPlace);

        setEasternStandingsData(byConference('Eastern'));
        setWesternStandingsData(byConference('Western'));
        setMetropolitanStandings(byDivision('Metropolitan'));
        setAtlanticStandings(byDivision('Atlantic'));
        setCentralStandings(byDivision('Central'));
        setPacificStandings(byDivision('Pacific'));
        setDraftLotteryOdds(
          all.filter(t => t.draftLotteryOdds > 0)
             .sort((a, b) => b.draftLotteryOdds - a.draftLotteryOdds)
             .slice(0, 16)
        );
      } catch (error) {
        console.error("Error fetching standings: ", error);
      } finally {
        setLoadingStandingsData(false);
      }
    }
    fetchStandings();
  }, []);

  return (
    <StandingsContext.Provider value={{
      easternStandingsData, westernStandingsData, metropolitanStandings,
      atlanticStandings, centralStandings, pacificStandings,
      draftLotteryOdds, loadingStandingsData,
    }}>
      {children}
    </StandingsContext.Provider>
  );
};

export const useStandingsContext = (): StandingsData => {
  const context = useContext(StandingsContext);
  if (!context) throw new Error("useStandingsContext must be used within StandingsDataProvider");
  return context;
};

export const useDraftLotteryOddsData = () => useStandingsContext().draftLotteryOdds;

const useStandingsData = () => useContext(StandingsContext);
export { StandingsDataProvider, useStandingsData };
