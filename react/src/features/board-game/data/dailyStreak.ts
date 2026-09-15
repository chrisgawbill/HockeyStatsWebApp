export interface StreakData {
  wins: Record<string, true>;
  lastWinDate: string | null;
}

const STREAK_STORAGE_KEY = 'rinkquest-streak';
const GC_DAYS = 60;

export function todayKey(): string {
  return formatDate(new Date());
}

export function loadStreak(): StreakData {
  try {
    const storage = getStorage();
    if (!storage) return defaultStreak();

    const raw = storage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return defaultStreak();

    const parsed = JSON.parse(raw);
    return isStreakData(parsed) ? parsed : defaultStreak();
  } catch {
    return defaultStreak();
  }
}

export function recordWin(data: StreakData): StreakData {
  const today = todayKey();
  const cutoff = dateKeyDaysAgo(GC_DAYS);
  const wins: Record<string, true> = {};

  for (const date of Object.keys(data.wins)) {
    if (isDateKey(date) && date >= cutoff) {
      wins[date] = true;
    }
  }

  wins[today] = true;

  const updated: StreakData = {
    wins,
    lastWinDate: today,
  };

  try {
    getStorage()?.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage may be unavailable or quota-blocked; the caller can still use the
    // in-memory result for the current session.
  }

  return updated;
}

export function currentStreak(data: StreakData): number {
  let cursor = data.wins[todayKey()] ? startOfToday() : addCalendarDays(-1);
  let streak = 0;

  while (data.wins[formatDate(cursor)]) {
    streak++;
    cursor = addCalendarDays(-1, cursor);
  }

  return streak;
}

export function hasStreakBonus(data: StreakData): boolean {
  return currentStreak(data) >= 1;
}

function defaultStreak(): StreakData {
  return { wins: {}, lastWinDate: null };
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isStreakData(value: unknown): value is StreakData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const maybeStreak = value as Partial<StreakData>;
  if (
    maybeStreak.lastWinDate !== null &&
    (typeof maybeStreak.lastWinDate !== 'string' ||
      !isDateKey(maybeStreak.lastWinDate))
  ) {
    return false;
  }

  if (
    !maybeStreak.wins ||
    typeof maybeStreak.wins !== 'object' ||
    Array.isArray(maybeStreak.wins)
  ) {
    return false;
  }

  return Object.entries(maybeStreak.wins).every(
    ([date, value]) => value === true && isDateKey(date),
  );
}

function dateKeyDaysAgo(daysAgo: number): string {
  return formatDate(addCalendarDays(-daysAgo));
}

function addCalendarDays(days: number, from = startOfToday()): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
