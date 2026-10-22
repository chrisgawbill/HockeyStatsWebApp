import { get, type QueryParams } from '@/lib/apiClient';
import type {
  FeedBoxscore,
  FeedGame,
  PlayerGameLine,
  SeasonTotals,
} from '@/features/my-hockey/types/myHockey';

/** How long a response is reused, so home and /my-hockey share one fetch. */
const RESPONSE_REUSE_MS = 60 * 1000;

const recentResponses = new Map<
  string,
  { requestedAt: number; response: Promise<unknown> }
>();

/**
 * GETs a path, reusing the same request made in the last minute. A failed
 * request is forgotten so the next call tries again.
 */
function getRecent<Response>(
  path: string,
  params?: QueryParams,
): Promise<Response> {
  const requestKey = `${path}?${JSON.stringify(params ?? {})}`;
  const recent = recentResponses.get(requestKey);
  if (recent && Date.now() - recent.requestedAt < RESPONSE_REUSE_MS) {
    return recent.response as Promise<Response>;
  }
  const response = get<Response>(path, params);
  recentResponses.set(requestKey, { requestedAt: Date.now(), response });
  response.catch(() => {
    if (recentResponses.get(requestKey)?.response === response) {
      recentResponses.delete(requestKey);
    }
  });
  return response;
}

interface TeamScheduleGameDto {
  gameId: number;
  gameTime: string;
  gameState: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  periodType?: string | null;
}

/** One team's current-season games, by start time (`/team/schedule/:triCode`). */
export async function fetchTeamGames(triCode: string): Promise<FeedGame[]> {
  const { games } = await getRecent<{ games: TeamScheduleGameDto[] }>(
    `/team/schedule/${encodeURIComponent(triCode)}`,
  );
  return games
    .map((game) => ({
      gameId: game.gameId,
      startTime: game.gameTime,
      gameState: game.gameState,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: game.homeScore ?? null,
      awayScore: game.awayScore ?? null,
      periodType: game.periodType ?? null,
      period: null,
    }))
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

interface BoxscoreSkaterDto {
  playerId: number;
  goals: number;
  assists: number;
}

interface BoxscoreGoalieDto {
  playerId: number;
  saves?: number;
  decision?: string;
}

interface BoxscoreTeamStatsDto {
  forwards?: BoxscoreSkaterDto[];
  defense?: BoxscoreSkaterDto[];
  goalies?: BoxscoreGoalieDto[];
}

interface BoxscoreDto {
  id: number;
  gameState: string;
  startTimeUTC: string;
  homeTeam: { abbrev: string; score?: number };
  awayTeam: { abbrev: string; score?: number };
  periodDescriptor?: { number: number; periodType: string };
  gameOutcome?: { lastPeriodType: string };
  playerByGameStats?: {
    homeTeam: BoxscoreTeamStatsDto;
    awayTeam: BoxscoreTeamStatsDto;
  };
}

/** Indexes every dressed skater's and goalie's line by player id. */
function readPlayerLines(
  teams: BoxscoreTeamStatsDto[],
): Map<number, PlayerGameLine> {
  const playerLines = new Map<number, PlayerGameLine>();
  for (const team of teams) {
    for (const skater of [...(team.forwards ?? []), ...(team.defense ?? [])]) {
      playerLines.set(skater.playerId, {
        type: 'skater',
        goals: skater.goals,
        assists: skater.assists,
      });
    }
    for (const goalie of team.goalies ?? []) {
      playerLines.set(goalie.playerId, {
        type: 'goalie',
        saves: goalie.saves ?? 0,
        decision: goalie.decision ?? null,
      });
    }
  }
  return playerLines;
}

/** A game's box score (`/schedule/:gameId`, refreshed every few minutes by the API). */
export async function fetchGameBoxscore(gameId: number): Promise<FeedBoxscore> {
  const boxscore = await getRecent<BoxscoreDto>(`/schedule/${gameId}`);
  const hasStarted =
    boxscore.gameState !== 'FUT' && boxscore.gameState !== 'PRE';
  return {
    game: {
      gameId: boxscore.id,
      startTime: boxscore.startTimeUTC,
      gameState: boxscore.gameState,
      homeTeam: boxscore.homeTeam.abbrev,
      awayTeam: boxscore.awayTeam.abbrev,
      homeScore: hasStarted ? (boxscore.homeTeam.score ?? 0) : null,
      awayScore: hasStarted ? (boxscore.awayTeam.score ?? 0) : null,
      periodType:
        boxscore.gameOutcome?.lastPeriodType ??
        boxscore.periodDescriptor?.periodType ??
        null,
      period: boxscore.periodDescriptor?.number ?? null,
    },
    playerLines: boxscore.playerByGameStats
      ? readPlayerLines([
          boxscore.playerByGameStats.homeTeam,
          boxscore.playerByGameStats.awayTeam,
        ])
      : new Map(),
  };
}

interface SkaterSummaryDto {
  playerId: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
}

interface GoalieSummaryDto {
  goalieId: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses?: number;
  savePctg: number | null;
  goalsAgainstAverage: number | null;
}

/** Current-season skater totals for one team, by player id. */
export async function fetchSkaterSeasonTotals(
  teamId: number,
): Promise<Map<number, SeasonTotals>> {
  const skaters = await getRecent<SkaterSummaryDto[]>(
    '/player/skater/summary',
    { teamId: String(teamId) },
  );
  return new Map(
    skaters.map((skater) => [
      skater.playerId,
      {
        type: 'skater',
        gamesPlayed: skater.gamesPlayed,
        goals: skater.goals,
        assists: skater.assists,
        points: skater.points,
      },
    ]),
  );
}

/** Current-season goalie totals for one team, by player id. */
export async function fetchGoalieSeasonTotals(
  teamId: number,
): Promise<Map<number, SeasonTotals>> {
  const goalies = await getRecent<GoalieSummaryDto[]>(
    '/player/goalie/summary',
    { teamId: String(teamId) },
  );
  return new Map(
    goalies.map((goalie) => [
      goalie.goalieId,
      {
        type: 'goalie',
        gamesPlayed: goalie.gamesPlayed,
        wins: goalie.wins,
        losses: goalie.losses,
        otLosses: goalie.otLosses ?? null,
        savePct: goalie.savePctg,
        goalsAgainstAverage: goalie.goalsAgainstAverage,
      },
    ]),
  );
}
