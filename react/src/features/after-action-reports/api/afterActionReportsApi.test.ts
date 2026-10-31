import { beforeEach, describe, expect, it, vi } from 'vitest';

import { get, post } from '@/test/fixtures/apiClient';

vi.mock('@/lib/apiClient', () => import('@/test/fixtures/apiClient'));

import {
  fetchAfterActionReports,
  markAfterActionReportRead,
  markAllAfterActionReportsRead,
} from '@/features/after-action-reports/api/afterActionReportsApi';

const signedIn = { headers: { Authorization: 'Bearer token-1' } };

describe('After Action Report inbox API', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('reads the inbox and marks one or every report read with the session token', async () => {
    const inbox = { reports: [], unreadCount: 0 };
    get.mockResolvedValue(inbox);
    post.mockResolvedValue(inbox);

    expect(await fetchAfterActionReports('token-1')).toBe(inbox);
    await markAfterActionReportRead('token-1', 2026020151);
    expect(await markAllAfterActionReportsRead('token-1')).toBe(inbox);

    expect(get).toHaveBeenCalledWith(
      '/api/after-action-reports',
      undefined,
      signedIn,
    );
    expect(post.mock.calls).toEqual([
      ['/api/after-action-reports/2026020151/read', undefined, signedIn],
      ['/api/after-action-reports/read-all', undefined, signedIn],
    ]);
  });
});
