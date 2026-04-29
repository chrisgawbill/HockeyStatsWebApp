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
      async function GetSkaterGoalLeaders(){
        const cachedGoalLeader:TopStatLeader = await getTopStatLeader("Goals");
        if(cachedGoalLeader){
            setGoalLeaderData(cachedGoalLeader);
            loadingRefs.current.loadingGoals = false;
        }else{
            try{
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
                loadingRefs.current.loadingGoals = false;
              }catch(error){
                console.error("Error fetching goals: ", error);
              }
        }
      }
      async function GetSkaterAssistLeaders(){
        const cachedAssistLeader:TopStatLeader = await getTopStatLeader("Assists");
        if(cachedAssistLeader){
            setAssistLeaderData(cachedAssistLeader);
            loadingRefs.current.loadingAssists = false;
        }else{
            try{
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
                loadingRefs.current.loadingAssists = false;
              }catch(error){
                console.error("Error fetching assists: ", error);
              }
        }
      }
      async function GetSkaterPointsLeader(){
        const cachedPointsLeader:TopStatLeader = await getTopStatLeader("Points");
        if(cachedPointsLeader){
            setPointsLeaderData(cachedPointsLeader);
            loadingRefs.current.loadingPoints = false;
        }else{
            try{
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
                loadingRefs.current.loadingPoints = false;
              }catch(error){
                console.error("Error fetching points: ", error);
              }
        }
      }
      async function GetSkaterFaceoffLeader(){
        const cachedFaceoffLeader:TopStatLeader = await getTopStatLeader("Faceoffs");
        if(cachedFaceoffLeader){
            setFaceoffLeadersData(cachedFaceoffLeader);
            loadingRefs.current.loadingFaceoffs = false;
        }else{
            try{  
                const data = await GetSkaterStatLeaders("faceoffLeaders");
                const faceoffLeaders:PlayerStatLeader[] = PlayerStatLeaderConverter(
                  data,
                  "faceoffLeaders"
                );
                const faceoffLeader:PlayerStatLeader = faceoffLeaders[0];
                const topFaceoffLeader: TopStatLeader = new TopStatLeader(
                  "Faceoffs",
                  faceoffLeader,
                  faceoffLeaders
                );
                storeTopStatLeader(topFaceoffLeader);
                setFaceoffLeadersData(topFaceoffLeader);
                loadingRefs.current.loadingFaceoffs = false;
              }catch(error){
                console.error("Error fetching faceoff leaders: ", error);
              }
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