import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  addFavorite,
  fetchAfterActionReports,
  fetchFavorites,
  markAfterActionReportRead,
  markAllAfterActionReportsRead,
  removeFavorite,
} from '@/features/after-action-reports/api/afterActionReportsApi';
import type {
  AfterActionReport,
  FavoriteTeam,
} from '@/features/after-action-reports/types/afterActionReport';
import {
  alertContent,
  alertPermission,
  planAlerts,
  readRememberedAlerts,
  storeRememberedAlerts,
  type AlertPermission,
} from '@/features/after-action-reports/utils/browserAlerts';

/** Background refresh cadence while a tab is open. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Returning to the tab refreshes at most this often. */
const FOCUS_REFRESH_MIN_MS = 60 * 1000;

export interface AfterActionReportsState {
  isSignedIn: boolean;
  favorites: FavoriteTeam[];
  reports: AfterActionReport[];
  unreadCount: number;
  alertPermission: AlertPermission;
  isFavorite: (triCode: string) => boolean;
  toggleFavorite: (triCode: string) => Promise<void>;
  /** Marks a report read; the caller navigates to the game. */
  markRead: (gameId: number) => void;
  markAllRead: () => void;
  enableAlerts: () => Promise<void>;
}

const AfterActionReportsContext = createContext<AfterActionReportsState | null>(
  null,
);

function withReadFlag(reports: AfterActionReport[], gameId: number) {
  return reports.map((report) =>
    report.gameId === gameId ? { ...report, read: true } : report,
  );
}

/**
 * Favorite teams and the After Action Report inbox for the signed-in user.
 * Reports are fetched on sign-in, every few minutes while the tab is open,
 * and when the tab regains focus. New unread reports raise a browser alert
 * once per browser when the user has granted permission; clicking it opens
 * the game's detail page.
 */
export function AfterActionReportsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [reports, setReports] = useState<AfterActionReport[]>([]);
  const [permission, setPermission] = useState<AlertPermission>(() =>
    alertPermission(),
  );
  const lastFetchRef = useRef(0);
  const previousTokenRef = useRef<string | null>(null);
  // Alerts outlive the render that raised them, so their click handler reads
  // the current session rather than the one captured when they were shown.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const applyReports = useCallback((next: AfterActionReport[]) => {
    setReports(next);
    const plan = planAlerts(next, readRememberedAlerts());
    storeRememberedAlerts(plan.remembered);
    if (plan.fresh.length === 0 || alertPermission() !== 'granted') return;

    const { title, body, gameId } = alertContent(plan.fresh);
    try {
      const alert = new Notification(title, {
        body,
        tag: gameId ? `aar-${gameId}` : 'aar-summary',
        icon: plan.fresh[0].homeLogo || undefined,
      });
      alert.onclick = () => {
        window.focus();
        alert.close();
        if (gameId === null) return;
        window.location.hash = `#/game/${gameId}`;
        const activeToken = tokenRef.current;
        if (!activeToken) return;
        setReports((current) => withReadFlag(current, gameId));
        markAfterActionReportRead(activeToken, gameId).catch((error) =>
          console.error('Failed to mark After Action Report read:', error),
        );
      };
    } catch (error) {
      // Some mobile browsers only allow notifications from a service worker.
      console.error('After Action Report alert failed:', error);
    }
  }, []);

  const refreshReports = useCallback(
    async (activeToken: string) => {
      lastFetchRef.current = Date.now();
      try {
        const inbox = await fetchAfterActionReports(activeToken);
        applyReports(inbox.reports);
      } catch (error) {
        console.error('Failed to load After Action Reports:', error);
      }
    },
    [applyReports],
  );

  useEffect(() => {
    const previous = previousTokenRef.current;
    previousTokenRef.current = token;
    if (!token) {
      setFavorites([]);
      setReports([]);
      if (previous) storeRememberedAlerts(null);
      return;
    }

    let cancelled = false;
    fetchFavorites(token)
      .then((next) => {
        if (!cancelled) setFavorites(next);
      })
      .catch((error) => console.error('Failed to load favorites:', error));
    refreshReports(token);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshReports(token);
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastFetchRef.current > FOCUS_REFRESH_MIN_MS
      ) {
        refreshReports(token);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, refreshReports]);

  const isFavorite = useCallback(
    (triCode: string) => favorites.some((f) => f.triCode === triCode),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (triCode: string) => {
      if (!token) return;
      const wasFavorite = favorites.some((f) => f.triCode === triCode);
      const previous = favorites;
      setFavorites(
        wasFavorite
          ? favorites.filter((f) => f.triCode !== triCode)
          : [...favorites, { triCode, since: new Date().toISOString() }],
      );
      try {
        const next = wasFavorite
          ? await removeFavorite(token, triCode)
          : await addFavorite(token, triCode);
        setFavorites(next);
        await refreshReports(token);
      } catch (error) {
        console.error('Failed to update favorite team:', error);
        setFavorites(previous);
      }
    },
    [token, favorites, refreshReports],
  );

  const markRead = useCallback(
    (gameId: number) => {
      if (!token) return;
      setReports((current) => withReadFlag(current, gameId));
      markAfterActionReportRead(token, gameId).catch((error) =>
        console.error('Failed to mark After Action Report read:', error),
      );
    },
    [token],
  );

  const markAllRead = useCallback(() => {
    if (!token) return;
    setReports((current) => current.map((r) => ({ ...r, read: true })));
    markAllAfterActionReportsRead(token)
      .then((inbox) => setReports(inbox.reports))
      .catch((error) =>
        console.error('Failed to mark After Action Reports read:', error),
      );
  }, [token]);

  const enableAlerts = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      try {
        new Notification('Browser alerts are on', {
          body: "We'll ping you here when a favorite team's After Action Report is ready.",
          tag: 'aar-enabled',
        });
      } catch {
        // Confirmation is optional.
      }
    }
  }, []);

  const value = useMemo<AfterActionReportsState>(
    () => ({
      isSignedIn: token !== null,
      favorites,
      reports,
      unreadCount: reports.filter((report) => !report.read).length,
      alertPermission: permission,
      isFavorite,
      toggleFavorite,
      markRead,
      markAllRead,
      enableAlerts,
    }),
    [
      token,
      favorites,
      reports,
      permission,
      isFavorite,
      toggleFavorite,
      markRead,
      markAllRead,
      enableAlerts,
    ],
  );

  return (
    <AfterActionReportsContext.Provider value={value}>
      {children}
    </AfterActionReportsContext.Provider>
  );
}

export function useAfterActionReports(): AfterActionReportsState {
  const context = useContext(AfterActionReportsContext);
  if (!context) {
    throw new Error(
      'useAfterActionReports must be used within an AfterActionReportsProvider',
    );
  }
  return context;
}
