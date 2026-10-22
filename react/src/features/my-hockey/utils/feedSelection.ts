import { isCompletedGameState, isInProgressGameState } from '@/lib/gameStatus';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import type {
  FeedGame,
  FeedGameItem,
  FeedPlayerItem,
  FeedTeam,
  MyHockeyData,
  MyHockeyFeed,
} from '@/features/my-hockey/types/myHockey';

/**
 * A game this long past its start that still is not final is stale schedule
 * data (its box score could not be loaded), not something to show as up next.
 */
const STALE_START_MS = 8 * 60 * 60 * 1000;

/** How many started-but-not-final games per team are rechecked; normally one. */
const MAX_RECHECKS_PER_TEAM = 2;

/** The last game matching `isWanted` (games are by start time). */
function findLastGame(
  games: FeedGame[],
  isWanted: (game: FeedGame) => boolean,
): FeedGame | null {
  for (let index = games.length - 1; index >= 0; index -= 1) {
    if (isWanted(games[index])) return games[index];
  }
  return null;
}

function hasStarted(game: FeedGame, now: number): boolean {
  return Date.parse(game.startTime) <= now;
}

/**
 * Games the cached schedule may have wrong: started but not yet final there.
 * Their box scores give the live score or the final. Newest last.
 */
export function listGamesToRecheck(games: FeedGame[], now: number): FeedGame[] {
  return games
    .filter((game) => !isCompletedGameState(game.gameState))
    .filter((game) => hasStarted(game, now))
    .slice(-MAX_RECHECKS_PER_TEAM);
}

/** Replaces games with their box-score copies where one was loaded. */
export function applyBoxscores(
  games: FeedGame[],
  boxscoresByGameId: MyHockeyData['boxscoresByGameId'],
): FeedGame[] {
  return games.map((game) => boxscoresByGameId.get(game.gameId)?.game ?? game);
}

/** The team's live game, else its next one; null when the season is over. */
export function selectNextGame(
  games: FeedGame[],
  now: number,
): FeedGame | null {
  return (
    games.find(
      (game) =>
        !isCompletedGameState(game.gameState) &&
        Date.parse(game.startTime) > now - STALE_START_MS,
    ) ?? null
  );
}

/** The team's most recent final, or null before its first one. */
export function selectLastResult(games: FeedGame[]): FeedGame | null {
  return findLastGame(games, (game) => isCompletedGameState(game.gameState));
}

/** The team's most recent live or final game, for a player's last-game line. */
export function selectLatestPlayedGame(
  games: FeedGame[],
  now: number,
): FeedGame | null {
  return findLastGame(
    games,
    (game) =>
      isCompletedGameState(game.gameState) ||
      (isInProgressGameState(game.gameState) && hasStarted(game, now)),
  );
}

function isLive(game: FeedGame): boolean {
  return isInProgressGameState(game.gameState);
}

/**
 * Picks one game per team, keeping a game two favorites share once, told
 * from the favorite listed first (teams come in tier order).
 */
function pickOneGamePerTeam(
  teams: FeedTeam[],
  gamesByTeam: MyHockeyData['gamesByTeam'],
  pickGame: (games: FeedGame[]) => FeedGame | null,
): FeedGameItem[] {
  const pickedGameIds = new Set<number>();
  const items: FeedGameItem[] = [];
  for (const team of teams) {
    const games = gamesByTeam.get(team.triCode);
    const game = games ? pickGame(games) : null;
    if (!game || pickedGameIds.has(game.gameId)) continue;
    pickedGameIds.add(game.gameId);
    items.push({ game, team });
  }
  return items;
}

/** Each team's next game: live games first, then by start time. */
export function buildUpNext(
  teams: FeedTeam[],
  gamesByTeam: MyHockeyData['gamesByTeam'],
  now: number,
): FeedGameItem[] {
  return pickOneGamePerTeam(teams, gamesByTeam, (games) =>
    selectNextGame(games, now),
  ).sort(
    (a, b) =>
      Number(isLive(b.game)) - Number(isLive(a.game)) ||
      Date.parse(a.game.startTime) - Date.parse(b.game.startTime),
  );
}

/** Each team's latest final, newest first. */
export function buildLastResults(
  teams: FeedTeam[],
  gamesByTeam: MyHockeyData['gamesByTeam'],
): FeedGameItem[] {
  return pickOneGamePerTeam(teams, gamesByTeam, selectLastResult).sort(
    (a, b) => Date.parse(b.game.startTime) - Date.parse(a.game.startTime),
  );
}

/** Each favorite player (already in tier order) with season totals and latest game. */
export function buildPlayerItems(
  players: FavoritePlayer[],
  data: MyHockeyData,
  now: number,
): FeedPlayerItem[] {
  return players.map((player) => {
    const teamGames = player.teamTriCode
      ? data.gamesByTeam.get(player.teamTriCode)
      : undefined;
    const latestGame = teamGames
      ? selectLatestPlayedGame(teamGames, now)
      : null;
    const boxscore = latestGame
      ? data.boxscoresByGameId.get(latestGame.gameId)
      : undefined;
    return {
      player,
      seasonTotals: data.seasonTotalsByPlayerId.get(player.playerId) ?? null,
      latestGame:
        latestGame && boxscore
          ? {
              game: latestGame,
              line: boxscore.playerLines.get(player.playerId) ?? null,
            }
          : null,
    };
  });
}

/** Every team's games with the loaded box scores applied. */
export function correctGamesByTeam(
  data: MyHockeyData,
): MyHockeyData['gamesByTeam'] {
  return new Map(
    [...data.gamesByTeam].map(([triCode, games]) => [
      triCode,
      applyBoxscores(games, data.boxscoresByGameId),
    ]),
  );
}

/**
 * Builds the three feed sections. `teams` and `players` come in tier order;
 * the schedules in `data` have not had their box scores applied yet.
 */
export function buildMyHockeyFeed(
  teams: FeedTeam[],
  players: FavoritePlayer[],
  data: MyHockeyData,
  now: number,
): MyHockeyFeed {
  const gamesByTeam = correctGamesByTeam(data);
  return {
    upNext: buildUpNext(teams, gamesByTeam, now),
    lastResults: buildLastResults(teams, gamesByTeam),
    players: buildPlayerItems(players, { ...data, gamesByTeam }, now),
  };
}
