import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { GetCurrentStandings } from "../../Services/ApiHandler";
import { DraftLotteryTeam } from "../Models/DraftLotteryTeam";
import { CreateDraftLotteryOddsArray } from "../Helpers/DraftLotteryOddsHelper";

const DraftLotteryContext = createContext<any>({
  draftLotteryOddsData: [],
  loadingDraftLotteryData: true,
});

const DraftLotteryDataProvider = ({ children }: { children: ReactNode }) => {
  const [draftLotteryOddsData, setDraftLotteryOddsData] = useState<
    DraftLotteryTeam[]
  >([]);
  const [loadingDraftLotteryData, setLoadingDraftLotteryData] =
    useState<boolean>(true);
  //Custom hook that parses and modifies the api data to create draftLotteryOddsArray (which is then set in the useState)
  async function GetDraftLotteryOdds() {
    const cachedDraftLotteryData = localStorage.getItem("draftLottery-key");
    if (cachedDraftLotteryData) {
      setDraftLotteryOddsData(JSON.parse(cachedDraftLotteryData));
      setLoadingDraftLotteryData(false);
    } else {
      try {
        const data = await GetCurrentStandings();
        const draftLotteryOddsArray: DraftLotteryTeam[] =
          CreateDraftLotteryOddsArray(data.standings);
        localStorage.setItem(
          "draftLottery-key",
          JSON.stringify(draftLotteryOddsArray)
        );
        setDraftLotteryOddsData(draftLotteryOddsArray);
      } catch (error) {
        console.error("Error fetching standings: ", error);
      } finally {
        setLoadingDraftLotteryData(false);
      }
    }
  }
  useEffect(() => {
    GetDraftLotteryOdds();
  }, []);
  return (
    <DraftLotteryContext.Provider
      value={{ draftLotteryOddsData, loadingDraftLotteryData }}
    >
      {children}
    </DraftLotteryContext.Provider>
  );
};

const useDraftLotteryData = () => useContext(DraftLotteryContext);
export { DraftLotteryDataProvider, useDraftLotteryData };
