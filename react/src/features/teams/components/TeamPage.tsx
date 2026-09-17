import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';

import PageHeader from '@/components/PageHeader';
import shared from '@/styles/shared.module.css';
import TeamHero from '@/features/teams/components/TeamHero';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import TeamStatsRow from '@/features/teams/components/TeamStatsRow';
import PlayerStatsSection from '@/features/teams/components/PlayerStatsSection';
import RosterTab from '@/features/teams/components/tabs/RosterTab';
import ScheduleTab from '@/features/teams/components/tabs/ScheduleTab';
import { localTeamList } from '@/lib/teamListData';
import {
  GoalieStatLine,
  GoalieSummaryContract,
  Position,
  RosterPlayer,
  SkaterSummaryContract,
  StatItem,
  TeamOverview,
  TeamStatsContract,
  TeamSection,
  TEAM_SECTIONS,
  PlayerStatLine,
} from '@/features/teams/types/teamPageTypes';
import {
  buildEmptyRoster,
  buildTeamOverview,
  resolveLegacyTeamTab,
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
  SkaterCorsiResponseDto,
  TeamRosterResponseDto,
  TeamStatsResponseDto,
} from '@/features/teams/api/teamsApi';
import { ScheduleResponseDto } from '@/features/schedule/api/scheduleApi';
import { useStandingsContext } from '@/features/standings/hooks/StandingsContext';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useTheme } from '@/lib/ThemeContext';
import { toDarkModeAccentColor } from '@/features/teams/utils/teamColor';
import styles from '@/features/teams/components/TeamPage.module.css';
import { ConvertContractsToGames } from '@/features/schedule/utils/scheduleHelper';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import FormStrip from '@/features/teams/components/FormStrip';
import PointsPaceSparkline from '@/features/teams/components/PointsPaceSparkline';
import SplitBars from '@/features/teams/components/SplitBars';
import TeamDna from '@/features/teams/components/TeamDna';
import {
  cumulativeGoalDiff,
  getTeamResults,
  homeRoadSplits,
  lastN,
  rollingPointsPct,
} from '@/features/teams/utils/teamFormHelper';
import { buildTeamDna } from '@/features/teams/utils/teamDnaHelper';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const TEAM_SECTION_KEYS = new Set(TEAM_SECTIONS.map((s) => s.key));

/**
 * Team route (`/team/:teamId`, where the param is actually a tri-code). Pulls the
 * numeric team id and primary color from local team metadata, then loads stats,
 * roster, schedule, and player stats for the selected season in one batch.
 *
 * The page body is a single scrolling page: every section renders at once and
 * a sticky anchor nav (`#stats`, `#roster`, ...) scrolls to and highlights the
 * section in view, rather than swapping tab content in and out. TeamHero above
 * the nav is always visible and is built entirely from official standings-context
 * data. Old `?tab=` links (from before this page used anchors) are redirected to
 * the matching section on load, for backward compatibility.
 */
