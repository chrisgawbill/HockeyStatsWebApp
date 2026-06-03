import React from 'react';
import { ScheduledGame } from '../../Data/Models/scheduledGame';
import { formatDateParam } from '../../Data/Helpers/scheduleHelper';
import GameChip from './GameChip';
import styles from '../../Style/ScheduleCalendar.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type ScheduleCalendarProps = {
  view: 'week' | 'month';
  /** The days to render, in order. Week = 7 consecutive days; month = the 1st…last. */
  days: Date[];
  gamesByDate: Record<string, ScheduledGame[]>;
  /** Max chips shown per day before collapsing to "+N more". */
  maxVisible: number;
  isGameCompleted: (game: ScheduledGame) => boolean;
  /** Jump into day view for the clicked day (cell header or "+N more"). */
  onSelectDay: (date: Date) => void;
  /** Open a completed game's detail page. */
  onSelectGame: (game: ScheduledGame) => void;
};

const todayKey = formatDateParam(new Date());

/**
 * A 7-column calendar grid shared by the week and month views. Each day looks up
 * its games in `gamesByDate`; empty days render as blank cells (calendar-style).
 * The leading offset (blank cells before the first day) is derived from the first
 * day's weekday, so it works for the month's 1st and is a no-op for a Sunday-start
 * week. Per-day overflow collapses to "+N more", which drops into the day view.
 */
export default function ScheduleCalendar({
  view,
  days,
  gamesByDate,
  maxVisible,
  isGameCompleted,
  onSelectDay,
  onSelectGame,
}: ScheduleCalendarProps) {
  const leadingBlanks = days.length > 0 ? days[0].getDay() : 0;

  return (
    <div
      className={cx(styles['calendar'], styles[`calendar--${view}`])}
      aria-label={`${view} schedule`}
    >
      {WEEKDAYS.map((label) => (
        <div key={label} className={styles['calendar__weekday']}>
          {label}
        </div>
      ))}

      {Array.from({ length: leadingBlanks }, (_, i) => (
        <div
          key={`blank-${i}`}
          className={styles['calendar__blank']}
          aria-hidden="true"
        />
      ))}

      {days.map((day) => {
        const key = formatDateParam(day);
        const games = gamesByDate[key] ?? [];
        const visible = games.slice(0, maxVisible);
        const overflow = games.length - visible.length;
        const isToday = key === todayKey;

        return (
          <div
            key={key}
            className={cx(
              styles['calendar__cell'],
              isToday && styles['calendar__cell--today'],
            )}
          >
            <button
              type="button"
              className={styles['calendar__date']}
              onClick={() => onSelectDay(day)}
              aria-label={`View games for ${day.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}`}
            >
              {day.getDate()}
            </button>

            <div className={styles['calendar__games']}>
              {visible.map((game) => (
                <GameChip
                  key={game.gameId}
                  game={game}
                  isGameCompleted={isGameCompleted}
                  onSelect={onSelectGame}
                />
              ))}
              {overflow > 0 && (
                <button
                  type="button"
                  className={styles['calendar__more']}
                  onClick={() => onSelectDay(day)}
                >
                  +{overflow} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
