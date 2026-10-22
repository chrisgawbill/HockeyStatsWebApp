import { useEffect, useMemo } from 'react';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import PageHeader from '@/components/PageHeader';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import styles from '@/features/schedule/components/SchedulePage.module.css';
import { useNavigate } from 'react-router-dom';
import ScheduleCard from '@/features/schedule/components/ScheduleCard';
import ScheduleCalendar from '@/features/schedule/components/ScheduleCalendar';
import DatePicker from '@/features/schedule/components/DatePicker';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import SlidingToggle from '@/components/SlidingToggle';
import ScheduleFilterBar from '@/features/schedule/components/ScheduleFilterBar';
import { useScheduleUrlState } from '@/features/schedule/hooks/useScheduleUrlState';
import {
  getDaysForView,
  isCalendarView,
  MAX_CHIPS_BY_VIEW,
  VIEW_OPTIONS,
} from '@/features/schedule/utils/scheduleViewHelper';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import {
  formatSeasonLabel,
  getSeasonDateRange,
} from '@/features/season/utils/seasonHelper';
import {
  formatDateParam,
  groupGamesByDate,
  resolveEffectiveDate,
} from '@/features/schedule/utils/scheduleHelper';
import { filterGames } from '@/features/schedule/utils/scheduleFilterHelper';
import { parseLocalDate } from '@/lib/dateFormat';
import { getGamePath } from '@/lib/gamePath';
import { localTeamList } from '@/lib/teamListData';

/**
 * Schedule route. Reads the whole season from ScheduleContext and renders one of
 * three views chosen by the `?view=day|week|month` URL param: the tall day cards
 * or the shared week/month calendar grid. `?date=` anchors which day/week/month
 * is shown and `?season=` (via the global nav selector) is the only param that re-fetches;
 * day/week/month are pure client-side projections of the already-loaded games.
 */
function SchedulePage() {
  const {
    listOfGamesData,
    loadingListOfGamesData,
    errorListOfGamesData,
    selectedDateGames,
    fetchGamesByDate,
    refetchGames,
  } = useListOfGames();
  const navigate = useNavigate();
  const { season } = useSeason();
  const {
    selectedDateParam,
    viewParam,
    filter,
    isFilterActive,
    setDate,
    setView,
    setTeamFilter,
    setStatusFilter,
    setTypeFilter,
    openDay,
  } = useScheduleUrlState();

  const selectedDate = useMemo(() => {
    if (!selectedDateParam) return null;
    try {
      return parseLocalDate(selectedDateParam);
    } catch {
      return null;
    }
  }, [selectedDateParam]);

  const seasonDateRange = useMemo(() => getSeasonDateRange(season), [season]);

  const effectiveDate = useMemo(
    () => resolveEffectiveDate(selectedDate, seasonDateRange),
    [selectedDate, seasonDateRange],
  );

  /**
   * Team options for the filter dropdown, derived from the canonical local NHL
   * team list rather than the teams appearing in the loaded season, so non-NHL
   * clubs (exhibition/international/all-star entries) in the game feed don't
   * leak into the filter.
   */
  const teamOptions = useMemo(
    () => localTeamList.map((team) => team.triCode).sort(),
    [],
  );

  /**
   * The loaded season, projected through the URL's team/status/type filters.
   * Zero network requests: this only re-slices the already-fetched array.
   */
  const filteredSeasonGames = useMemo(
    () =>
      filterGames(listOfGamesData ?? [], filter, {
        now: new Date(),
        statusFilter: 'time',
      }),
    [listOfGamesData, filter],
  );

  const filteredSelectedDateGames = useMemo(
    () =>
      filterGames(selectedDateGames, filter, {
        now: new Date(),
        statusFilter: 'time',
      }),
    [selectedDateGames, filter],
  );

  const gamesByDate = useMemo(
    () => groupGamesByDate(filteredSeasonGames),
    [filteredSeasonGames],
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

  /** Stores the chosen date in the URL and loads that day's games. */
  const handleDateChange = (date: Date) => {
    setDate(date);
    fetchGamesByDate(date);
  };

  /**
   * Opens a game (its matchup preview before puck drop, else its game page)
   * and carries schedule return state so the back link lands on the same
   * view/date.
   */
  const goToGameDetails = (game: ScheduledGame) => {
    const backPath = `/schedule?view=${viewParam}&date=${formatDateParam(effectiveDate)}`;
    navigate(getGamePath({ ...game, startTime: game.gameTime }), {
      state: {
        sourcePath: backPath,
        fallbackPath: backPath,
        activeNavPath: '/schedule',
      },
    });
  };

  const hasGames = !!listOfGamesData && listOfGamesData.length > 0;
  const periodHasGames = visibleDates.some(
    (date) => (gamesByDate[formatDateParam(date)] ?? []).length > 0,
  );

  return (
    <>
      <PageHeader />
      <main className={`${styles['schedule-page']} ds-page-shell ds-container`}>
        <h1 className="ds-visually-hidden">Schedule</h1>
        {loadingListOfGamesData ? (
          <LoadingState label="Loading schedule" fullPage />
        ) : errorListOfGamesData ? (
          <ErrorState
            fullPage
            title="Couldn't load the schedule"
            message={errorListOfGamesData}
            onRetry={refetchGames}
          />
        ) : !hasGames ? (
          <EmptyState
            fullPage
            title="No games scheduled"
            message={`No games available for ${formatSeasonLabel(season)}.`}
          />
        ) : (
          <>
            <ScheduleFilterBar
              filter={filter}
              teamOptions={teamOptions}
              onTeamChange={setTeamFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
            />
            <div className={styles['schedule-view-toggle']}>
              <SlidingToggle
                options={VIEW_OPTIONS}
                value={viewParam}
                onChange={setView}
              />
            </div>
            <div className={styles['schedule-date-nav']}>
              <DatePicker
                seasonRange={seasonDateRange}
                selectedDate={effectiveDate}
                view={viewParam}
                onDateChange={handleDateChange}
              />
            </div>
            {isCalendarView(viewParam) ? (
              periodHasGames ? (
                <ScheduleCalendar
                  view={viewParam}
                  days={visibleDates}
                  gamesByDate={gamesByDate}
                  maxVisible={MAX_CHIPS_BY_VIEW[viewParam]}
                  onSelectDay={openDay}
                  onSelectGame={goToGameDetails}
                />
              ) : (
                <EmptyState
                  message={
                    isFilterActive
                      ? 'No games match your filters.'
                      : `No games scheduled for this ${viewParam}.`
                  }
                />
              )
            ) : filteredSelectedDateGames.length === 0 ? (
              <EmptyState
                message={
                  isFilterActive && selectedDateGames.length > 0
                    ? 'No games match your filters.'
                    : 'No games scheduled for this day.'
                }
              />
            ) : (
              filteredSelectedDateGames.map((game: ScheduledGame) => (
                <ScheduleCard
                  key={game.gameId}
                  game={game}
                  goToGameDetails={goToGameDetails}
                />
              ))
            )}
          </>
        )}
      </main>
    </>
  );
}

export default SchedulePage;
