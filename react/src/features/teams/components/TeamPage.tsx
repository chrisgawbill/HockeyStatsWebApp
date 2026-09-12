import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';

import PageHeader from '@/components/PageHeader';
import TeamHero from '@/features/teams/components/TeamHero';
import LoadingState from '@/components/LoadingState';
import OverviewTab from '@/features/teams/components/tabs/OverviewTab';
import RosterTab from '@/features/teams/components/tabs/RosterTab';
import ScheduleTab from '@/features/teams/components/tabs/ScheduleTab';
import SkatersTab from '@/features/teams/components/tabs/SkatersTab';
import GoaliesTab from '@/features/teams/components/tabs/GoaliesTab';
import HistoryTab from '@/features/teams/components/tabs/HistoryTab';
import { localTeamList } from '@/features/teams/utils/teamListData';
import {
  AiHistoryStatus,
  GoalieStatLine,
  GoalieSummaryContract,
  Position,
  RosterPlayer,
  RosterPlayerContract,
  SkaterCorsiEntry,
  SkaterSummaryContract,
  StatItem,
  TeamAiHistory,
  TeamOverview,
  TeamStatsContract,
  TeamTab,
  TEAM_TABS,
  PlayerStatLine,
} from '@/features/teams/types/teamPageTypes';
import {
  buildEmptyRoster,
  buildTeamOverview,
  parseTeamTab,
  transformGoalieStats,
  transformPlayerStats,
  transformRoster,
  transformTeamStats,
} from '@/features/teams/utils/teamPageHelper';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import {
  GetTeamStatsById,
  GetTeamRoster,
  GetTeamSchedule,
  GetSkaterSummary,
  GetSkaterCorsi,
  GetGoalieSummary,
} from '@/features/teams/api/teamsApi';
import { useStandingsContext } from '@/features/standings/hooks/StandingsContext';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { InterfaceWithChatBot } from '@/lib/genAIHandler';
import styles from '@/features/teams/components/TeamPage.module.css';
import { ConvertContractsToGames } from '@/features/schedule/utils/scheduleHelper';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Team route (`/team/:teamId`, where the param is actually a tri-code). Pulls the
 * numeric team id and primary color from local team metadata, then loads stats,
 * roster, schedule, and player stats for the selected season in one batch, plus
 * AI-generated team history fetched separately (it isn't season-dependent).
 *
 * The page body is a URL-backed tabbed hub (`?tab=`); TeamHero above the tabs
 * is always visible and is built entirely from official standings-context data.
 */
export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const tab: TeamTab = parseTeamTab(searchParams.get('tab'));

  /**
   * Writes the selected tab back to the URL while preserving every sibling
   * query param (season, etc.) — never replaces the whole search string.
   */
  function setTab(next: TeamTab) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      return p;
    });
  }

  const [teamRawResponse, setTeamRawResponse] =
    useState<TeamStatsContract | null>(null);
  const [aiHistory, setAiHistory] = useState<TeamAiHistory | null>(null);
  const [aiHistoryStatus, setAiHistoryStatus] =
    useState<AiHistoryStatus>('loading');
  const [stats, setStats] = useState<StatItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduledGame[]>([]);
  const [roster, setRoster] =
    useState<Record<Position, RosterPlayer[]>>(buildEmptyRoster());
  const [playerStats, setPlayerStats] = useState<PlayerStatLine[]>([]);
  const [goalieStats, setGoalieStats] = useState<GoalieStatLine[]>([]);
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
        ]: [
          any,
          { players: RosterPlayerContract[] },
          any,
          SkaterSummaryContract[],
          { data?: SkaterCorsiEntry[] },
          GoalieSummaryContract[] | null,
        ] = await Promise.all([
          GetTeamStatsById(String(numericId), season),
          GetTeamRoster(triCode, season),
          GetTeamSchedule(triCode, season),
          GetSkaterSummary(String(numericId), season),
          GetSkaterCorsi(String(numericId), season),
          GetGoalieSummary(String(numericId), season).catch(() => null),
        ]);

        const raw: TeamStatsContract = statsRes?.data?.[0] ?? { name: '' };
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
        setGoalieStats(transformGoalieStats(goalieRes));
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
    setAiHistory(null);
    setAiHistoryStatus('loading');

    /**
     * Fetches static team-history fields from the AI service once per team. This
     * data is intentionally independent of the selected season, so season changes
     * do not trigger another AI request.
     */
    async function fetchAiHistory() {
      try {
        const prompt =
          `Give me basic historical information about the ${teamEntry?.fullName} NHL team. ` +
          `Return ONLY a raw JSON object (no markdown) with exactly these fields: ` +
          `arena (string), founded (number - year founded), stanleyCups (number), ` +
          `conferenceChampionships (number - total conference final appearances), ` +
          `hallOfFamers (number - players inducted into the Hockey Hall of Fame).`;
        const info = await InterfaceWithChatBot({ content: prompt }, triCode);
        setAiHistory({
          arena: info.arena ?? '—',
          founded: info.founded ?? 0,
          stanleyCups: info.stanleyCups ?? 0,
          conferenceChampionships: info.conferenceChampionships ?? 0,
          hallOfFamers: info.hallOfFamers ?? 0,
        });
        setAiHistoryStatus('ready');
      } catch (err) {
        console.error('Error fetching AI-generated team history', err);
        setAiHistoryStatus('error');
      }
    }

    fetchAiHistory();
  }, [teamId, triCode]);

  const team: TeamOverview | null = useMemo(() => {
    if (teamRawResponse == null) {
      return null;
    }
    return buildTeamOverview(
      teamRawResponse,
      triCode,
      easternStandingsData,
      westernStandingsData,
    );
  }, [teamRawResponse, easternStandingsData, westernStandingsData, triCode]);

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
        <nav className={styles['team-tabs']} aria-label="Team sections">
          {TEAM_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={cx(styles['team-tab'], tab === t.key && styles.active)}
              aria-current={tab === t.key ? 'page' : undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <OverviewTab
            team={team}
            aiHistory={aiHistory}
            aiHistoryStatus={aiHistoryStatus}
            stats={stats}
            playerStats={playerStats}
            headshotMap={headshotMap}
          />
        )}
        {tab === 'roster' && <RosterTab roster={roster} />}
        {tab === 'schedule' && (
          <ScheduleTab
            games={schedule}
            teamAbbrev={triCode}
            sourceLabel={team.name}
            sourcePath={teamSourcePath}
            activeNavPath={teamActiveNavPath}
          />
        )}
        {tab === 'skaters' && <SkatersTab players={playerStats} />}
        {tab === 'goalies' && <GoaliesTab goalies={goalieStats} />}
        {tab === 'history' && (
          <HistoryTab team={team} aiHistory={aiHistory} status={aiHistoryStatus} />
        )}
      </div>
    </div>
  );
}
