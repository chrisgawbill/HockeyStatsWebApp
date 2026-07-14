import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import PageHeader from '../Components/PageHeader';
import TeamHero from '../Components/TeamPage/TeamHero';
import BasicInfoStrip from '../Components/TeamPage/BasicInfoStrip';
import ScheduleStrip from '../Components/TeamPage/ScheduleStrip';
import LoadingState from '../Components/LoadingState';
import TeamStatsRow from '../Components/TeamPage/TeamStatsRow';
import PlayerStatsSection from '../Components/TeamPage/PlayerStatsSection';
import RosterSection from '../Components/TeamPage/RosterSection';
import { localTeamList } from '../Data/LocalData/teamListData';
import {
  TeamOverview,
  StatItem,
  Position,
  RosterPlayer,
  PlayerStatLine,
} from '../Data/Models/teamPageTypes';
import { ScheduledGame } from '../Data/Models/scheduledGame';
import {
  GetTeamStatsById,
  GetTeamRoster,
  GetTeamSchedule,
  GetSkaterSummary,
  GetSkaterCorsi,
  GetGoalieSummary,
} from '../Services/apiHandler';
import { useStandingsContext } from '../Data/Context/StandingsContext';
import { useSeason } from '../Data/Context/SeasonContext';
import { InterfaceWithChatBot } from '../Services/genAIHandler';
import styles from '../Style/TeamPage/TeamPage.module.css';
import { ConvertContractsToGames } from '../Data/Helpers/scheduleHelper';

/**
 * Maps NHL roster position codes into the display buckets used by the roster UI.
 */
const POS_MAP: Record<string, Position> = {
  C: 'Center',
  L: 'Left Wing',
  R: 'Right Wing',
  D: 'Defenseman',
  G: 'Goalie',
};

/**
 * Builds an empty roster bucket map for component state and roster transforms.
 */
function buildEmptyRoster(): Record<Position, RosterPlayer[]> {
  return {
    Center: [],
    'Left Wing': [],
    'Right Wing': [],
    Defenseman: [],
    Goalie: [],
  };
}

/**
 * Formats a per-game time-on-ice value in seconds into the roster stat label.
 */
function formatToi(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')} TOI`;
}

/**
 * Groups roster players by display position and sorts each group by time on ice
 * (most-used first), looking up TOI per player from `toiMap`. Players whose
 * position code isn't in POS_MAP are skipped. Returns the grouped roster.
 */
function transformRoster(
  players: any[],
  toiMap: Map<number, number>,
): Record<Position, RosterPlayer[]> {
  const result = buildEmptyRoster();
  for (const p of players ?? []) {
    const pos = POS_MAP[p.position] as Position;
    if (!pos) continue;
    const toi = toiMap.get(p.id);
    const stat = toi != null ? formatToi(toi) : '';
    result[pos].push({
      id: p.id,
      name: p.name,
      number: p.number ?? 0,
      stat,
      headshot: p.headshot ?? '',
    });
  }
  for (const pos of [
    'Center',
    'Left Wing',
    'Right Wing',
    'Defenseman',
  ] as Position[]) {
    result[pos].sort((a, b) => {
      const aToi = toiMap.get(a.id) ?? 0;
      const bToi = toiMap.get(b.id) ?? 0;
      return bToi - aToi;
    });
  }
  result['Goalie'].sort((a, b) => {
    const aToi = toiMap.get(a.id) ?? 0;
    const bToi = toiMap.get(b.id) ?? 0;
    return bToi - aToi;
  });
  return result;
}

/**
 * Builds the per-player stat lines for the team's player table from the skater
 * summary, merging in Corsi (SAT%) by playerId since it comes from a separate
 * endpoint. Missing values default to 0/null; a null faceoff percentage means
 * the player did not take faceoffs.
 */
