import { get } from '@/lib/apiClient';

/** Team summary, roster, schedule, and the per-team player stat tables. */
export async function GetTeamStatsById(teamId: string, season?: string) {
  return get(`/team/${teamId}`, { season });
}
export async function GetTeamRoster(triCode: string, season?: string) {
  return get(`/team/roster/${triCode}`, { season });
}
export async function GetTeamSchedule(triCode: string, season?: string) {
  return get(`/team/schedule/${triCode}`, { season });
}
export async function GetSkaterSummary(teamId?: string, season?: string) {
  return get('/player/skater/summary', { teamId, season });
}
export async function GetSkaterCorsi(teamId?: string, season?: string) {
  return get('/player/skater/corsi', { teamId, season });
}
export async function GetGoalieSummary(teamId?: string, season?: string) {
  return get('/player/goalie/summary', { teamId, season });
}
