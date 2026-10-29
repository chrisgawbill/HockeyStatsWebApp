/**
 * Where a game link goes. A game that has not started previews on the
 * head-to-head page (`/matchup?teamA=<away>&teamB=<home>&game=<id>`); every
 * other game opens its game page (`/game/:gameId`). Takes bare values so any
 * feature's game model can use it.
 */

/** The facts a game link needs, from any feature's game model. */
export interface GameLinkFacts {
  gameId: number;
  gameState: string;
  /** Scheduled start, an ISO timestamp or a Date. */
  startTime: string | Date;
  awayTeam: string;
  homeTeam: string;
}

/**
 * True for a future or pregame game whose start time is still ahead. Once the
 * scheduled start passes the game page decides, so a season list loaded
 * before puck drop never sends a started game back to its preview. A missing
 * or unreadable start time counts as still ahead.
 */
export function isPreviewGame(
  gameState: string,
  startTime: string | Date,
  now: Date = new Date(),
): boolean {
  if (gameState !== 'FUT' && gameState !== 'PRE') return false;
  const startMs = new Date(startTime).getTime();
  return Number.isNaN(startMs) || startMs > now.getTime();
}

/** The head-to-head page previewing one game, away team first. */
export function getMatchupPreviewPath({
  gameId,
  awayTeam,
  homeTeam,
}: Pick<GameLinkFacts, 'gameId' | 'awayTeam' | 'homeTeam'>): string {
  const params = new URLSearchParams({
    teamA: awayTeam,
    teamB: homeTeam,
    game: String(gameId),
  });
  return `/matchup?${params.toString()}`;
}

/**
 * The route a game link opens: the matchup preview before puck drop, else the
 * game page. The matchup page is NHL only, so AHL games always open the game page.
 */
export function getGamePath(
  game: GameLinkFacts,
  now: Date = new Date(),
  league: 'nhl' | 'ahl' = 'nhl',
): string {
  return league === 'nhl' && isPreviewGame(game.gameState, game.startTime, now)
    ? getMatchupPreviewPath(game)
    : `/game/${game.gameId}`;
}
