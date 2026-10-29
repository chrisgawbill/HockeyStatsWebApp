import { afterEach, describe, expect, it, vi } from 'vitest';
import { GetCurrentStandings } from '@/features/standings/api/standingsApi';

describe('GetCurrentStandings', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks for AHL standings with league=ahl and leaves NHL requests unchanged', async () => {
    const fetchMock = vi.fn(
      async (_url: string) => new Response('{"standings":[]}', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await GetCurrentStandings('20262027');
    await GetCurrentStandings('20262027', 'ahl');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:9000/standings?season=20262027',
      'http://localhost:9000/standings?season=20262027&league=ahl',
    ]);
  });
});
