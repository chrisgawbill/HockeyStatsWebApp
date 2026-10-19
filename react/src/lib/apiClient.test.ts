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

  it('throws a status-bearing error for non-retryable responses', async () => {
    fetchMock.mockResolvedValue(
      new Response('nope', { status: 404, statusText: 'Not Found' }),
    );

    await expect(get('/api/example')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('retries GETs through gateway errors and network failures', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 502 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ standings: [] }));

    const request = get('/standings');
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(request).resolves.toEqual({ standings: [] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('gives up on GETs after the last retry', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      async () => new Response('', { status: 503, statusText: 'Unavailable' }),
    );

    const request = get('/standings');
    const rejection = expect(request).rejects.toMatchObject({ status: 503 });
    await vi.advanceTimersByTimeAsync(7_000);

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('does not retry writes', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));

    await expect(post('/api/example', {})).rejects.toMatchObject({
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts each attempt after 15 seconds and retries timed-out GETs', async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal;
          signals.push(signal);
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const request = get('/api/slow');
    const rejection = expect(request).rejects.toThrow('aborted');
    await vi.advanceTimersByTimeAsync(15_000);
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(3 * 15_000 + 7_000);
    await rejection;
    expect(signals).toHaveLength(4);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
});
