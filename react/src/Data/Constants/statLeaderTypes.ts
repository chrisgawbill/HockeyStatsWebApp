import {
  GetSkaterStatLeaders,
  GetGoalieStatLeaders,
} from '../../Services/apiHandler';

export const STAT_LEADER_TYPES = {
  SKATER: 'skater',
  GOALIE: 'goalie',
} as const;

export type StatLeaderType =
  (typeof STAT_LEADER_TYPES)[keyof typeof STAT_LEADER_TYPES];

export interface StatEntry {
  displayKey: string;
  apiKey: string;
}

interface StatLeaderConfig {
  stats: StatEntry[];
  fetcher: (statIndicator: string, season?: string) => Promise<any>;
}

/**
 * Stat-leader load plan per player type. `displayKey` is the UI bucket label;
 * `apiKey` is the NHL stat category passed to the backend route.
 */
export const STAT_CONFIG: Record<StatLeaderType, StatLeaderConfig> = {
  [STAT_LEADER_TYPES.SKATER]: {
    stats: [
      { displayKey: 'Goals', apiKey: 'goals' },
      { displayKey: 'Assists', apiKey: 'assists' },
      { displayKey: 'Points', apiKey: 'points' },
      { displayKey: 'Faceoffs', apiKey: 'faceoffLeaders' },
    ],
    fetcher: GetSkaterStatLeaders,
  },
  [STAT_LEADER_TYPES.GOALIE]: {
    stats: [
      { displayKey: 'Wins', apiKey: 'wins' },
      { displayKey: 'SV%', apiKey: 'savePctg' },
      { displayKey: 'GAA', apiKey: 'goalsAgainstAverage' },
      { displayKey: 'Shutouts', apiKey: 'shutouts' },
    ],
    fetcher: GetGoalieStatLeaders,
  },
};