function transformPlayerStats(
  summary: any[],
  corsiData: any,
): PlayerStatLine[] {
  const corsiMap = new Map<number, number>();
  for (const p of corsiData?.data ?? []) {
    if (p.playerId != null && p.satPercentage != null)
      corsiMap.set(p.playerId, p.satPercentage);
  }
  return (summary ?? []).map((p: any): PlayerStatLine => ({
    playerId: p.playerId,
    name: p.name ?? '',
    position: p.position ?? '',
    gamesPlayed: p.gamesPlayed ?? 0,
    goals: p.goals ?? 0,
    assists: p.assists ?? 0,
    points: p.points ?? 0,
    plusMinus: p.plusMinus ?? 0,
    penaltyMinutes: p.penaltyMinutes ?? 0,
    faceoffWinPct: p.faceoffWinPct ?? null,
    corsiPct: corsiMap.get(p.playerId) ?? null,
  }));
}

/**
 * Shapes the raw NHL team summary into the labeled stat tiles the header strip
 * renders, formatting rates/percentages and falling back to "—" when absent.
 */
function transformTeamStats(raw: any): StatItem[] {
  return [
    { label: 'Goals For / GP', value: raw.goalsForPerGame?.toFixed(2) ?? '—' },
    {
      label: 'Goals Against / GP',
      value: raw.goalsAgainstPerGame?.toFixed(2) ?? '—',
    },
    {
      label: 'Power Play %',
      value:
        raw.powerPlayPct != null
          ? `${(raw.powerPlayPct * 100).toFixed(1)}%`
          : '—',
    },
    {
      label: 'Penalty Kill %',
      value:
        raw.penaltyKillPct != null
          ? `${(raw.penaltyKillPct * 100).toFixed(1)}%`
          : '—',
    },
    { label: 'Shots / GP', value: raw.shotsForPerGame?.toFixed(1) ?? '—' },
  ];
}

/**
 * Team route (`/team/:teamId`, where the param is actually a tri-code). Pulls the
 * numeric team id and primary color from local team metadata, then loads stats,
 * roster, schedule, and player stats for the selected season in one batch, plus
 * AI-generated team history fetched separately (it isn't season-dependent).
 */
