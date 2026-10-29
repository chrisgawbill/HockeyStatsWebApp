import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GameDetailBoxscore,
  GameDetailStatus,
} from '@/features/game-detail/types/gameDetail';
import {
  formatGameDate,
  getLiveClockLabel,
  getLocalPuckDropTime,
  getStateLabel,
} from '@/features/game-detail/utils/gameDetailHelper';
import { useTheme } from '@/lib/ThemeContext';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

interface Props {
  boxscore: GameDetailBoxscore;
  status: GameDetailStatus;
}

/** Top-of-page scoreboard: team logos, score, period or puck-drop time, and a status chip. */
export default function HeroScoreboard({ boxscore, status }: Props) {
  const { theme } = useTheme();
  const location = useLocation();
  const { season } = useSeason();

  const awayLogo =
    theme === 'dark'
      ? (boxscore.awayTeam.darkLogo ?? boxscore.awayTeam.logo)
      : boxscore.awayTeam.logo;
  const homeLogo =
    theme === 'dark'
      ? (boxscore.homeTeam.darkLogo ?? boxscore.homeTeam.logo)
      : boxscore.homeTeam.logo;
  const stateLabel = getStateLabel(boxscore, status);
  const isLive = status === 'live';
  const clockLabel = getLiveClockLabel(boxscore, status);
  const isFuture = status === 'preview';
  const puckDropTime = isFuture
    ? getLocalPuckDropTime(boxscore.startTimeUTC)
    : null;
  const routeState = location.state as {
    sourcePath?: string;
    sourceLabel?: string;
    fallbackPath?: string;
  } | null;
  const sourcePath = routeState?.sourcePath ?? '/schedule';
  const sourceLabel =
    (routeState?.sourceLabel ?? sourcePath === '/')
      ? 'Home'
      : sourcePath.startsWith('/standings')
        ? 'Standings'
        : sourcePath.startsWith('/teamList')
          ? 'Team List'
          : sourcePath.startsWith('/team/')
            ? 'Team'
            : 'Schedule';
  const { league } = useLeague();
  const matchupLabel = `${boxscore.awayTeam.abbrev} at ${boxscore.homeTeam.abbrev}`;

  return (
    <div
      className={styles['game-detail-hero']}
      style={
        {
          '--away-team-color': getTeamPrimaryColor(
            boxscore.awayTeam.abbrev,
            league,
          ),
          '--home-team-color': getTeamPrimaryColor(
            boxscore.homeTeam.abbrev,
            league,
          ),
        } as React.CSSProperties
      }
    >
      <nav
        className={styles['game-detail-hero__breadcrumb']}
        aria-label="Breadcrumb"
      >
        <Link
          to={sourcePath}
          className={styles['game-detail-hero__breadcrumb-back']}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {sourceLabel}
        </Link>
        <span className={styles['game-detail-hero__breadcrumb-sep']}>/</span>
        <span className={styles['game-detail-hero__breadcrumb-current']}>
          {matchupLabel}
        </span>
      </nav>
      <div className={styles['game-detail-scoreboard']}>
        <div className={styles['game-detail-team']}>
          <img
            className={styles['game-detail-team__logo']}
            src={awayLogo}
            alt={boxscore.awayTeam.abbrev}
          />
          <span className={styles['game-detail-team__abbrev']}>
            {boxscore.awayTeam.abbrev}
          </span>
          {!isFuture && (
            <span className={styles['game-detail-team__score']}>
              {boxscore.awayTeam.score}
            </span>
          )}
        </div>

        <div className={styles['game-detail-center']}>
          {isFuture ? (
            <span className={styles['game-detail-vs']}>VS</span>
          ) : clockLabel ? (
            <span
              className={styles['game-detail-clock']}
              aria-label={
                clockLabel === 'INT'
                  ? 'Intermission'
                  : `${clockLabel} remaining`
              }
            >
              {clockLabel}
            </span>
          ) : (
            <span className={styles['game-detail-dash']}>–</span>
          )}
          <span
            className={joinClassNames(
              styles['game-detail-state-chip'],
              isLive && styles['game-detail-state-chip--live'],
            )}
            aria-live={isLive ? 'polite' : undefined}
          >
            {stateLabel}
          </span>
        </div>

        <div className={styles['game-detail-team']}>
          <img
            className={styles['game-detail-team__logo']}
            src={homeLogo}
            alt={boxscore.homeTeam.abbrev}
          />
          <span className={styles['game-detail-team__abbrev']}>
            {boxscore.homeTeam.abbrev}
          </span>
          {!isFuture && (
            <span className={styles['game-detail-team__score']}>
              {boxscore.homeTeam.score}
            </span>
          )}
        </div>
      </div>

      <div className={styles['game-detail-meta']}>
        <span>{boxscore.venue?.default}</span>
        <span className={styles['game-detail-meta__sep']}>·</span>
        <span>{formatGameDate(boxscore.gameDate)}</span>
        {isFuture && (
          <>
            <span className={styles['game-detail-meta__sep']}>·</span>
            <span>Puck drop {puckDropTime ?? 'TBD'}</span>
          </>
        )}
      </div>
      {/* The matchup page is NHL only. */}
      {league === 'nhl' && (
        <Link
          className={styles['game-detail-matchup-link']}
          to={`/matchup?teamA=${boxscore.awayTeam.abbrev}&teamB=${boxscore.homeTeam.abbrev}&season=${season}`}
        >
          View season series
        </Link>
      )}
    </div>
  );
}
