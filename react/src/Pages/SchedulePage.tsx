import React, { useEffect, useMemo } from 'react';
import { useListOfGames } from '../Data/Context/ScheduleContext';
import PageHeader from '../Components/PageHeader';
import { Container } from 'react-bootstrap';
import { ScheduledGame } from '../Data/Models/scheduledGame';
import styles from '../style/SchedulePage.module.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScheduleCard from '../Components/SchedulePage/ScheduleCard';
import ScheduleCalendar from '../Components/SchedulePage/ScheduleCalendar';
import DatePicker from '../Components/SchedulePage/DatePicker';
import LoadingState from '../Components/LoadingState';
import EmptyState from '../Components/EmptyState';
import SeasonSelector from '../Components/SeasonSelector';
import SlidingToggle from '../Components/LandingPage/LandingPageStandings/SlidingToggle';
import { useSeason } from '../Data/Context/SeasonContext';
import { formatSeasonLabel } from '../Data/Helpers/seasonHelper';
import {
  formatDateParam,
  groupGamesByDate,
  parseLocalDate,
} from '../Data/Helpers/scheduleHelper';

const ViewParamType = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;
type ScheduleView = (typeof ViewParamType)[keyof typeof ViewParamType];
type CalendarView = typeof ViewParamType.WEEK | typeof ViewParamType.MONTH;

/**
 * Per-view day-cell limit before ScheduleCalendar collapses overflow games into
 * a "+N more" action.
 */
const MAX_CHIPS_BY_VIEW: Record<CalendarView, number> = {
  [ViewParamType.WEEK]: 3,
  [ViewParamType.MONTH]: 2,
};

const VIEW_OPTIONS: { label: string; value: ScheduleView }[] = [
  { label: 'Daily', value: ViewParamType.DAY },
  { label: 'Weekly', value: ViewParamType.WEEK },
  { label: 'Monthly', value: ViewParamType.MONTH },
];

/**
 * Narrows the schedule view union to views rendered by ScheduleCalendar.
 */
function isCalendarView(view: ScheduleView): view is CalendarView {
  return view === ViewParamType.WEEK || view === ViewParamType.MONTH;
}

/**
 * The set of days a view renders, anchored on `targetDate`:
 * - day   → just that day
 * - week  → the Sunday-start week containing it (always 7 days)
 * - month → every day of its month (the grid adds the leading weekday offset)
 * Dates are shifted with clone + setDate so month/year rollover is handled for us.
 */
function getDaysForView(view: ScheduleView, targetDate: Date): Date[] {
  switch (view) {
    case ViewParamType.WEEK: {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    }
    case ViewParamType.MONTH: {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const days: Date[] = [];
      for (let i = 1; i <= 31; i++) {
        const day = new Date(year, month, i);
        if (day.getMonth() !== month) break;
        days.push(day);
      }
      return days;
    }
    case ViewParamType.DAY:
    default:
      return [targetDate];
  }
}

/**
 * Schedule route. Reads the whole season from ScheduleContext and renders one of
 * three views chosen by the `?view=day|week|month` URL param: the tall day cards
 * or the shared week/month calendar grid. `?date=` anchors which day/week/month
 * is shown and `?season=` (via SeasonSelector) is the only param that re-fetches;
 * day/week/month are pure client-side projections of the already-loaded games.
 */
