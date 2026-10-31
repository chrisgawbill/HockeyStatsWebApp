import { beforeEach, describe, expect, it, vi } from 'vitest';

import { get, post, put } from '@/test/fixtures/apiClient';

vi.mock('@/lib/apiClient', () => import('@/test/fixtures/apiClient'));

import {
  fetchWeeklyReport,
  fetchWeeklyReportPush,
  fetchWeeklyReports,
  markWeeklyReportRead,
  setWeeklyReportPush,
} from '@/features/favorite-players/api/favoritePlayersApi';

const signedIn = { headers: { Authorization: 'Bearer token-1' } };

describe('Weekly Player Report API', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it('reads the inbox and one report, and marks a report read', async () => {
    const inbox = { reports: [], unreadCount: 0 };
    const report = { weekStart: '2026-10-19' };
    get.mockResolvedValueOnce(inbox).mockResolvedValueOnce(report);

    expect(await fetchWeeklyReports('token-1')).toBe(inbox);
    expect(await fetchWeeklyReport('token-1', '2026-10-19')).toBe(report);
    await markWeeklyReportRead('token-1', '2026-10-19');

    expect(get.mock.calls).toEqual([
      ['/api/weekly-player-reports', undefined, signedIn],
      ['/api/weekly-player-reports/2026-10-19', undefined, signedIn],
    ]);
    expect(post).toHaveBeenCalledWith(
      '/api/weekly-player-reports/2026-10-19/read',
      undefined,
      signedIn,
    );
  });

  it('reads and sets the weekly push switch as a plain boolean', async () => {
    get.mockResolvedValue({ enabled: false });
    put.mockResolvedValue({ enabled: true });

    expect(await fetchWeeklyReportPush('token-1')).toBe(false);
    expect(await setWeeklyReportPush('token-1', true)).toBe(true);

    expect(get).toHaveBeenCalledWith(
      '/api/push/weekly-report',
      undefined,
      signedIn,
    );
    expect(put).toHaveBeenCalledWith(
      '/api/push/weekly-report',
      { enabled: true },
      signedIn,
    );
  });
});
