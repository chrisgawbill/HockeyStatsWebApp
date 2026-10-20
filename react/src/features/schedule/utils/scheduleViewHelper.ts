/** Values of the schedule page's `?view=` URL param. */
export const ViewParamType = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;
export type ScheduleView = (typeof ViewParamType)[keyof typeof ViewParamType];
export type CalendarView =
  typeof ViewParamType.WEEK | typeof ViewParamType.MONTH;

export const STATUS_OPTIONS: {
  label: string;
  value: '' | 'upcoming' | 'final';
}[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Final', value: 'final' },
];

export const TYPE_OPTIONS: {
  label: string;
  value: '' | 'regular' | 'playoff';
}[] = [
  { label: 'All', value: '' },
  { label: 'Regular', value: 'regular' },
  { label: 'Playoff', value: 'playoff' },
];

export const VIEW_OPTIONS: { label: string; value: ScheduleView }[] = [
  { label: 'Daily', value: ViewParamType.DAY },
  { label: 'Weekly', value: ViewParamType.WEEK },
  { label: 'Monthly', value: ViewParamType.MONTH },
];

/**
 * Per-view day-cell limit before ScheduleCalendar collapses overflow games into
 * a "+N more" action.
 */
export const MAX_CHIPS_BY_VIEW: Record<CalendarView, number> = {
  [ViewParamType.WEEK]: 3,
  [ViewParamType.MONTH]: 2,
};

/** Narrows the schedule view union to views rendered by ScheduleCalendar. */
export function isCalendarView(view: ScheduleView): view is CalendarView {
  return view === ViewParamType.WEEK || view === ViewParamType.MONTH;
}

/**
 * The set of days a view renders, anchored on `targetDate`:
 * - day   → just that day
 * - week  → the Sunday-start week containing it (always 7 days)
 * - month → every day of its month (the grid adds the leading weekday offset)
 * Dates are shifted with clone + setDate so month/year rollover is handled for us.
 */
export function getDaysForView(view: ScheduleView, targetDate: Date): Date[] {
  switch (view) {
    case ViewParamType.WEEK: {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      return Array.from({ length: 7 }, (_, dayOffset) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + dayOffset);
        return day;
      });
    }
    case ViewParamType.MONTH: {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const days: Date[] = [];
      for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth++) {
        const day = new Date(year, month, dayOfMonth);
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