function SchedulePage() {
  const {
    listOfGamesData,
    loadingListOfGamesData,
    selectedDateGames,
    fetchGamesByDate,
  } = useListOfGames();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { season } = useSeason();
  const selectedDateParam = searchParams.get('date');
  const viewParam = (searchParams.get('view') ??
    ViewParamType.DAY) as ScheduleView;

  const selectedDate = useMemo(() => {
    if (!selectedDateParam) return null;
    try {
      return parseLocalDate(selectedDateParam);
    } catch {
      return null;
    }
  }, [selectedDateParam]);

  const sortedGames = useMemo(
    () =>
      [...(listOfGamesData ?? [])].sort(
        (a: ScheduledGame, b: ScheduledGame) =>
          a.date.getTime() - b.date.getTime(),
      ),
    [listOfGamesData],
  );

  const effectiveDate = useMemo(() => {
    if (sortedGames.length === 0) {
      return selectedDate ?? new Date();
    }
    const first = sortedGames[0].date;
    const last = sortedGames[sortedGames.length - 1].date;
    if (selectedDate && selectedDate >= first && selectedDate <= last) {
      return selectedDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= first && today <= last) return today;
    return last;
  }, [selectedDate, sortedGames]);

  const gamesByDate = useMemo(
    () => groupGamesByDate(listOfGamesData ?? []),
    [listOfGamesData],
  );
  const visibleDates = useMemo(
    () => getDaysForView(viewParam, effectiveDate),
    [viewParam, effectiveDate],
  );

  useEffect(() => {
    if (!loadingListOfGamesData && listOfGamesData?.length > 0) {
      fetchGamesByDate(effectiveDate);
    }
  }, [
    fetchGamesByDate,
    listOfGamesData,
    loadingListOfGamesData,
    effectiveDate,
  ]);

  /**
   * Stores the selected calendar anchor in the URL and updates the day-view
   * slice in ScheduleContext.
   */
  const handleDateChange = (date: Date) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('date', formatDateParam(date));
      return next;
    });
    fetchGamesByDate(date);
  };

  /**
   * Stores the selected schedule projection in the URL. This changes only the
   * client-side view; the loaded season data is reused.
   */
  const handleViewChange = (view: ScheduleView) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', view);
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Opens the richer day view for a calendar cell while preserving the selected
   * season and other URL params.
   */
  const handleSelectDay = (date: Date) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('date', formatDateParam(date));
      next.set('view', ViewParamType.DAY);
      return next;
    });
  };

  /**
   * Returns whether a game has reached a completed NHL state and can link to
   * the detail page.
   */
  const isGameCompleted = (game: ScheduledGame): boolean => {
    return game.gameState === 'OFF' || game.gameState === 'FINAL';
  };

  /**
   * Navigates completed games to their detail route and carries schedule return
   * state so the back link lands on the same view/date.
   */
  const goToGameDetails = (game: ScheduledGame) => {
    if (isGameCompleted(game)) {
      const back = `/schedule?view=${viewParam}&date=${formatDateParam(effectiveDate)}`;
      navigate(`/game/${game.gameId}`, {
        state: {
          sourcePath: back,
          fallbackPath: back,
          activeNavPath: '/schedule',
        },
      });
    }
  };

  const hasGames = !!listOfGamesData && listOfGamesData.length > 0;
  const periodHasGames = visibleDates.some(
    (date) => (gamesByDate[formatDateParam(date)] ?? []).length > 0,
  );

  return (
    <>
      <PageHeader />
      <Container fluid className={styles['schedule-page']}>
        <SeasonSelector />
        {loadingListOfGamesData ? (
          <LoadingState label="Loading schedule" fullPage />
        ) : !hasGames ? (
          <EmptyState
            fullPage
            title="No games scheduled"
            message={`No games available for ${formatSeasonLabel(season)}.`}
          />
        ) : (
          <>
            <div className={styles['schedule-view-toggle']}>
              <SlidingToggle
                options={VIEW_OPTIONS}
                value={viewParam}
                onChange={handleViewChange}
              />
            </div>
            <DatePicker
              sortedGames={sortedGames}
              selectedDate={effectiveDate}
              view={viewParam}
              onDateChange={handleDateChange}
            />
            {isCalendarView(viewParam) ? (
              periodHasGames ? (
                <ScheduleCalendar
                  view={viewParam}
                  days={visibleDates}
                  gamesByDate={gamesByDate}
                  maxVisible={MAX_CHIPS_BY_VIEW[viewParam]}
                  isGameCompleted={isGameCompleted}
                  onSelectDay={handleSelectDay}
                  onSelectGame={goToGameDetails}
                />
              ) : (
                <EmptyState
                  message={`No games scheduled for this ${viewParam}.`}
                />
              )
            ) : selectedDateGames.length === 0 ? (
              <EmptyState message="No games scheduled for this day." />
            ) : (
              selectedDateGames.map((game: ScheduledGame) => (
                <ScheduleCard
                  key={game.gameId}
                  game={game}
                  isGameCompleted={isGameCompleted}
                  goToGameDetails={goToGameDetails}
                />
              ))
            )}
          </>
        )}
      </Container>
    </>
  );
}

export default SchedulePage;
