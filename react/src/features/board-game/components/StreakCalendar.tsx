import { useState } from 'react';
import type { StreakData } from '@/features/board-game/data/dailyStreak';
import { todayKey } from '@/features/board-game/data/dailyStreak';
import GameButton from '@/features/board-game/components/GameButton';
import PuckToken from '@/features/board-game/components/PuckToken';
import styles from '@/features/board-game/components/StreakCalendar.module.css';

export interface StreakCalendarProps {
  streakData: StreakData;
  streak: number;
  onClose: () => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Months back the header arrows may navigate; GC drops win entries older than 60 days. */
const MAX_MONTHS_BACK = 2;

interface DayCell {
  day: number | null;
  key: string | null;
}

/** Formats a local calendar date as "YYYY-MM-DD", matching data/dailyStreak.ts's todayKey(). */
function formatDateKey(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

function buildCells(year: number, month: number): DayCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();
  const cells: DayCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, key: null });
  }
  for (let day = 1; day <= numDays; day++) {
    cells.push({ day, key: formatDateKey(year, month, day) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, key: null });
  }

  return cells;
}

/** Read-only pixel-art monthly calendar showing the daily win streak (§9.3). Dumb: props in, callback out. */
export default function StreakCalendar({
  streakData,
  streak,
  onClose,
}: StreakCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const today = todayKey();

  const cells = buildCells(year, month);
  const canGoBack = monthOffset > -MAX_MONTHS_BACK;
  const canGoForward = monthOffset < 0;

  return (
    <div className={styles.panel}>
      <div className={styles.streakLine}>
        {streak > 0 ? `🔥 ${streak}-day streak` : 'No streak'}
      </div>
      {streak >= 1 && (
        <div className={styles.rewardLine}>+1⚡ bonus energy today</div>
      )}

      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setMonthOffset((offset) => offset - 1)}
          disabled={!canGoBack}
          aria-label="Previous month"
        >
          ◀
        </button>
        <span className={styles.monthLabel}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setMonthOffset((offset) => offset + 1)}
          disabled={!canGoForward}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      <div className={styles.grid}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={styles.dayHeader}>
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (cell.day === null || cell.key === null) {
            return (
              <div
                key={`empty-${index}`}
                className={styles.cellEmpty}
                aria-hidden="true"
              />
            );
          }

          const isToday = cell.key === today;
          const isFuture = cell.key > today;
          const isWon = streakData.wins[cell.key] === true;

          const cellClassName = [
            styles.cell,
            isToday ? styles.cellToday : '',
            isFuture ? styles.cellFuture : '',
          ]
            .filter(Boolean)
            .join(' ');

          const label = `${MONTH_NAMES[month]} ${cell.day}${isToday ? ' (today)' : ''}${isWon ? ', won' : ''}`;

          return (
            <div
              key={cell.key}
              className={cellClassName}
              aria-label={isFuture ? undefined : label}
              aria-hidden={isFuture ? 'true' : undefined}
            >
              <span className={styles.dayNumber}>{cell.day}</span>
              {isWon && (
                <span className={styles.puckWrap} aria-hidden="true">
                  <PuckToken loose={false} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <GameButton onClick={onClose} variant="secondary">
          Back
        </GameButton>
      </div>
    </div>
  );
}
