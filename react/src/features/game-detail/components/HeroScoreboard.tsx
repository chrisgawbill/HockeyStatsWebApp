import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GameDetailBoxscore,
  GameDetailStatus,
} from '@/features/game-detail/types/gameDetail';
import {
  formatGameDate,
  getLocalPuckDropTime,
  getStateLabel,
} from '@/features/game-detail/utils/gameDetailHelper';
import { useTheme } from '@/lib/ThemeContext';
import { getTeamPrimaryColor } from '@/features/teams/utils/teamColor';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  boxscore: GameDetailBoxscore;
  status: GameDetailStatus;
  theme: any;
}

export default function HeroScoreboard({ boxscore, status }: Props) {
  const { theme } = useTheme();
  const location = useLocation();

  const awayLogo =
    theme === 'dark' ? boxscore.awayTeam.darkLogo : boxscore.awayTeam.logo;
  const homeLogo =
    theme === 'dark' ? boxscore.homeTeam.darkLogo : boxscore.homeTeam.logo;
  const stateLabel = getStateLabel(boxscore, status);
  const isLive = status === 'live';
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
  const matchupLabel = `${boxscore.awayTeam.abbrev} at ${boxscore.homeTeam.abbrev}`;

  return (
    <div
      className={styles['game-detail-hero']}
      style={
        {
          '--away-team-color': getTeamPrimaryColor(boxscore.awayTeam.abbrev),
          '--home-team-color': getTeamPrimaryColor(boxscore.homeTeam.abbrev),
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
          ) : (
            <span className={styles['game-detail-dash']}>–</span>
          )}
          <span
            className={cx(
              styles['game-detail-state-chip'],
              isLive && styles['game-detail-state-chip--live'],
            )}
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
    </div>
  );
}
