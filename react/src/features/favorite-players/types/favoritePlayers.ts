import type { FanTier } from '@/lib/favoriteCategory';
import type { TeamFormGame, TeamResultOutcome } from '@/lib/teamForm';

/** A favorited player as stored by the API (display fields from the NHL). */
export interface FavoritePlayer {
  playerId: number;
  name: string;
  teamTriCode: string | null;
  position: string | null;
  headshot: string | null;
  /** ISO timestamp when it was favorited. */
  since: string;
  tier: FanTier;
  label: string | null;
  /** Left out of the Monday weekly-report push. */
  pushMuted: boolean;
}

export interface SkaterWeekStats {
  gp: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  /** "mm:ss". */
  toiPerGame: string | null;
  /** e.g. "1G 3A vs CGY, Oct 14"; null when the player had no points. */
  bestGame: { gameId: number; text: string } | null;
}

export interface GoalieWeekStats {
  gp: number;
  wins: number;
  losses: number;
  otLosses: number;
  /** "W-L-OTL". */
  record: string;
  savePct: number | null;
  gaa: number | null;
  shutouts: number;
}

interface WeeklyReportPlayerBase {
  playerId: number;
  name: string;
  position: string | null;
  headshot: string | null;
  /** Team at the end of the week (the stored team when he did not play). */
  team: string | null;
  /** Every team he played for that week (two after a trade). */
  teams: string[];
  played: boolean;
  /** Games the stored team played that week, for "Did not play". */
  teamGames: number;
}

export type WeeklyReportPlayer =
  | (WeeklyReportPlayerBase & {
      type: 'skater';
      stats: SkaterWeekStats | null;
    })
  | (WeeklyReportPlayerBase & {
      type: 'goalie';
      stats: GoalieWeekStats | null;
    });

/** One of a favorite team's games in the report week, from its side. */
export interface WeeklyReportTeamGame {
  gameId: number;
  /** YYYY-MM-DD. */
  date: string;
  opponent: string;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  outcome: TeamResultOutcome;
}

/** A completed regular-season game through the week's end, for Team Form. */
export type WeeklyReportFormGame = Omit<TeamFormGame, 'date'> & {
  /** YYYY-MM-DD. */
  date: string;
};

/** A favorite team frozen into the report (API-WPR-02). */
export interface WeeklyReportTeam {
  triCode: string;
  name: string;
  logo: string | null;
  tier: FanTier;
  label: string | null;
  weekGames: WeeklyReportTeamGame[];
  formGames: WeeklyReportFormGame[];
}

/** One frozen Monday–Sunday (Eastern) Weekly Player Report. */
export interface WeeklyPlayerReport {
  /** Monday, YYYY-MM-DD. */
  weekStart: string;
  weekEnd: string;
  /** "Oct 13–19". */
  label: string;
  headline: string;
  players: WeeklyReportPlayer[];
  /** Favorite teams; absent on reports made before API-WPR-02. */
  teams?: WeeklyReportTeam[];
  /** ISO timestamp the report was generated. */
  createdAt: string;
  read: boolean;
}

export interface WeeklyPlayerReportInbox {
  reports: WeeklyPlayerReport[];
  unreadCount: number;
}