export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const triCode: string = teamId?.toUpperCase() ?? '';
  const teamSourcePath = location.pathname;
  const { easternStandingsData, westernStandingsData } = useStandingsContext();
  const { season } = useSeason();
  const teamActiveNavPath =
    routeState?.activeNavPath ?? routeState?.sourcePath ?? '/teamList';
  const teamEntry = (localTeamList as any[]).find((t) => t.triCode === triCode);
  const numericId: number = teamEntry?.id ?? 0;
  const primaryColor: string = teamEntry?.primary ?? '#1B4F8A';
  const pageStyle = { '--color-primary': primaryColor } as React.CSSProperties;

  const [teamRawResponse, setTeamRawResponse] = useState<any>(null);

  const [staticInfo, setStaticInfo] = useState<{
    arena: string;
    founded: number;
    stanleyCups: number;
    conferenceChampionships: number;
    hallOfFamers: number;
  } | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduledGame[]>([]);
  const [roster, setRoster] =
    useState<Record<Position, RosterPlayer[]>>(buildEmptyRoster());
  const [playerStats, setPlayerStats] = useState<PlayerStatLine[]>([]);
  const [headshotMap, setHeadshotMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!triCode) return;

    /**
     * Loads the team data that changes by selected season: summary stats,
     * roster, club schedule, skater totals, Corsi, and optional goalie TOI. The
     * results are shaped into the TeamPage view models and stored in state.
     */
    async function fetchMain() {
      try {
        const [
          statsRes,
          rosterRes,
          scheduleRes,
          summaryRes,
          corsiRes,
          goalieRes,
        ] = await Promise.all([
          GetTeamStatsById(String(numericId), season),
          GetTeamRoster(triCode, season),
          GetTeamSchedule(triCode, season),
          GetSkaterSummary(String(numericId), season),
          GetSkaterCorsi(String(numericId), season),
          GetGoalieSummary(String(numericId), season).catch(() => null),
        ]);

        const raw = statsRes?.data?.[0] ?? {};
        setTeamRawResponse(raw);

        const toiMap = new Map<number, number>();
        for (const p of summaryRes ?? []) {
          if (p.playerId != null && p.toiPerGame != null)
            toiMap.set(p.playerId, p.toiPerGame);
        }
        for (const g of goalieRes ?? []) {
          if (g.goalieId != null && g.toiPerGame != null)
            toiMap.set(g.goalieId, g.toiPerGame);
        }
        const newHeadshotMap = new Map<number, string>();
        for (const p of rosterRes.players ?? []) {
          if (p.id && p.headshot) newHeadshotMap.set(p.id, p.headshot);
        }
        setHeadshotMap(newHeadshotMap);
        setStats(transformTeamStats(raw));
        setSchedule(ConvertContractsToGames(scheduleRes.games));
        setRoster(transformRoster(rosterRes.players, toiMap));
        setPlayerStats(transformPlayerStats(summaryRes, corsiRes));
      } catch (err) {
        console.error('Error loading team data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMain();
  }, [teamId, season]);

  useEffect(() => {
    if (!triCode) return;
    setStaticInfo(null);

    /**
     * Fetches static team-history fields from the AI service once per team. This
     * data is intentionally independent of the selected season, so season changes
     * do not trigger another AI request.
     */
    async function fetchStaticInfo() {
      try {
        const prompt =
          `Give me basic historical information about the ${teamEntry?.fullName} NHL team. ` +
          `Return ONLY a raw JSON object (no markdown) with exactly these fields: ` +
          `arena (string), founded (number - year founded), stanleyCups (number), ` +
          `conferenceChampionships (number - total conference final appearances), ` +
          `hallOfFamers (number - players inducted into the Hockey Hall of Fame).`;
        const info = await InterfaceWithChatBot({ content: prompt }, triCode);
        setStaticInfo({
          arena: info.arena ?? '—',
          founded: info.founded ?? 0,
          stanleyCups: info.stanleyCups ?? 0,
          conferenceChampionships: info.conferenceChampionships ?? 0,
          hallOfFamers: info.hallOfFamers ?? 0,
        });
      } catch (err) {
        console.error('Error fetching static team info from AI', err);
      }
    }

    fetchStaticInfo();
  }, [teamId, triCode]);

  const team: TeamOverview | null = useMemo(() => {
    if (teamRawResponse == null) {
      return null;
    }

    const allStandings = [...easternStandingsData, ...westernStandingsData];
    const s = allStandings.find((t) => t.id === triCode);
    const conferenceStandings =
      s?.conferenceName === 'Eastern'
        ? easternStandingsData
        : westernStandingsData;
    const playoffCutoff = conferenceStandings.find(
      (t) => t.conferenceStandingsPlace === 8,
    );
    const teamPoints = s?.points ?? teamRawResponse?.points;
    const playoffLineDelta = playoffCutoff
      ? teamPoints - playoffCutoff.points
      : 0;
    return {
      name: teamRawResponse?.name,
      triCode,
      wins: s?.wins ?? teamRawResponse?.wins,
      losses: s?.losses ?? teamRawResponse?.losses,
      otLosses: s?.otLosses ?? teamRawResponse?.otLosses,
      points: teamPoints,
      divisionRank: s?.divisionStandingsPlace ?? 0,
      division: s?.divisionName ?? '',
      conference: s?.conferenceName ?? '',
      conferenceRank: s?.conferenceStandingsPlace ?? 0,
      playoffLineDelta,
      founded: 0,
      arena: '—',
      stanleyCups: 0,
      conferenceChampionships: 0,
      hallOfFamers: 0,
    };
  }, [
    teamRawResponse,
    easternStandingsData,
    westernStandingsData,
    triCode,
    staticInfo,
  ]);

  if (loading || !team) {
    return (
      <div className={styles['team-page']} style={pageStyle}>
        <PageHeader />
        <div
          className={styles['team-page__content']}
          style={{ paddingTop: '2rem' }}
        >
          <LoadingState label="Loading team" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles['team-page']} style={pageStyle}>
      <PageHeader />
      <TeamHero team={team} />
      <div className={styles['team-page__content']}>
        <BasicInfoStrip team={staticInfo ? { ...team, ...staticInfo } : team} />
        <ScheduleStrip
          games={schedule}
          teamAbbrev={triCode}
          sourceLabel={team.name}
          sourcePath={teamSourcePath}
          activeNavPath={teamActiveNavPath}
        />
        <TeamStatsRow stats={stats} />
        <PlayerStatsSection players={playerStats} headshotMap={headshotMap} />
        <RosterSection roster={roster} />
      </div>
    </div>
  );
}
