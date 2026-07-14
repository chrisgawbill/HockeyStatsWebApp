import { createContext, ReactNode, useContext } from 'react';
import { TopStatLeader } from '../Models/topStatLeader';
import { useStatLeaders } from '../Hooks/useStatLeaders';
import { STAT_LEADER_TYPES } from '../Constants/statLeaderTypes';
import { useSeason } from './SeasonContext';

interface SkaterLeaderContextValue {
  goalLeaderData: TopStatLeader | undefined;
  assistLeaderData: TopStatLeader | undefined;
  pointsLeaderData: TopStatLeader | undefined;
  faceoffLeadersData: TopStatLeader | undefined;
  loadingSkaterLeaderData: boolean;
}

interface GoalieLeaderContextValue {
  winsLeaderData: TopStatLeader | undefined;
  savePercentageLeaderData: TopStatLeader | undefined;
  gaaLeaderData: TopStatLeader | undefined;
  shutoutLeaderData: TopStatLeader | undefined;
  loadingGoalieLeaderData: boolean;
}

interface StatLeadersContextValue {
  skater: SkaterLeaderContextValue;
  goalie: GoalieLeaderContextValue;
}

const StatLeadersContext = createContext<StatLeadersContextValue | null>(null);

/**
 * Loads skater and goalie stat leaders for the current season in one place,
 * calling useStatLeaders once per player type, and exposes both category maps.
 */
function StatLeadersProvider({ children }: { children: ReactNode }) {
  const { season } = useSeason();
  const { leaders: skaterLeaders, loading: skaterLoading } = useStatLeaders(
    STAT_LEADER_TYPES.SKATER,
    season,
  );
  const { leaders: goalieLeaders, loading: goalieLoading } = useStatLeaders(
    STAT_LEADER_TYPES.GOALIE,
    season,
  );

  const skater: SkaterLeaderContextValue = {
    goalLeaderData: skaterLeaders['Goals'],
    assistLeaderData: skaterLeaders['Assists'],
    pointsLeaderData: skaterLeaders['Points'],
    faceoffLeadersData: skaterLeaders['Faceoffs'],
    loadingSkaterLeaderData: skaterLoading,
  };
  const goalie: GoalieLeaderContextValue = {
    winsLeaderData: goalieLeaders['Wins'],
    savePercentageLeaderData: goalieLeaders['SV%'],
    gaaLeaderData: goalieLeaders['GAA'],
    shutoutLeaderData: goalieLeaders['Shutouts'],
    loadingGoalieLeaderData: goalieLoading,
  };

  return (
    <StatLeadersContext.Provider value={{ skater, goalie }}>
      {children}
    </StatLeadersContext.Provider>
  );
}

function useSkaterLeaderData(): SkaterLeaderContextValue {
  const context = useContext(StatLeadersContext);
  if (!context)
    throw new Error(
      'useSkaterLeaderData must be used within StatLeadersProvider',
    );
  return context.skater;
}

function useGoalieLeaderData(): GoalieLeaderContextValue {
  const context = useContext(StatLeadersContext);
  if (!context)
    throw new Error(
      'useGoalieLeaderData must be used within StatLeadersProvider',
    );
  return context.goalie;
}

export { StatLeadersProvider, useSkaterLeaderData, useGoalieLeaderData };
