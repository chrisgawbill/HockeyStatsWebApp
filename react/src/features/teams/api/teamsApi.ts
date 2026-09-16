import { get } from '@/lib/apiClient';
import { ScheduleResponseDto } from '@/features/schedule/api/scheduleApi';
import {
  GoalieSummaryContract,
  RosterPlayerContract,
  SkaterCorsiEntry,
  SkaterSummaryContract,
  TeamStatsContract,
} from '@/features/teams/types/teamPageTypes';

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

/** Team summary, roster, schedule, and the per-team player stat tables. */
export function GetTeamStatsById(
  teamId: '',
  season?: string,
): Promise<TeamHistoryResponseDto>;
export function GetTeamStatsById(
  teamId: string,
  season?: string,
): Promise<TeamStatsResponseDto>;
export function GetTeamStatsById(
  teamId: string,
  season?: string,
): Promise<TeamHistoryResponseDto | TeamStatsResponseDto> {
  return get<TeamHistoryResponseDto | TeamStatsResponseDto>(`/team/${teamId}`, {
    season,
  });
}
export function GetTeamRoster(
  triCode: string,
  season?: string,
): Promise<TeamRosterResponseDto> {
  return get<TeamRosterResponseDto>(`/team/roster/${triCode}`, { season });
}
export function GetTeamSchedule(
  triCode: string,
  season?: string,
): Promise<ScheduleResponseDto> {
  return get<ScheduleResponseDto>(`/team/schedule/${triCode}`, { season });
}
export function GetSkaterSummary(
  teamId?: string,
  season?: string,
): Promise<SkaterSummaryContract[]> {
  return get<SkaterSummaryContract[]>('/player/skater/summary', {
    teamId,
    season,
  });
}
export function GetSkaterCorsi(
  teamId?: string,
  season?: string,
): Promise<SkaterCorsiResponseDto> {
  return get<SkaterCorsiResponseDto>('/player/skater/corsi', {
    teamId,
    season,
  });
}
export function GetGoalieSummary(
  teamId?: string,
  season?: string,
): Promise<GoalieSummaryContract[]> {
  return get<GoalieSummaryContract[]>('/player/goalie/summary', {
    teamId,
    season,
  });
}