export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const triCode: string = teamId?.toUpperCase() ?? '';
  const teamSourcePath = location.pathname;
  const { easternStandingsData, westernStandingsData } = useStandingsContext();
  const { season } = useSeason();
  const { listOfGamesData } = useListOfGames();
  const { theme } = useTheme();
  const teamActiveNavPath =
    routeState?.activeNavPath ?? routeState?.sourcePath ?? '/teamList';
  const teamEntry = (localTeamList as any[]).find((t) => t.triCode === triCode);
  const numericId: number = teamEntry?.id ?? 0;
  const primaryColor: string = teamEntry?.primary ?? '#1B4F8A';
  // Team brand colors are picked for a light background and read as
  // low-contrast text on the dark theme — lighten (same hue) rather than
  // use the raw brand hex when --color-primary substitutes for it here.
  const primaryColorForTheme =
    theme === 'dark' ? toDarkModeAccentColor(primaryColor) : primaryColor;

  const pageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hasHandledDeepLinkRef = useRef(false);
  const [activeSection, setActiveSection] = useState<TeamSection>(
    TEAM_SECTIONS[0].key,
  );
  const [stickyOffsets, setStickyOffsets] = useState({ header: 0, nav: 0 });

  const pageStyle = {
    '--color-primary': primaryColorForTheme,
    '--sticky-header-h': `${stickyOffsets.header}px`,
    '--sticky-nav-h': `${stickyOffsets.nav}px`,
  } as React.CSSProperties;

  const [teamRawResponse, setTeamRawResponse] =
    useState<TeamStatsContract | null>(null);
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
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads the team data that changes by selected season: summary stats,
   * roster, club schedule, skater totals, Corsi, and optional goalie TOI. The
   * results are shaped into the TeamPage view models and stored in state. On
   * failure it stores a human-readable message instead of the raw API error
   * so the retry action below has something to render.
   */
  const fetchMain = useCallback(async () => {
    setError(null);
    try {
      const [
        statsRes,
        rosterRes,
        scheduleRes,
        summaryRes,
        corsiRes,
        goalieRes,
      ]: [
        TeamStatsResponseDto,
        TeamRosterResponseDto,
        ScheduleResponseDto,
        SkaterSummaryContract[],
        SkaterCorsiResponseDto,
        GoalieSummaryContract[] | null,
      ] = await Promise.all([
        GetTeamStatsById(String(numericId), season),
        GetTeamRoster(triCode, season),
        GetTeamSchedule(triCode, season),
        GetSkaterSummary(String(numericId), season),
        GetSkaterCorsi(String(numericId), season),
        GetGoalieSummary(String(numericId), season).catch(() => null),
      ]);

      const raw: TeamStatsContract = statsRes.data[0] ?? { name: '' };
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
      setError("Couldn't load this team.");
    } finally {
      setLoading(false);
    }
  }, [numericId, triCode, season]);

  /**
   * Re-runs the season fetch for the current team/season. Shared by the
   * mount/season-change effect and the manual "Try again" retry action so
   * there is one fetch code path instead of two copies of the same
   * reset-then-fetch sequence.
   */
  const refetchTeam = useCallback(() => {
    setLoading(true);
    fetchMain();
  }, [fetchMain]);

  useEffect(() => {
    if (!triCode) return;
    refetchTeam();
  }, [triCode, refetchTeam]);

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

  const contentReady = !loading && !error && team != null;

  const teamForm = useMemo(() => {
    const results = getTeamResults(listOfGamesData, triCode);
    return {
      results,
      recent: lastN(results, 10),
      pace: rollingPointsPct(results, 10),
      goalDiff: cumulativeGoalDiff(results),
      splits: homeRoadSplits(results),
    };
  }, [listOfGamesData, triCode, season]);

  const teamDna = useMemo(
    () => buildTeamDna({ stats: teamRawResponse ?? { name: '' }, ...teamForm }),
    [teamForm, teamRawResponse],
  );

  // Measures the sticky header (PageHeader, rendered as this page's first
  // child) and the anchor nav so their combined height can drive both the
  // nav's own sticky offset and every section's scroll-margin-top — kept in
  // sync with a resize listener since nav height can change when it wraps.
  useLayoutEffect(() => {
    if (!contentReady) return;

    function measure() {
      const headerEl = pageRef.current?.firstElementChild as HTMLElement | null;
      const navEl = navRef.current;
      setStickyOffsets({
        header: headerEl?.getBoundingClientRect().height ?? 0,
        nav: navEl?.getBoundingClientRect().height ?? 0,
      });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [contentReady]);

  // Deep links: resolve `#section` (or a legacy `?tab=` link, remapped and
  // stripped from the URL) into the section to land on, once content exists.
  useEffect(() => {
    if (!contentReady || hasHandledDeepLinkRef.current) return;
    hasHandledDeepLinkRef.current = true;

    const rawHash = location.hash.slice(1);
    const hashTarget = TEAM_SECTION_KEYS.has(rawHash as TeamSection)
      ? (rawHash as TeamSection)
      : null;
    const legacyTabParam = searchParams.get('tab');
    const target = hashTarget ?? resolveLegacyTeamTab(legacyTabParam);

    if (legacyTabParam != null || (target && rawHash !== target)) {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      if (target) url.hash = target;
      window.history.replaceState(null, '', url.toString());
    }

    if (target) {
      setActiveSection(target);
      requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({ block: 'start' });
      });
    }
  }, [contentReady, location.hash, searchParams]);

  // Scroll-spy: highlights the nav anchor for whichever section is current
  // just below the sticky header + nav, using IntersectionObserver rather
  // than a scroll listener.
  useEffect(() => {
    if (!contentReady) return;

    const totalOffset = stickyOffsets.header + stickyOffsets.nav;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as TeamSection);
          }
        }
      },
      { rootMargin: `-${totalOffset}px 0px -70% 0px`, threshold: 0 },
    );

    const elements = TEAM_SECTIONS.map((s) =>
      document.getElementById(s.key),
    ).filter((el): el is HTMLElement => el != null);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [contentReady, stickyOffsets.header, stickyOffsets.nav]);

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    key: TeamSection,
  ) {
    event.preventDefault();
    setActiveSection(key);
    document.getElementById(key)?.scrollIntoView({ block: 'start' });
    window.history.pushState(null, '', `#${key}`);
  }

  if (error) {
    return (
      <div
        className={`${styles['team-page']} ${shared.pageShell}`}
        style={pageStyle}
        ref={pageRef}
      >
        <PageHeader />
        <div
          className={`${styles['team-page__content']} ${shared.pageContent}`}
          style={{ paddingTop: 'var(--page-block-start)' }}
        >
          <ErrorState
            fullPage
            title="Couldn't load team"
            message={error}
            onRetry={refetchTeam}
          />
        </div>
      </div>
    );
  }

  if (!contentReady) {
    return (
      <div
        className={`${styles['team-page']} ${shared.pageShell}`}
        style={pageStyle}
        ref={pageRef}
      >
        <PageHeader />
        <div
          className={`${styles['team-page__content']} ${shared.pageContent}`}
          style={{ paddingTop: 'var(--page-block-start)' }}
        >
          <LoadingState label="Loading team" fullPage />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles['team-page']} ${shared.pageShell}`}
      style={pageStyle}
      ref={pageRef}
    >
      <PageHeader />
      <TeamHero team={team} />
      <div className={`${styles['team-page__content']} ${shared.pageContent}`}>
        <nav
          ref={navRef}
          className={styles['team-tabs']}
          aria-label="Team sections"
        >
          {TEAM_SECTIONS.map((s) => (
            <a
              key={s.key}
              href={`#${s.key}`}
              className={cx(
                styles['team-tab'],
                activeSection === s.key && styles.active,
              )}
              aria-current={activeSection === s.key ? 'true' : undefined}
              onClick={(event) => handleNavClick(event, s.key)}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <section id="stats" className={styles['team-section']}>
          <TeamStatsRow stats={stats} />
          <section
            className={`${styles['form-panel']} ${shared.surface}`}
            aria-labelledby="team-form-heading"
          >
            <div className={styles['form-panel__header']}>
              <div>
                <h2 id="team-form-heading" className={shared.sectionTitle}>
                  Team Form
                </h2>
                <p className={styles['form-panel__caption']}>
                  {teamForm.results.length} completed games · goal differential{' '}
                  {teamForm.goalDiff > 0 ? '+' : ''}
                  {teamForm.goalDiff}
                </p>
              </div>
              <div className={styles['form-panel__recent']}>
                <span className={styles['form-panel__label']}>Last 10</span>
                <FormStrip results={teamForm.recent} />
              </div>
            </div>
            <div className={styles['form-panel__grid']}>
              <div>
                <h3 className={styles['form-panel__subheading']}>
                  Rolling points percentage
                </h3>
                <PointsPaceSparkline values={teamForm.pace} />
              </div>
              <div>
                <h3 className={styles['form-panel__subheading']}>
                  Home / Road
                </h3>
                <SplitBars {...teamForm.splits} />
              </div>
            </div>
          </section>
          <TeamDna metrics={teamDna} season={season} />
        </section>
        <section id="leaders" className={styles['team-section']}>
          <PlayerStatsSection
            players={playerStats}
            goalies={goalieStats}
            headshotMap={headshotMap}
          />
        </section>
        <section id="roster" className={styles['team-section']}>
          <RosterTab roster={roster} />
        </section>
        <section id="schedule" className={styles['team-section']}>
          <ScheduleTab
            games={schedule}
            teamAbbrev={triCode}
            sourceLabel={team.name}
            sourcePath={teamSourcePath}
            activeNavPath={teamActiveNavPath}
          />
        </section>
      </div>
    </div>
  );
}
