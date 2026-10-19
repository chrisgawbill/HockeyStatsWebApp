import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  ApiError: class ApiError extends Error {
    constructor(public readonly status: number) {
      super();
    }
  },
  get: (...args: unknown[]) => get(...args),
  post: (...args: unknown[]) => post(...args),
  put: (...args: unknown[]) => put(...args),
}));

import { fetchSession, googleSignIn } from '@/lib/auth/authApi';
import { ApiError } from '@/lib/apiClient';

describe('authApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it('googleSignIn POSTs the credential; fetchSession GETs with a bearer header', async () => {
    post.mockResolvedValue({ token: 'abc', email: 'chris@example.com' });

    const result = await googleSignIn('google-credential');

    expect(post).toHaveBeenCalledWith('/api/auth/google', {
      credential: 'google-credential',
    });
    expect(result).toEqual({ token: 'abc', email: 'chris@example.com' });

    // fetchSession GETs /api/auth/me with a bearer header.
    get.mockResolvedValue({ email: 'chris@example.com' });

    const session = await fetchSession('token-1');

    expect(get).toHaveBeenCalledWith('/api/auth/me', undefined, {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(session).toEqual({ email: 'chris@example.com' });
  });

  it('fetchSession returns null on a 401 and rethrows other errors', async () => {
    get.mockRejectedValue(new ApiError(401, 'Unauthorized'));
    await expect(fetchSession('expired-token')).resolves.toBeNull();

    for (const error of [
      new ApiError(500, 'Server Error'),
      new Error('network down'),
    ]) {
      get.mockRejectedValue(error);
      await expect(fetchSession('token-1')).rejects.toBe(error);
    }
  });
});
