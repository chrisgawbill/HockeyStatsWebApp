import { useCallback, useEffect, useRef, useState } from 'react';

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
import { useRefreshOnStatsChange } from '@/lib/statsVersion';
import { League } from '@/features/league/utils/leagueHelper';

interface FetchSeasonDataOptions {
  /** Background refresh: keeps the shown data and error state if it fails. */
  silent?: boolean;
}

interface UseTeamPageDataArgs {
  /** Numeric team id (NHL, or HockeyTech for the AHL), used by the stats endpoints. */
  numericId: number;
  triCode: string;
  season: string;
  league: League;
}

/**
 * Loads everything the team page shows for one team and season: summary
 * stats, roster, club schedule, skater and goalie stats, and the real line
 * combinations. The AHL has no Corsi, zone faceoffs or line combinations, so
 * those are never requested for it. Team lines load independently so they never block the roster;
 * until they arrive (or if the call fails) the roster shows projected lines.
 * When the API's stored stats change (a game went final) the season data
 * refreshes in the background, so a finished game's stats show up without a
 * reload. `error` holds a
 * human-readable message rather than the raw API error.
 */
export function useTeamPageData({
  numericId,
  triCode,
  season,
  league,
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
  // The team and season the page shows now, so a response for one the user
  // has left is dropped.
  const requestKey = `${league}:${numericId}:${triCode}:${season}`;
  const requestKeyRef = useRef(requestKey);
  requestKeyRef.current = requestKey;

  /**
   * Fetches the season-dependent team data (stats, roster, schedule, skater
   * totals, Corsi, optional zone faceoffs and goalie TOI) and stores the shaped view models.
   */
  const fetchSeasonData = useCallback(
    async ({ silent = false }: FetchSeasonDataOptions = {}) => {
      const isCurrent = () =>
        requestKeyRef.current === `${league}:${numericId}:${triCode}:${season}`;
      if (!silent) setError(null);
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
          GetTeamStatsById(String(numericId), season, league),
          GetTeamRoster(triCode, season, league),
          GetTeamSchedule(triCode, season, league),
          GetSkaterSummary(String(numericId), season, league),
          league === 'ahl' ? {} : GetSkaterCorsi(String(numericId), season),
          league === 'ahl'
            ? null
            : GetSkaterFaceoffs(String(numericId), season).catch(() => null),
          GetGoalieSummary(String(numericId), season, league).catch(() => null),
        ]);
        if (!isCurrent()) return;

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
        setRoster(
          transformRoster(rosterResponse.players, toiPerGameByPlayerId),
        );
        setPlayerStats(
          transformPlayerStats(skaterSummaries, corsiResponse, faceoffResponse),
        );
        setGoalieStats(transformGoalieStats(goalieSummaries));
        if (silent) setError(null);
      } catch (loadError) {
        console.error('Error loading team data', loadError);
        if (!silent && isCurrent()) setError("Couldn't load this team.");
      } finally {
        if (isCurrent()) setLoading(false);
      }
    },
    [numericId, triCode, season, league],
  );

  /** Re-runs the season fetch for the current team and season. */
  const refetchTeam = useCallback(() => {
    setLoading(true);
    fetchSeasonData();
  }, [fetchSeasonData]);

  useEffect(() => {
    if (!triCode) return;
    refetchTeam();
  }, [triCode, refetchTeam]);

  useRefreshOnStatsChange(
    () => fetchSeasonData({ silent: true }),
    Boolean(triCode),
  );

  useEffect(() => {
    setTeamLines(null);
    if (!triCode || league === 'ahl') return;
    let cancelled = false;
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
  }, [triCode, season, league]);

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
