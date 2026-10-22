import { get } from '@/lib/apiClient';
import type {
  GoalieSeason,
  SkaterSeason,
} from '@/features/player-compare/types/playerCompare';

interface SkaterSummaryDto {
  playerId: number;
  name: string;
  position: string;
  /** Missing on an API that predates API-COMPARE-01. */
  teamTriCodes?: string[];
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots?: number;
  shootingPct?: number | null;
  toiPerGame: number | null;
}

interface GoalieSummaryDto {
  goalieId: number;
  name: string;
  teamTriCodes?: string[];
  gamesPlayed: number;
  wins: number;
  goalsAgainstAverage: number | null;
  savePctg: number | null;
  shutouts: number;
}

/** The last team the NHL lists for a player's season, used for the headshot. */
function getLatestTeam(teamTriCodes: string[] | undefined): string | null {
  if (!teamTriCodes?.length) return null;
  return teamTriCodes[teamTriCodes.length - 1];
}

/** Every skater's regular-season totals for a season (league-wide summary). */
export async function fetchSkaterSeasons(
  season: string,
): Promise<SkaterSeason[]> {
  const skaters = await get<SkaterSummaryDto[]>('/player/skater/summary', {
    season,
  });
  return skaters.map((skater) => ({
    group: 'skater',
    playerId: skater.playerId,
    name: skater.name,
    position: skater.position,
    teamTriCode: getLatestTeam(skater.teamTriCodes),
    gamesPlayed: skater.gamesPlayed,
    goals: skater.goals,
    assists: skater.assists,
    points: skater.points,
    plusMinus: skater.plusMinus,
    shots: skater.shots ?? 0,
    shootingPct: skater.shootingPct ?? null,
    toiPerGame: skater.toiPerGame,
  }));
}

/** Every goalie's regular-season totals for a season (league-wide summary). */
export async function fetchGoalieSeasons(
  season: string,
): Promise<GoalieSeason[]> {
  const goalies = await get<GoalieSummaryDto[]>('/player/goalie/summary', {
    season,
  });
  return goalies.map((goalie) => ({
    group: 'goalie',
    playerId: goalie.goalieId,
    name: goalie.name,
    teamTriCode: getLatestTeam(goalie.teamTriCodes),
    gamesPlayed: goalie.gamesPlayed,
    wins: goalie.wins,
    goalsAgainstAverage: goalie.goalsAgainstAverage,
    savePct: goalie.savePctg,
    shutouts: goalie.shutouts,
  }));
}
