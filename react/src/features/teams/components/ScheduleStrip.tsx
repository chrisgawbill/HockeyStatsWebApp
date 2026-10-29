import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { getGamePath } from '@/lib/gamePath';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';
import {
  SCHEDULE_STRIP_PAGE_SIZE,
  findCurrentWeekStartIndex,
} from '@/features/teams/utils/scheduleStripHelper';
import ScheduleStripCard from '@/features/teams/components/ScheduleStripCard';
import { joinClassNames } from '@/lib/joinClassNames';

interface ScheduleStripProps {
  games: ScheduledGame[];
  teamAbbrev: string;
  sourceLabel: string;
  sourcePath: string;
  activeNavPath: string;
}

/**
 * Horizontal schedule of a team's games. Desktop shows seven games a page,
 * opening on the current week, with previous/next arrows; phones get the whole
 * season as a scroller positioned at the current week. Completed games link to
 * their detail page.
 */
export default function ScheduleStrip({
  games,
  teamAbbrev,
  sourceLabel,
  sourcePath,
  activeNavPath,
}: ScheduleStripProps) {
  const navigate = useNavigate();
  const { league } = useLeague();
  const [page, setPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'prev' | 'next' | null>(
    null,
  );
  const [animationKey, setAnimationKey] = useState(0);

  const weekStartIndex = useMemo(
    () => findCurrentWeekStartIndex(games),
    [games],
  );

  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const gamesSignature = `${games.length}:${games[0]?.gameId ?? ''}`;
  useEffect(() => {
    setPage(0);
    setSlideDirection(null);
  }, [gamesSignature]);

  useEffect(() => {
    if (!mobileScrollRef.current || weekStartIndex === 0) return;
    const CARD_WIDTH = 120;
    const CARD_GAP = 16;
    mobileScrollRef.current.scrollLeft =
      weekStartIndex * (CARD_WIDTH + CARD_GAP);
  }, [weekStartIndex]);

  const startIndex = Math.max(
    0,
    weekStartIndex + page * SCHEDULE_STRIP_PAGE_SIZE,
  );
  const pageGames = games.slice(
    startIndex,
    startIndex + SCHEDULE_STRIP_PAGE_SIZE,
  );
  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + SCHEDULE_STRIP_PAGE_SIZE < games.length;

  const goTo = (direction: 'prev' | 'next') => {
    setSlideDirection(direction);
    setPage((currentPage) =>
      direction === 'prev' ? currentPage - 1 : currentPage + 1,
    );
    setAnimationKey((currentKey) => currentKey + 1);
  };

  /** Opens a game: its matchup preview before puck drop, else its game page. */
  const goToGameDetails = (game: ScheduledGame) => {
    navigate(
      getGamePath({ ...game, startTime: game.gameTime }, new Date(), league),
      {
        state: {
          sourcePath,
          sourceLabel,
          fallbackPath: sourcePath,
          activeNavPath,
        },
      },
    );
  };

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Schedule</h2>

      <div
        className={joinClassNames(
          styles['schedule-strip-wrapper'],
          styles['schedule-strip-wrapper--desktop'],
        )}
      >
        <button
          className={joinClassNames(
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
          key={animationKey}
          className={joinClassNames(
            styles['schedule-strip'],
            slideDirection === 'prev' && styles['schedule-strip--prev'],
            slideDirection === 'next' && styles['schedule-strip--next'],
          )}
        >
          {pageGames.map((game, index) => (
            <ScheduleStripCard
              key={game.gameId}
              game={game}
              index={index}
              teamAbbrev={teamAbbrev}
              onOpenGame={goToGameDetails}
            />
          ))}
        </div>

        <button
          className={joinClassNames(
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
        className={joinClassNames(
          styles['schedule-strip-wrapper'],
          styles['schedule-strip-wrapper--mobile'],
        )}
        ref={mobileScrollRef}
      >
        <div
          className={joinClassNames(
            styles['schedule-strip'],
            styles['schedule-strip--scroll'],
          )}
        >
          {games.map((game, index) => (
            <ScheduleStripCard
              key={game.gameId}
              game={game}
              index={index}
              teamAbbrev={teamAbbrev}
              onOpenGame={goToGameDetails}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
