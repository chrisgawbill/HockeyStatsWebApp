import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const SCOPE = 'https://example.test/HockeyStatsWebApp/';
const source = readFileSync(
  new URL('../../../../public/sw.js', import.meta.url),
  'utf8',
);

type Handler = (event: Record<string, unknown>) => void;

interface FakeClient {
  url: string;
  focus: ReturnType<typeof vi.fn>;
  navigate?: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
}

function client(url: string): FakeClient {
  return {
    url,
    focus: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn().mockResolvedValue(undefined),
    postMessage: vi.fn(),
  };
}

/** Evaluates sw.js against a fake worker global. */
function loadWorker(windows: FakeClient[] = []) {
  const handlers: Record<string, Handler> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  const self = {
    location: `https://example.test/HockeyStatsWebApp/sw.js?api=${encodeURIComponent('https://api.test/')}`,
    registration: { scope: SCOPE, showNotification },
    clients: {
      matchAll: vi.fn().mockResolvedValue(windows),
      openWindow,
      claim: vi.fn().mockResolvedValue(undefined),
    },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, handler: Handler) => {
      handlers[type] = handler;
    },
  };
  new Function('self', 'fetch', 'URL', source)(self, fetchMock, URL);
  return { self, handlers, showNotification, openWindow, fetchMock };
}

function pushEvent(payload: unknown, bad = false) {
  const waits: Promise<unknown>[] = [];
  return {
    event: {
      data: {
        json: () => {
          if (bad) throw new Error('bad json');
          return payload;
        },
      },
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    },
    done: () => Promise.all(waits),
  };
}

function clickEvent(data: unknown) {
  const waits: Promise<unknown>[] = [];
  const close = vi.fn();
  return {
    event: {
      notification: { close, data },
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    },
    close,
    done: () => Promise.all(waits),
  };
}

