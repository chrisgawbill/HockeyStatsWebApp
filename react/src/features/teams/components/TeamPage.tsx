import React, { useMemo, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import PageHeader from '@/components/PageHeader';
import shared from '@/styles/shared.module.css';
import TeamHero from '@/features/teams/components/TeamHero';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import PlayerStatsSection from '@/features/teams/components/PlayerStatsSection';
import RosterTab from '@/features/teams/components/tabs/RosterTab';
import ScheduleTab from '@/features/teams/components/tabs/ScheduleTab';
import TeamDna from '@/components/TeamDna';
import TeamFormPanel from '@/components/TeamFormPanel';
import { getTeamList } from '@/lib/teamListData';
import {
  TeamOverview,
  TEAM_SECTIONS,
} from '@/features/teams/types/teamPageTypes';
import { buildTeamOverview } from '@/features/teams/utils/teamPageHelper';
import { useStandingsContext } from '@/features/standings/hooks/StandingsContext';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useLeague } from '@/lib/LeagueContext';
import { useTheme } from '@/lib/ThemeContext';
import { toDarkModeAccentColor } from '@/lib/teamColor';
import styles from '@/features/teams/components/TeamPage.module.css';
import { useListOfTeamsData } from '@/features/teams/hooks/ListOfTeamsContext';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { useStickyOffsets } from '@/features/teams/hooks/useStickyOffsets';
import { useTeamPageData } from '@/features/teams/hooks/useTeamPageData';
import { useTeamSectionNav } from '@/features/teams/hooks/useTeamSectionNav';
import { buildTeamForm } from '@/lib/teamForm';
import { buildTeamDna } from '@/lib/teamDna';
import { joinClassNames } from '@/lib/joinClassNames';

const FALLBACK_PRIMARY_COLOR = '#1B4F8A';

interface TeamPageFrameProps {
  pageRef: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
  children: React.ReactNode;
}

/** Outer shell shared by the loading, error, and loaded states of the page. */
function TeamPageFrame({ pageRef, style, children }: TeamPageFrameProps) {
  return (
    <div
      className={`${styles['team-page']} ${shared.pageShell}`}
      style={style}
      ref={pageRef}
    >
      {children}
    </div>
  );
}

/** Body shown in place of the team while it is loading or failed to load. */
function TeamPageStatus({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <h1 className="ds-visually-hidden">Team</h1>
      <div
        className={`${styles['team-page__content']} ${shared.pageContent}`}
        style={{ paddingTop: 'var(--page-block-start)' }}
      >
        {children}
      </div>
    </main>
  );
}

/**
 * Team route (`/team/:teamId`, where the param is actually a tri-code). Pulls the
 * numeric team id and primary color from the league's local team metadata
 * (AHL clubs have no color, so the page uses its default), then loads stats,
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
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const triCode: string = teamId?.toUpperCase() ?? '';
  const teamSourcePath = location.pathname;
  const { easternStandingsData, westernStandingsData } = useStandingsContext();
  const { season } = useSeason();
  const { league } = useLeague();
  const { listOfGamesData } = useListOfGames();
  const { listOfTeamsData } = useListOfTeamsData();
  const { theme } = useTheme();
  const teamActiveNavPath =
    routeState?.activeNavPath ?? routeState?.sourcePath ?? '/teamList';
  const teamEntry = getTeamList(league).find(
    (entry) => entry.triCode === triCode,
  );
  const numericId: number = teamEntry?.id ?? 0;
  const primaryColor: string = teamEntry?.primary ?? FALLBACK_PRIMARY_COLOR;
  const primaryColorForTheme =
    theme === 'dark' ? toDarkModeAccentColor(primaryColor) : primaryColor;

  const pageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const {
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
  } = useTeamPageData({ numericId, triCode, season, league });

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

  const stickyOffsets = useStickyOffsets(pageRef, navRef, contentReady);
  const { activeSection, handleNavClick } = useTeamSectionNav(
    contentReady,
    stickyOffsets,
  );

  const pageStyle = {
    '--color-primary': primaryColorForTheme,
    '--sticky-header-h': `${stickyOffsets.header}px`,
    '--sticky-nav-h': `${stickyOffsets.nav}px`,
  } as React.CSSProperties;

  const teamForm = useMemo(
    () => buildTeamForm(listOfGamesData, triCode),
    [listOfGamesData, triCode],
  );

  const teamDna = useMemo(
    () =>
      buildTeamDna({
        stats: teamRawResponse ?? { teamFullName: '' },
        league: listOfTeamsData,
        season,
        teamId: numericId,
      }),
    [teamRawResponse, listOfTeamsData, season, numericId],
  );

  if (error) {
    return (
      <TeamPageFrame pageRef={pageRef} style={pageStyle}>
        <PageHeader />
        <TeamPageStatus>
          <ErrorState
            fullPage
            title="Couldn't load team"
            message={error}
            onRetry={refetchTeam}
          />
        </TeamPageStatus>
      </TeamPageFrame>
    );
  }

  if (!contentReady) {
    return (
      <TeamPageFrame pageRef={pageRef} style={pageStyle}>
        <PageHeader />
        <TeamPageStatus>
          <LoadingState label="Loading team" fullPage />
        </TeamPageStatus>
      </TeamPageFrame>
    );
  }

  return (
    <TeamPageFrame pageRef={pageRef} style={pageStyle}>
      <PageHeader />
      <main>
        <TeamHero team={team} />
        <div
          className={`${styles['team-page__content']} ${shared.pageContent}`}
        >
          <nav
            ref={navRef}
            className={styles['team-tabs']}
            aria-label="Team sections"
          >
            {TEAM_SECTIONS.map((section) => (
              <a
                key={section.key}
                href={`#${section.key}`}
                className={joinClassNames(
                  styles['team-tab'],
                  activeSection === section.key && styles.active,
                )}
                aria-current={
                  activeSection === section.key ? 'true' : undefined
                }
                onClick={(event) => handleNavClick(event, section.key)}
              >
                {section.label}
              </a>
            ))}
          </nav>

          <section id="stats" className={styles['team-section']}>
            <TeamDna profile={teamDna} season={season} />
            <TeamFormPanel
              teamForm={teamForm}
              className={styles['team-form']}
            />
          </section>
          <section id="leaders" className={styles['team-section']}>
            <PlayerStatsSection
              players={playerStats}
              goalies={goalieStats}
              headshotMap={headshotMap}
            />
          </section>
          <section id="roster" className={styles['team-section']}>
            <RosterTab
              roster={roster}
              triCode={triCode}
              lines={teamLines}
              playerStats={playerStats}
              goalieStats={goalieStats}
            />
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
      </main>
    </TeamPageFrame>
  );
}
