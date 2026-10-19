/*
 * Web Push service worker for After Action Reports and the Monday Weekly
 * Player Report (payload `kind: "weekly-report"`). Handles push and
 * notification clicks only: no fetch handler and no offline caching.
 * Registered as `sw.js?api=<API origin>` so it knows where to post read tokens.
 */
const API_BASE = (() => {
  try {
    return new URL(self.location).searchParams.get('api') || '';
  } catch {
    return '';
  }
})();

const ICON = new URL('icons/icon-192.png', self.registration.scope).href;

function parsePayload(event) {
  try {
    const data = event.data ? event.data.json() : null;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = parsePayload(event);
  const title =
    typeof payload.title === 'string' && payload.title
      ? payload.title
      : 'After Action Report';
  const options = {
    body: typeof payload.body === 'string' ? payload.body : '',
    icon: ICON,
    badge: ICON,
    data: {
      gameId: payload.gameId ?? null,
      weekStart:
        payload.kind === 'weekly-report' &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(payload.weekStart))
          ? payload.weekStart
          : null,
      readToken: payload.readToken ?? null,
    },
  };
  if (typeof payload.tag === 'string' && payload.tag) options.tag = payload.tag;
  event.waitUntil(self.registration.showNotification(title, options));
});

async function markRead(readToken) {
  if (!readToken || !API_BASE) return;
  try {
    await fetch(`${API_BASE.replace(/\/+$/, '')}/api/push/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: readToken }),
    });
  } catch {
    // The session may be gone or the API asleep; opening the game still works.
  }
}

/**
 * Focuses (or opens) the app at `hash`; `message` tells an already open tab
 * to route there itself when the client cannot be navigated.
 */
async function openApp(hash, message) {
  const scope = self.registration.scope;
  const windows = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  const existing = windows.find((client) => client.url.startsWith(scope));

  if (existing) {
    try {
      await existing.focus();
    } catch {
      // Focus can be refused; navigation below is still worth trying.
    }
    if (hash) {
      existing.postMessage(message);
      try {
        if (typeof existing.navigate === 'function') {
          await existing.navigate(new URL(`./${hash}`, scope).href);
        }
      } catch {
        // The postMessage above routes the open app instead.
      }
    }
  } else if (self.clients.openWindow) {
    await self.clients.openWindow(new URL(`./${hash}`, scope).href);
  }
}

function openGame(gameId) {
  const hasGame = gameId !== null && gameId !== undefined && gameId !== '';
  return openApp(hasGame ? `#/game/${gameId}` : '', {
    type: 'aar-navigate',
    gameId,
  });
}

function openWeeklyReport(weekStart) {
  return openApp(`#/weekly-report/${weekStart}`, {
    type: 'wpr-navigate',
    weekStart,
  });
}

async function announce(message) {
  const windows = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of windows) client.postMessage(message);
}

function announceRead(gameId) {
  if (gameId === null || gameId === undefined || gameId === '') return;
  return announce({ type: 'aar-report-read', gameId });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { gameId, weekStart, readToken } = event.notification.data || {};
  event.waitUntil(
    (async () => {
      // The API may take a minute to wake; open the page without waiting on it.
      const read = markRead(readToken);
      try {
        if (weekStart) await openWeeklyReport(weekStart);
        else await openGame(gameId);
      } finally {
        await read;
        if (weekStart) await announce({ type: 'wpr-report-read', weekStart });
        else await announceRead(gameId);
      }
    })(),
  );
});
