import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ScheduleFilter } from '@/features/schedule/utils/scheduleFilterHelper';
import { formatDateParam } from '@/features/schedule/utils/scheduleHelper';
import {
  ScheduleView,
  ViewParamType,
} from '@/features/schedule/utils/scheduleViewHelper';

/**
 * The schedule page's URL-backed state: the `date`, `view`, `team`, `status`
 * and `type` search params, plus setters that write them back. Any filter
 * value other than a recognized one falls back to "no filter" so a malformed
 * deep link never throws. Setting or clearing a filter replaces the history
 * entry, while picking a date or drilling into a day pushes one.
 */
export function useScheduleUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDateParam = searchParams.get('date');
  const viewParam = (searchParams.get('view') ??
    ViewParamType.DAY) as ScheduleView;
  const teamParam = searchParams.get('team');
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');

  const filter: ScheduleFilter = useMemo(
    () => ({
      team: teamParam,
      status:
        statusParam === 'upcoming' || statusParam === 'final'
          ? statusParam
          : null,
      gameType:
        typeParam === 'regular' || typeParam === 'playoff' ? typeParam : null,
    }),
    [teamParam, statusParam, typeParam],
  );
  const isFilterActive =
    filter.team != null || filter.status != null || filter.gameType != null;

  /** Stores a calendar anchor date in the URL. */
  const setDate = (date: Date) => {
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);
      nextParams.set('date', formatDateParam(date));
      return nextParams;
    });
  };

  /** Stores the schedule projection (day/week/month) in the URL. */
  const setView = (view: ScheduleView) => {
    setSearchParams(
      (params) => {
        const nextParams = new URLSearchParams(params);
        nextParams.set('view', view);
        return nextParams;
      },
      { replace: true },
    );
  };

  /** Stores one filter param, or removes it when the value is empty ("All"). */
  const setFilterParam = (name: 'team' | 'status' | 'type', value: string) => {
    setSearchParams(
      (params) => {
        const nextParams = new URLSearchParams(params);
        if (value) {
          nextParams.set(name, value);
        } else {
          nextParams.delete(name);
        }
        return nextParams;
      },
      { replace: true },
    );
  };

  /** Opens the day view for a date, keeping the other URL params. */
  const openDay = (date: Date) => {
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);
      nextParams.set('date', formatDateParam(date));
      nextParams.set('view', ViewParamType.DAY);
      return nextParams;
    });
  };

  return {
    selectedDateParam,
    viewParam,
    filter,
    isFilterActive,
    setDate,
    setView,
    setTeamFilter: (team: string) => setFilterParam('team', team),
    setStatusFilter: (status: string) => setFilterParam('status', status),
    setTypeFilter: (type: string) => setFilterParam('type', type),
    openDay,
  };
}
