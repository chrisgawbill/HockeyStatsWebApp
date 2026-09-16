import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get, post, put } from '@/lib/apiClient';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200 });
}

describe('apiClient', () => {
  it('builds the API URL and omits empty query values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ games: [] }));

    await expect(
      get('/schedule/', {
        season: '20252026',
        live: true,
        absent: null,
        missing: undefined,
        empty: '',
      }),
    ).resolves.toEqual({ games: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9000/schedule/?season=20252026&live=true',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends caller headers and JSON-serializes object bodies', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ saved: true }));

    await post(
      '/api/example',
      { value: 1 },
      { headers: { Authorization: 'Bearer token' } },
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(init).toMatchObject({ method: 'POST', body: '{"value":1}' });
    expect(headers.get('Authorization')).toBe('Bearer token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('preserves pre-serialized JSON bodies and caller content types', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ saved: true }));
    const payload = '{"value":1}';

    await put('/api/example', payload, {
      headers: { 'Content-Type': 'application/custom+json' },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(payload);
    expect((init.headers as Headers).get('Content-Type')).toBe(
      'application/custom+json',
    );
  });

  it('throws a status-bearing error for non-success responses', async () => {
    fetchMock.mockResolvedValue(
      new Response('nope', { status: 500, statusText: 'Server Error' }),
    );

    await expect(get('/api/example')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    });
    expect(console.error).toHaveBeenCalled();
  });

  it('aborts requests after 15 seconds', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init?.signal ?? undefined;
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const request = get('/api/slow');
    const rejection = expect(request).rejects.toThrow('aborted');
    await vi.advanceTimersByTimeAsync(15_000);

    await rejection;
    expect(signal?.aborted).toBe(true);
  });
});
