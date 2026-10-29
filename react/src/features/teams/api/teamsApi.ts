import { get } from '@/lib/apiClient';
import {
  League,
  getLeagueQueryValue,
} from '@/features/league/utils/leagueHelper';
import { ScheduleResponseDto } from '@/features/schedule/api/scheduleApi';
import {
  GoalieSummaryContract,
  RosterPlayerContract,
  SkaterCorsiEntry,
  SkaterFaceoffEntry,
  SkaterSummaryContract,
  TeamStatsContract,
} from '@/features/teams/types/teamPageTypes';
import { TeamLinesDto } from '@/features/teams/types/teamLines';

export interface TeamStatsResponseDto {
  data: TeamStatsContract[];
}

/** Historical team rows used only to enrich the locally owned team list. */
export interface TeamHistoryDto {
  teamFullName: string;
  seasonId: number;
  wins: number;
  regulationWins: number;
  otWins: number;
  losses: number;
  otLosses: number;
  points: number;
  faceoffWinPct: number;
  goalsAgainst: number;
  goalsAgainstPerGame: number;
  goalsFor: number;
  goalsForPerGame?: number;
  goalsPerGame?: number;
  penaltyKillPct: number;
  powerPlayPct: number;
  shotsAgainstPerGame: number;
  shotsForPerGame: number;
}

export interface TeamHistoryResponseDto {
  data: TeamHistoryDto[];
}

export interface TeamRosterResponseDto {
  players: RosterPlayerContract[];
}

export interface SkaterCorsiResponseDto {
  data?: SkaterCorsiEntry[];
}

export interface SkaterFaceoffResponseDto {
  data?: SkaterFaceoffEntry[];
}

/** Team summary, roster, schedule, and the per-team player stat tables. */
export function GetTeamStatsById(
  teamId: '',
  season?: string,
  league?: League,
): Promise<TeamHistoryResponseDto>;
export function GetTeamStatsById(
  teamId: string,
  season?: string,
  league?: League,
): Promise<TeamStatsResponseDto>;
export function GetTeamStatsById(
  teamId: string,
  season?: string,
  league: League = 'nhl',
): Promise<TeamHistoryResponseDto | TeamStatsResponseDto> {
  return get<TeamHistoryResponseDto | TeamStatsResponseDto>(`/team/${teamId}`, {
    season,
    league: getLeagueQueryValue(league),
  });
}
/** A team's roster for a season. */
export function GetTeamRoster(
  triCode: string,
  season?: string,
  league: League = 'nhl',
): Promise<TeamRosterResponseDto> {
  return get<TeamRosterResponseDto>(`/team/roster/${triCode}`, {
    season,
    league: getLeagueQueryValue(league),
  });
}
/** Real forward lines / defense pairs derived from recent shift data. */
export function GetTeamLines(
  triCode: string,
  season?: string,
): Promise<TeamLinesDto> {
  return get<TeamLinesDto>(`/team/lines/${triCode}`, { season });
}
/** A team's schedule for a season. */
export function GetTeamSchedule(
  triCode: string,
  season?: string,
  league: League = 'nhl',
): Promise<ScheduleResponseDto> {
  return get<ScheduleResponseDto>(`/team/schedule/${triCode}`, {
    season,
    league: getLeagueQueryValue(league),
  });
}
/** Skater season totals, optionally for one team. */
export function GetSkaterSummary(
  teamId?: string,
  season?: string,
  league: League = 'nhl',
): Promise<SkaterSummaryContract[]> {
  return get<SkaterSummaryContract[]>('/player/skater/summary', {
    teamId,
    season,
    league: getLeagueQueryValue(league),
  });
}
/** Skater Corsi percentages, optionally for one team. */
export function GetSkaterCorsi(
  teamId?: string,
  season?: string,
): Promise<SkaterCorsiResponseDto> {
  return get<SkaterCorsiResponseDto>('/player/skater/corsi', {
    teamId,
    season,
  });
}
/** Skater faceoffs taken by zone, optionally for one team. */
export function GetSkaterFaceoffs(
  teamId?: string,
  season?: string,
): Promise<SkaterFaceoffResponseDto> {
  return get<SkaterFaceoffResponseDto>('/player/skater/faceoffs', {
    teamId,
    season,
  });
}

/** Goalie season totals, optionally for one team. */
export function GetGoalieSummary(
  teamId?: string,
  season?: string,
  league: League = 'nhl',
): Promise<GoalieSummaryContract[]> {
  return get<GoalieSummaryContract[]>('/player/goalie/summary', {
    teamId,
    season,
    league: getLeagueQueryValue(league),
  });
}
