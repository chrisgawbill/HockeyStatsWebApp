import { useCallback, useEffect, useState } from 'react';

import {
  GetGoalieSummary,
  GetSkaterCorsi,
  GetSkaterFaceoffs,
  GetSkaterSummary,
  GetTeamLines,
  GetTeamRoster,
  GetTeamSchedule,
  GetTeamStatsById,
  SkaterCorsiResponseDto,
  SkaterFaceoffResponseDto,
  TeamRosterResponseDto,
  TeamStatsResponseDto,
} from '@/features/teams/api/teamsApi';
import {
  GoalieStatLine,
  GoalieSummaryContract,
  PlayerStatLine,
  Position,
  RosterPlayer,
  SkaterSummaryContract,
  TeamStatsContract,
} from '@/features/teams/types/teamPageTypes';
import { TeamLinesDto } from '@/features/teams/types/teamLines';
import {
  buildEmptyRoster,
  transformGoalieStats,
  transformPlayerStats,
  transformRoster,
} from '@/features/teams/utils/teamPageHelper';
import { ScheduleResponseDto } from '@/features/schedule/api/scheduleApi';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { ConvertContractsToGames } from '@/features/schedule/utils/scheduleHelper';

interface UseTeamPageDataArgs {
  /** NHL numeric team id, used by the stats endpoints. */
  numericId: number;
  triCode: string;
  season: string;
}

/**
 * Loads everything the team page shows for one team and season: summary
 * stats, roster, club schedule, skater and goalie stats, and the real line
 * combinations. Team lines load independently so they never block the roster;
 * until they arrive (or if the call fails) the roster shows projected lines.
 * `error` holds a human-readable message rather than the raw API error.
 */
export function useTeamPageData({
  numericId,
  triCode,
  season,
}: UseTeamPageDataArgs) {
  const [teamRawResponse, setTeamRawResponse] =
    useState<TeamStatsContract | null>(null);
  const [schedule, setSchedule] = useState<ScheduledGame[]>([]);
  const [roster, setRoster] =
    useState<Record<Position, RosterPlayer[]>>(buildEmptyRoster());
  const [teamLines, setTeamLines] = useState<TeamLinesDto | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatLine[]>([]);
  const [goalieStats, setGoalieStats] = useState<GoalieStatLine[]>([]);
  const [headshotMap, setHeadshotMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the season-dependent team data (stats, roster, schedule, skater
   * totals, Corsi, optional zone faceoffs and goalie TOI) and stores the shaped view models.
   */
  const fetchSeasonData = useCallback(async () => {
    setError(null);
    try {
      const [
        statsResponse,
        rosterResponse,
        scheduleResponse,
        skaterSummaries,
        corsiResponse,
        faceoffResponse,
        goalieSummaries,
      ]: [
        TeamStatsResponseDto,
        TeamRosterResponseDto,
        ScheduleResponseDto,
        SkaterSummaryContract[],
        SkaterCorsiResponseDto,
        SkaterFaceoffResponseDto | null,
        GoalieSummaryContract[] | null,
      ] = await Promise.all([
        GetTeamStatsById(String(numericId), season),
        GetTeamRoster(triCode, season),
        GetTeamSchedule(triCode, season),
        GetSkaterSummary(String(numericId), season),
        GetSkaterCorsi(String(numericId), season),
        GetSkaterFaceoffs(String(numericId), season).catch(() => null),
        GetGoalieSummary(String(numericId), season).catch(() => null),
      ]);

      setTeamRawResponse(statsResponse.data[0] ?? { teamFullName: '' });

      const toiPerGameByPlayerId = new Map<number, number>();
      for (const skater of skaterSummaries ?? []) {
        if (skater.playerId != null && skater.toiPerGame != null)
          toiPerGameByPlayerId.set(skater.playerId, skater.toiPerGame);
      }
      for (const goalie of goalieSummaries ?? []) {
        if (goalie.goalieId != null && goalie.toiPerGame != null)
          toiPerGameByPlayerId.set(goalie.goalieId, goalie.toiPerGame);
      }
      const newHeadshotMap = new Map<number, string>();
      for (const player of rosterResponse.players ?? []) {
        if (player.id && player.headshot)
          newHeadshotMap.set(player.id, player.headshot);
      }
      setHeadshotMap(newHeadshotMap);
      setSchedule(ConvertContractsToGames(scheduleResponse.games));
      setRoster(transformRoster(rosterResponse.players, toiPerGameByPlayerId));
      setPlayerStats(
        transformPlayerStats(skaterSummaries, corsiResponse, faceoffResponse),
      );
      setGoalieStats(transformGoalieStats(goalieSummaries));
    } catch (loadError) {
      console.error('Error loading team data', loadError);
      setError("Couldn't load this team.");
    } finally {
      setLoading(false);
    }
  }, [numericId, triCode, season]);

  /** Re-runs the season fetch for the current team and season. */
  const refetchTeam = useCallback(() => {
    setLoading(true);
    fetchSeasonData();
  }, [fetchSeasonData]);

  useEffect(() => {
    if (!triCode) return;
    refetchTeam();
  }, [triCode, refetchTeam]);

  useEffect(() => {
    if (!triCode) return;
    let cancelled = false;
    setTeamLines(null);
    GetTeamLines(triCode, season)
      .then((lines) => {
        if (!cancelled) setTeamLines(lines);
      })
      .catch(() => {
        if (!cancelled) setTeamLines(null);
      });
    return () => {
      cancelled = true;
    };
  }, [triCode, season]);

  return {
    teamRawResponse,
    schedule,
    roster,
    teamLines,
    playerStats,
    goalieStats,
    headshotMap,
    loading,
    error,
    refetchTeam,
  };
}
