import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { localTeamList } from '../../Data/LocalData/teamListData';
import { ScheduledGame } from '../../Data/Models/scheduledGame';
import shared from '../../Style/shared.module.css';
import styles from '../../Style/TeamPage/TeamPage.module.css';

const PAGE_SIZE = 7;
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ScheduleStripProps {
  games: ScheduledGame[];
  teamAbbrev: string;
  sourceLabel: string;
  sourcePath: string;
  activeNavPath: string;
}

export default function ScheduleStrip({
  games,
  teamAbbrev,
  sourceLabel,
  sourcePath,
  activeNavPath,
}: ScheduleStripProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [slideDir, setSlideDir] = useState<'prev' | 'next' | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const weekStartIdx = useMemo(() => {
    if (games.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    const idx = games.findIndex((g) => parseGameDate(g.date) >= monday);
    return idx === -1 ? Math.max(0, games.length - PAGE_SIZE) : idx;
  }, [games]);

  const baseOffset = weekStartIdx;

  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const gamesSignature = `${games.length}:${games[0]?.gameId ?? ''}`;
  useEffect(() => {
    setPage(0);
    setSlideDir(null);
  }, [gamesSignature]);

  useEffect(() => {
    if (!mobileScrollRef.current || weekStartIdx === 0) return;
    const CARD_WIDTH = 120;
    const CARD_GAP = 16;
    mobileScrollRef.current.scrollLeft = weekStartIdx * (CARD_WIDTH + CARD_GAP);
  }, [weekStartIdx]);

  const startIdx = Math.max(0, baseOffset + page * PAGE_SIZE);
  const pageGames = games.slice(startIdx, startIdx + PAGE_SIZE);
  const canGoPrev = startIdx > 0;
  const canGoNext = startIdx + PAGE_SIZE < games.length;

  const goTo = (dir: 'prev' | 'next') => {
    setSlideDir(dir);
    setPage((p) => (dir === 'prev' ? p - 1 : p + 1));
    setAnimKey((k) => k + 1);
  };

  const isGameCompleted = (game: ScheduledGame): boolean => {
    return game.gameState === 'OFF' || game.gameState === 'FINAL';
  };

  const isGameInProgress = (game: ScheduledGame): boolean => {
    return (
      game.gameState !== 'FUT' &&
      game.gameState !== 'PRE' &&
      game.gameState !== 'OFF' &&
      game.gameState !== 'FINAL'
    );
  };

  const hasScore = (game: ScheduledGame): boolean => {
    return game.homeScore != null && game.awayScore != null;
  };

  const getTeamResult = (game: ScheduledGame): string | null => {
    if (
      !isGameCompleted(game) ||
      game.homeScore == null ||
      game.awayScore == null
    ) {
      return null;
    }

    const isHome = game.homeTeam === teamAbbrev;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const oppScore = isHome ? game.awayScore : game.homeScore;
    const won = teamScore > oppScore;

    if (game.periodType === 'SO') return won ? 'SOW' : 'SOL';
    if (game.periodType === 'OT') return won ? 'OTW' : 'OTL';
    return won ? 'W' : 'L';
  };

  const goToGameDetails = (game: ScheduledGame) => {
    if (!isGameCompleted(game)) return;

    navigate(`/game/${game.gameId}`, {
      state: {
        sourcePath,
        sourceLabel,
        fallbackPath: sourcePath,
        activeNavPath,
      },
    });
  };

  const renderCard = (game: ScheduledGame, index: number) => {
    const isHome = game.homeTeam === teamAbbrev;
    const opponentTriCode = isHome ? game.awayTeam : game.homeTeam;
    const opponentLogo = isHome ? game.awayLogo : game.homeLogo;
    const opponent =
      (localTeamList as any[]).find((team) => team.triCode === opponentTriCode)
        ?.fullName ?? opponentTriCode;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const oppScore = isHome ? game.awayScore : game.homeScore;
    const result = getTeamResult(game);
    const isClickable = isGameCompleted(game);
    const isLive = isGameInProgress(game);

    return (
      <div
        key={game.gameId}
        className={cx(
          styles['schedule-strip__card'],
          shared.surface,
          isClickable && shared.surfaceInteractive,
          isClickable && styles['schedule-strip__card--clickable'],
        )}
        onClick={() => goToGameDetails(game)}
        onKeyDown={(event) => {
          if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            goToGameDetails(game);
          }
        }}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-disabled={!isClickable}
        style={{ '--card-index': index } as React.CSSProperties}
      >
        {game.isPlayoff && (
          <div className={styles['schedule-strip__playoff-badge']}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 -960 960 960"
              width="16px"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z" />
            </svg>
            <span>
              {game.playoffRound != null ? `R${game.playoffRound}` : 'Playoffs'}
              {game.seriesWins != null
                ? ` · ${game.seriesWins}`
                : game.playoffRound != null
                  ? ' · Playoffs'
                  : ''}
            </span>
          </div>
        )}
        <img
          className={styles['schedule-strip__logo']}
          src={opponentLogo}
          alt={opponent}
        />
        <p className={styles['schedule-strip__opponent']}>{opponent}</p>
        {hasScore(game) && teamScore != null && oppScore != null ? (
          <p
            className={cx(
              styles['schedule-strip__score'],
              result && (result.includes('W') ? styles.win : styles.loss),
            )}
          >
            {teamScore} – {oppScore}
          </p>
        ) : (
          <p className={styles['schedule-strip__date']}>
            {formatGameDate(game.date)}
          </p>
        )}
        <div className={styles['schedule-strip__footer']}>
          <span
            className={cx(
              styles['schedule-strip__badge'],
              isHome ? styles.home : styles.away,
            )}
          >
            {isHome ? 'Home' : 'Away'}
          </span>
          {result && (
            <span
              className={cx(
                styles['schedule-strip__result'],
                result.includes('W') ? styles.win : styles.loss,
              )}
            >
              {result}
            </span>
          )}
          {isLive && (
            <span className={cx(styles['schedule-strip__result'], styles.live)}>
              Live
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Schedule</h2>

      <div
        className={cx(
          styles['schedule-strip-wrapper'],
          styles['schedule-strip-wrapper--desktop'],
        )}
      >
        <button
          className={cx(
            styles['schedule-strip__nav'],
            !canGoPrev && styles['schedule-strip__nav--hidden'],
          )}
          onClick={() => goTo('prev')}
          aria-label="Previous games"
          tabIndex={canGoPrev ? 0 : -1}
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
        </button>

        <div
          key={animKey}
          className={cx(
            styles['schedule-strip'],
            slideDir === 'prev' && styles['schedule-strip--prev'],
            slideDir === 'next' && styles['schedule-strip--next'],
          )}
        >
          {pageGames.map((game, index) => renderCard(game, index))}
        </div>

        <button
          className={cx(
            styles['schedule-strip__nav'],
            !canGoNext && styles['schedule-strip__nav--hidden'],
          )}
          onClick={() => goTo('next')}
          aria-label="Next games"
          tabIndex={canGoNext ? 0 : -1}
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div
        className={cx(
          styles['schedule-strip-wrapper'],
          styles['schedule-strip-wrapper--mobile'],
        )}
        ref={mobileScrollRef}
      >
        <div
          className={cx(
            styles['schedule-strip'],
            styles['schedule-strip--scroll'],
          )}
        >
          {games.map((game, index) => renderCard(game, index))}
        </div>
      </div>
    </section>
  );
}

function parseGameDate(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatGameDate(date: string | Date): string {
  return parseGameDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
