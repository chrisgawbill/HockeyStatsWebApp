import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { PlayerStatLeader } from "../Models/PlayerStatLeader";
import { TopStatLeader } from "../Models/TopStatLeader";
import { GetSkaterStatLeaders } from "../../Services/ApiHandler";
import PlayerStatLeaderConverter from "../Helpers/PlayerStatLeaderConverter";
import { getTopStatLeader, storeTopStatLeader } from "../Helpers/LocalDB/TopStatLeadersDBHelpers";

const SkaterStatLeaderContext = createContext<any>(null);

const SkaterStatLeaderProvider = ({children}: {children:ReactNode}) => {
      //All use states for stat leader data pertaining to skaters
      const [goalLeaderData, setGoalLeaderData] = useState<TopStatLeader>();
      const [assistLeaderData, setAssistLeaderData] = useState<TopStatLeader>();
      const [pointsLeaderData, setPointsLeaderData] = useState<TopStatLeader>();
      const [faceoffLeadersData, setFaceoffLeadersData] = useState<TopStatLeader>();
    
      const loadingRefs = useRef({
        loadingGoals:true,
        loadingAssists:true,
        loadingPoints:true,
        loadingFaceoffs:true
      })

      const [loadingSkaterLeaderData, setLoadingSkaterLeaderData] = useState<boolean>(true);

      function CheckLoadingStatus(){
        const allStatsLoaded = !Object.values(loadingRefs.current).includes(true);
        if(allStatsLoaded){
            setLoadingSkaterLeaderData(false);
        }
      }
      async function GetSkaterGoalLeaders() {
        try {
          const cachedGoalLeader: TopStatLeader = await getTopStatLeader("Goals");
          if (cachedGoalLeader) {
            setGoalLeaderData(cachedGoalLeader);
          } else {
            const data = await GetSkaterStatLeaders("goals");
            const goalStatLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "goals"
            );
            const goalLeader: PlayerStatLeader = goalStatLeaders[0];
            const topGoalLeader: TopStatLeader = new TopStatLeader(
              "Goals",
              goalLeader,
              goalStatLeaders
            );
            storeTopStatLeader(topGoalLeader);
            setGoalLeaderData(topGoalLeader);
          }
        } catch (error) {
          console.error("Error fetching goals: ", error);
        } finally {
          loadingRefs.current.loadingGoals = false;
          CheckLoadingStatus();
        }
      }
      async function GetSkaterAssistLeaders() {
        try {
          const cachedAssistLeader: TopStatLeader = await getTopStatLeader("Assists");
          if (cachedAssistLeader) {
            setAssistLeaderData(cachedAssistLeader);
          } else {
            const data = await GetSkaterStatLeaders("assists");
            const assistLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "assists"
            );
            const assistLeader: PlayerStatLeader = assistLeaders[0];
            const topAssistLeader: TopStatLeader = new TopStatLeader(
              "Assists",
              assistLeader,
              assistLeaders
            );
            storeTopStatLeader(topAssistLeader);
            setAssistLeaderData(topAssistLeader);
          }
        } catch (error) {
          console.error("Error fetching assists: ", error);
        } finally {
          loadingRefs.current.loadingAssists = false;
          CheckLoadingStatus();
        }
      }
      async function GetSkaterPointsLeader() {
        try {
          const cachedPointsLeader: TopStatLeader = await getTopStatLeader("Points");
          if (cachedPointsLeader) {
            setPointsLeaderData(cachedPointsLeader);
          } else {
            const data = await GetSkaterStatLeaders("points");
            const pointsLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "points"
            );
            const pointsLeader: PlayerStatLeader = pointsLeaders[0];
            const topPointsLeader: TopStatLeader = new TopStatLeader(
              "Points",
              pointsLeader,
              pointsLeaders
            );
            storeTopStatLeader(topPointsLeader);
            setPointsLeaderData(topPointsLeader);
          }
        } catch (error) {
          console.error("Error fetching points: ", error);
        } finally {
          loadingRefs.current.loadingPoints = false;
          CheckLoadingStatus();
        }
      }
      async function GetSkaterFaceoffLeader() {
        try {
          const cachedFaceoffLeader: TopStatLeader = await getTopStatLeader("Faceoffs");
          if (cachedFaceoffLeader) {
            setFaceoffLeadersData(cachedFaceoffLeader);
          } else {
            const data = await GetSkaterStatLeaders("faceoffLeaders");
            const faceoffLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
              data,
              "faceoffLeaders"
            );
            const faceoffLeader: PlayerStatLeader = faceoffLeaders[0];
            const topFaceoffLeader: TopStatLeader = new TopStatLeader(
              "Faceoffs",
              faceoffLeader,
              faceoffLeaders
            );
            storeTopStatLeader(topFaceoffLeader);
            setFaceoffLeadersData(topFaceoffLeader);
          }
        } catch (error) {
          console.error("Error fetching faceoff leaders: ", error);
        } finally {
          loadingRefs.current.loadingFaceoffs = false;
          CheckLoadingStatus();
        }
      }
      async function FetchAllData(){
        try{
            await Promise.all([
                GetSkaterGoalLeaders(),
                GetSkaterAssistLeaders(),
                GetSkaterPointsLeader(),
                GetSkaterFaceoffLeader(),
            ]);
        }finally{
            CheckLoadingStatus();
        }
    }
      useEffect(() => {
        FetchAllData();
      }, []);

      return(
        <SkaterStatLeaderContext.Provider value={{goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData, loadingSkaterLeaderData}}>
            {children}
        </SkaterStatLeaderContext.Provider>
      );
}

const useSkaterLeaderData = () => useContext(SkaterStatLeaderContext);
export{SkaterStatLeaderProvider, useSkaterLeaderData};