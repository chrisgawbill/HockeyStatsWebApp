import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import { describeReport } from '@/features/after-action-reports/utils/afterActionReportFormat';

const ALERTED_KEY = 'aar-alerted-game-ids';
const MAX_REMEMBERED = 200;

export type AlertPermission = NotificationPermission | 'unsupported';

/** What a single poll should alert about; ids are then remembered either way. */
export interface AlertPlan {
  /** Unread reports never alerted before. */
  fresh: AfterActionReport[];
  /** The full remembered set after this poll, newest ids kept. */
  remembered: number[];
}

/**
 * Picks unread reports this browser has not alerted about yet. Every current
 * report id is remembered, alerted or not, so turning alerts on later does not
 * replay the existing inbox. With nothing remembered yet (first poll in this
 * browser) nothing alerts; that poll only primes the set.
 */
export function planAlerts(
  reports: AfterActionReport[],
  remembered: number[] | null,
): AlertPlan {
  const seen = new Set(remembered ?? []);
  const fresh =
    remembered === null
      ? []
      : reports.filter((report) => !report.read && !seen.has(report.gameId));
  const next = [
    ...reports.map((report) => report.gameId),
    ...(remembered ?? []),
  ].filter((id, index, all) => all.indexOf(id) === index);
  return { fresh, remembered: next.slice(0, MAX_REMEMBERED) };
}

/** Title/body for one alert, or a roll-up when several games finished. */
export function alertContent(fresh: AfterActionReport[]): {
  title: string;
  body: string;
  gameId: number | null;
} {
  if (fresh.length === 1) {
    return { ...describeReport(fresh[0]), gameId: fresh[0].gameId };
  }
  return {
    title: `${fresh.length} new After Action Reports`,
    body: fresh.map((report) => describeReport(report).body).join('\n'),
    gameId: null,
  };
}

export function readRememberedAlerts(): number[] | null {
  try {
    const raw = globalThis.localStorage?.getItem(ALERTED_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === 'number')
      : null;
  } catch {
    return null;
  }
}

export function storeRememberedAlerts(ids: number[] | null): void {
  try {
    if (ids === null) {
      globalThis.localStorage?.removeItem(ALERTED_KEY);
    } else {
      globalThis.localStorage?.setItem(ALERTED_KEY, JSON.stringify(ids));
    }
  } catch {
    // Without storage the next load re-primes instead of alerting.
  }
}

export function alertPermission(): AlertPermission {
  return typeof Notification === 'undefined'
    ? 'unsupported'
    : Notification.permission;
}