describe('sw.js', () => {
  it('skips waiting on install and claims clients on activate', async () => {
    const w = loadWorker();
    w.handlers.install({});
    expect(w.self.skipWaiting).toHaveBeenCalled();
    const waits: Promise<unknown>[] = [];
    w.handlers.activate({ waitUntil: (p: Promise<unknown>) => waits.push(p) });
    await Promise.all(waits);
    expect(w.self.clients.claim).toHaveBeenCalled();
    expect(w.handlers.fetch).toBeUndefined();
  });

  it('shows pushed reports and weekly reports, falling back for bad payloads', async () => {
    const w = loadWorker();
    const p = pushEvent({
      title: 'BOS 3, NYR 2',
      body: 'Final',
      gameId: 2025020001,
      tag: 'aar-2025020001',
      readToken: 'tok',
    });
    w.handlers.push(p.event);
    await p.done();
    const [title, options] = w.showNotification.mock.calls[0];
    expect(title).toBe('BOS 3, NYR 2');
    expect(options).toMatchObject({
      body: 'Final',
      tag: 'aar-2025020001',
      data: { gameId: 2025020001, readToken: 'tok' },
    });
    expect(options.icon).toBe(`${SCOPE}icons/icon-192.png`);

    // Still shows something for a bad payload.
    {
      const w = loadWorker();
      const p = pushEvent(null, true);
      w.handlers.push(p.event);
      await p.done();
      expect(w.showNotification).toHaveBeenCalledTimes(1);
      expect(w.showNotification.mock.calls[0][0]).toBe('After Action Report');
    }

    // Shows a weekly report push with its week.
    {
      const w = loadWorker();
      const p = pushEvent({
        kind: 'weekly-report',
        title: 'Weekly Player Report · Oct 12–18',
        body: 'Connor McDavid: 2G 4A in 2 GP',
        weekStart: '2026-10-12',
        tag: 'wpr-2026-10-12',
        readToken: 'wtok',
      });
      w.handlers.push(p.event);
      await p.done();
      const [title, options] = w.showNotification.mock.calls[0];
      expect(title).toBe('Weekly Player Report · Oct 12–18');
      expect(options).toMatchObject({
        tag: 'wpr-2026-10-12',
        data: { gameId: null, weekStart: '2026-10-12', readToken: 'wtok' },
      });
    }

    // Ignores a malformed weekStart.
    {
      const w = loadWorker();
      const p = pushEvent({ kind: 'weekly-report', weekStart: '../../x' });
      w.handlers.push(p.event);
      await p.done();
      expect(w.showNotification.mock.calls[0][1].data.weekStart).toBeNull();
    }
  });

  it('click posts the read token and focuses an open tab on the game', async () => {
    const other = client('https://elsewhere.test/');
    const open = client(`${SCOPE}#/standings`);
    const w = loadWorker([other, open]);
    const c = clickEvent({ gameId: 42, readToken: 'tok' });
    w.handlers.notificationclick(c.event);
    await c.done();

    expect(c.close).toHaveBeenCalled();
    expect(w.fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/push/read',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'tok' }),
      }),
    );
    expect(open.focus).toHaveBeenCalled();
    expect(open.navigate).toHaveBeenCalledWith(`${SCOPE}#/game/42`);
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'aar-navigate',
      gameId: 42,
    });
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'aar-report-read',
      gameId: 42,
    });
    expect(w.openWindow).not.toHaveBeenCalled();
  });

  it('opens the game before the read finishes, focusing a tab or opening a window', async () => {
    const open = client(`${SCOPE}#/standings`);
    const w = loadWorker([open]);
    let release: (value: unknown) => void = () => undefined;
    w.fetchMock.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const c = clickEvent({ gameId: 42, readToken: 'tok' });
    w.handlers.notificationclick(c.event);
    for (let i = 0; i < 20; i++) await Promise.resolve();

    expect(w.fetchMock).toHaveBeenCalled();
    expect(open.focus).toHaveBeenCalled();
    expect(open.navigate).toHaveBeenCalled();
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'aar-navigate',
      gameId: 42,
    });
    expect(open.postMessage).not.toHaveBeenCalledWith({
      type: 'aar-report-read',
      gameId: 42,
    });

    release({ ok: true });
    await c.done();
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'aar-report-read',
      gameId: 42,
    });

    // Opens a window before the read finishes when no tab is open.
    {
      const w = loadWorker([]);
      let release: (value: unknown) => void = () => undefined;
      w.fetchMock.mockReturnValue(
        new Promise((resolve) => (release = resolve)),
      );
      const c = clickEvent({ gameId: 9, readToken: 'tok' });
      w.handlers.notificationclick(c.event);
      for (let i = 0; i < 20; i++) await Promise.resolve();
      expect(w.openWindow).toHaveBeenCalledWith(`${SCOPE}#/game/9`);
      release({ ok: true });
      await c.done();
    }

    // Click opens a window when none is in scope, even if the read fails.
    {
      const w = loadWorker([client('https://elsewhere.test/')]);
      w.fetchMock.mockRejectedValue(new Error('offline'));
      const c = clickEvent({ gameId: 7, readToken: 'tok' });
      w.handlers.notificationclick(c.event);
      await c.done();
      expect(w.openWindow).toHaveBeenCalledWith(`${SCOPE}#/game/7`);
    }
  });

  it('weekly clicks post the read token and route an open tab or a new window to the report', async () => {
    const open = client(`${SCOPE}#/standings`);
    const w = loadWorker([open]);
    const c = clickEvent({
      gameId: null,
      weekStart: '2026-10-12',
      readToken: 'wtok',
    });
    w.handlers.notificationclick(c.event);
    await c.done();
    expect(w.fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/push/read',
      expect.objectContaining({ body: JSON.stringify({ token: 'wtok' }) }),
    );
    expect(open.navigate).toHaveBeenCalledWith(
      `${SCOPE}#/weekly-report/2026-10-12`,
    );
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'wpr-navigate',
      weekStart: '2026-10-12',
    });
    expect(open.postMessage).toHaveBeenCalledWith({
      type: 'wpr-report-read',
      weekStart: '2026-10-12',
    });
    expect(open.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'aar-navigate' }),
    );

    // Weekly click opens a window when no tab is open.
    {
      const w = loadWorker([]);
      const c = clickEvent({ weekStart: '2026-10-12', readToken: 'wtok' });
      w.handlers.notificationclick(c.event);
      await c.done();
      expect(w.openWindow).toHaveBeenCalledWith(
        `${SCOPE}#/weekly-report/2026-10-12`,
      );
    }
  });
});
