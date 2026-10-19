import { describe, expect, it } from 'vitest';
import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import {
  alertContent,
  planAlerts,
} from '@/features/after-action-reports/utils/browserAlerts';

function report(gameId: number, read = false): AfterActionReport {
  return {
    gameId,
    date: '2026-10-18',
    gameTime: '2026-10-18T23:00:00Z',
    homeTeam: 'TOR',
    homeLogo: '',
    homeScore: 3,
    awayTeam: 'BOS',
    awayLogo: '',
    awayScore: 1,
    periodType: 'REG',
    isPlayoff: false,
    favoriteTeams: ['TOR'],
    read,
  };
}

describe('planAlerts', () => {
  it('primes on first poll, then alerts only new unread reports, bounded memory', () => {
    const plan = planAlerts([report(1), report(2)], null);
    expect(plan.fresh).toEqual([]);
    expect(plan.remembered).toEqual([1, 2]);

    // Alerts only unread reports not alerted before.
    const next = planAlerts([report(3), report(2, true), report(1)], [1]);
    expect(next.fresh.map((r) => r.gameId)).toEqual([3]);
    expect(next.remembered).toEqual([3, 2, 1]);

    // Keeps remembered ids that left the inbox, bounded in size.
    const old = Array.from({ length: 250 }, (_, i) => i + 100);
    const bounded = planAlerts([report(1)], old);
    expect(bounded.remembered[0]).toBe(1);
    expect(bounded.remembered).toHaveLength(200);
  });
});

describe('alertContent', () => {
  it('links a single report to its game and rolls several into one alert', () => {
    expect(alertContent([report(7)])).toEqual({
      title: 'After Action Report: TOR Win',
      body: 'TOR 3, BOS 1 · Final',
      gameId: 7,
    });

    // Rolls several reports into one alert.
    const content = alertContent([report(7), report(8)]);
    expect(content.title).toBe('2 new After Action Reports');
    expect(content.gameId).toBeNull();
  });
});
