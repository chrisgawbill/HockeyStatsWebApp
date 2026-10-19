/** A favorite team and when it was favorited (ISO timestamp). */
export interface FavoriteTeam {
  triCode: string;
  since: string;
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
