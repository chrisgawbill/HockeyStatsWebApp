import { createContext, ReactNode, useContext } from "react";
import { TopStatLeader } from "../Models/TopStatLeader";
import { useStatLeaders } from "../Hooks/useStatLeaders";
import { STAT_LEADER_TYPES } from "../Constants/StatLeaderTypes";

interface GoalieLeaderContextValue {
  winsLeaderData: TopStatLeader | undefined;
  savePercentageLeaderData: TopStatLeader | undefined;
  gaaLeaderData: TopStatLeader | undefined;
  shutoutLeaderData: TopStatLeader | undefined;
  loadingGoalieLeaderData: boolean;
}

const GoalieLeaderContext = createContext<GoalieLeaderContextValue | null>(null);

const GoalieLeaderDataProvider = ({ children }: { children: ReactNode }) => {
  const { leaders, loading } = useStatLeaders(STAT_LEADER_TYPES.GOALIE);
  return (
    <GoalieLeaderContext.Provider value={{
      winsLeaderData:           leaders['Wins'],
      savePercentageLeaderData: leaders['SV%'],
      gaaLeaderData:            leaders['GAA'],
      shutoutLeaderData:        leaders['Shutouts'],
      loadingGoalieLeaderData:  loading,
    }}>
      {children}
    </GoalieLeaderContext.Provider>
  );
};

const useGoalieLeaderData = (): GoalieLeaderContextValue => {
  const context = useContext(GoalieLeaderContext);
  if (!context) throw new Error("useGoalieLeaderData must be used within GoalieLeaderDataProvider");
  return context;
};

export { GoalieLeaderDataProvider, useGoalieLeaderData };
