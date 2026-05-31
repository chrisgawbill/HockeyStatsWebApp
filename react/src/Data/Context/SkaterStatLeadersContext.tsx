import { createContext, ReactNode, useContext } from "react";
import { TopStatLeader } from "../Models/TopStatLeader";
import { useStatLeaders } from "../Hooks/useStatLeaders";
import { STAT_LEADER_TYPES } from "../Constants/StatLeaderTypes";

interface SkaterLeaderContextValue {
  goalLeaderData: TopStatLeader | undefined;
  assistLeaderData: TopStatLeader | undefined;
  pointsLeaderData: TopStatLeader | undefined;
  faceoffLeadersData: TopStatLeader | undefined;
  loadingSkaterLeaderData: boolean;
}

const SkaterStatLeaderContext = createContext<SkaterLeaderContextValue | null>(null);

const SkaterStatLeaderProvider = ({ children }: { children: ReactNode }) => {
  const { leaders, loading } = useStatLeaders(STAT_LEADER_TYPES.SKATER);
  return (
    <SkaterStatLeaderContext.Provider value={{
      goalLeaderData:      leaders['Goals'],
      assistLeaderData:    leaders['Assists'],
      pointsLeaderData:    leaders['Points'],
      faceoffLeadersData:  leaders['Faceoffs'],
      loadingSkaterLeaderData: loading,
    }}>
      {children}
    </SkaterStatLeaderContext.Provider>
  );
};

const useSkaterLeaderData = () => useContext(SkaterStatLeaderContext);
export { SkaterStatLeaderProvider, useSkaterLeaderData };
