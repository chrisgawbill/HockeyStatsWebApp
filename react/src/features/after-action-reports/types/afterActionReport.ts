import type { FanTier } from '@/lib/favoriteCategory';
import type { League } from '@/lib/league';

/** A favorite team and when it was favorited (ISO timestamp). */
export interface FavoriteTeam {
  /** AHL and NHL tri-codes can match (`TOR`), so a favorite is league + code. */
  league: League;
  triCode: string;
  since: string;
  /** True when phone push is muted for this team (inbox still lists it). */
  pushMuted: boolean;
  tier: FanTier;
  label: string | null;
}

/** One completed game involving at least one of the user's favorite teams. */
export interface AfterActionReport {
  gameId: number;
  /** YYYY-MM-DD game date. */
  date: string;
  /** Start time, ISO UTC. */
  gameTime: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeam: string;
  awayLogo: string;
  awayScore: number | null;
  /** REG / OT / SO when known. */
  periodType: string | null;
  isPlayoff: boolean;
  /** Favorite tri-codes that played in this game, in favorite order. */
  favoriteTeams: string[];
  read: boolean;
}

export interface AfterActionReportInbox {
  reports: AfterActionReport[];
  unreadCount: number;
}
