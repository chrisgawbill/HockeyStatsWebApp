import { createContext, ReactNode, useContext } from "react";
import { TopStatLeader } from "../Models/topStatLeader";
import { useStatLeaders } from "../Hooks/useStatLeaders";
import { STAT_LEADER_TYPES } from "../Constants/statLeaderTypes";
import { useSeason } from "./SeasonContext";

interface SkaterLeaderContextValue {
  goalLeaderData: TopStatLeader | undefined;
  assistLeaderData: TopStatLeader | undefined;
  pointsLeaderData: TopStatLeader | undefined;
  faceoffLeadersData: TopStatLeader | undefined;
  loadingSkaterLeaderData: boolean;
}

const SkaterStatLeaderContext = createContext<SkaterLeaderContextValue | null>(null);

/**
 * Loads skater stat leaders for the current season via useStatLeaders and exposes
 * each category (goals, assists, points, faceoffs) under a named field for the UI.
 */
function SkaterStatLeaderProvider({ children }: { children: ReactNode }) {
  const { season } = useSeason();
  const { leaders, loading } = useStatLeaders(STAT_LEADER_TYPES.SKATER, season);
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
}

function useSkaterLeaderData(): SkaterLeaderContextValue {
  const context = useContext(SkaterStatLeaderContext);
  if (!context) throw new Error("useSkaterLeaderData must be used within SkaterStatLeaderProvider");
  return context;
}

export { SkaterStatLeaderProvider, useSkaterLeaderData };
