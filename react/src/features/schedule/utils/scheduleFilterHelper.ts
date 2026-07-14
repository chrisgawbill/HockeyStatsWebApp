import { ScheduledGame } from '@/features/schedule/types/scheduledGame';

export interface ScheduleFilter {
  team: string | null;
  status: 'upcoming' | 'final' | null;
  gameType: 'regular' | 'playoff' | null;
}

export type StatusFilter = 'time' | 'date';
export interface FilterContext {
  now: Date;
  statusFilter: StatusFilter;
}

export function filterGames(
  games: ScheduledGame[],
  filter: ScheduleFilter,
  context: FilterContext,
): ScheduledGame[] {
  return games.filter((game) => {
    if (filter.team != null) {
      if (game.awayTeam !== filter.team && game.homeTeam !== filter.team) {
        return false;
      }
    }

    if (filter.status != null) {
      let isUpcoming = false;

      if (context.statusFilter == 'time') {
        isUpcoming = new Date(game.gameTime).getTime() > context.now.getTime();
      } else {
        const startOfDay = new Date(context.now);
        startOfDay.setHours(0, 0, 0, 0);
        isUpcoming = game.date.getTime() >= startOfDay.getTime();
      }
      const keep = filter.status === 'upcoming' ? isUpcoming : !isUpcoming;

      if (!keep) {
        return false;
      }
    }

    if (filter.gameType != null) {
      if (filter.gameType == 'regular') {
        if (game.isPlayoff) {
          return false;
        }
      }

      if (filter.gameType == 'playoff') {
        if (!game.isPlayoff) {
          return false;
        }
      }
    }

    return true;
  });
}
