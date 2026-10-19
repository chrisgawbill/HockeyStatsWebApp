import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import {
  describeReport,
  formatReportDate,
  reportOutcome,
} from '@/features/after-action-reports/utils/afterActionReportFormat';
import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import type { WeeklyPlayerReport } from '@/features/favorite-players/types/favoritePlayers';
import { weeklyReportTitle } from '@/features/favorite-players/utils/weeklyReportFormat';
import styles from '@/features/after-action-reports/components/NotificationBell.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ReportRow({
  report,
  onOpen,
}: {
  report: AfterActionReport;
  onOpen: (report: AfterActionReport) => void;
}) {
  const { title, body } = describeReport(report);
  const outcome = reportOutcome(report);
  const favorite = report.favoriteTeams[0];
  const opponentLogo =
    favorite === report.homeTeam ? report.awayLogo : report.homeLogo;
  const favoriteLogo =
    favorite === report.homeTeam ? report.homeLogo : report.awayLogo;

  return (
    <li>
      <button
        type="button"
        role="menuitem"
        className={cx(styles.row, !report.read && styles.unread)}
        onClick={() => onOpen(report)}
      >
        <span className={styles.logos} aria-hidden="true">
          {favoriteLogo && <img src={favoriteLogo} alt="" />}
          {opponentLogo && <img src={opponentLogo} alt="" />}
        </span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>
            {outcome && (
              <span
                className={cx(
                  styles.outcome,
                  outcome === 'W' ? styles.win : styles.loss,
                )}
              >
                {outcome}
              </span>
            )}
            {title}
          </span>
          <span className={styles.rowBody}>
            {body} · {formatReportDate(report.date)}
          </span>
        </span>
        {!report.read && <span className={styles.dot} aria-label="Unread" />}
      </button>
    </li>
  );
}

function WeeklyReportRow({
  report,
  onOpen,
}: {
  report: WeeklyPlayerReport;
  onOpen: (report: WeeklyPlayerReport) => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        className={cx(styles.row, !report.read && styles.unread)}
        onClick={() => onOpen(report)}
      >
        <span className={styles.weeklyIcon} aria-hidden="true">
          ★
        </span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>{weeklyReportTitle(report)}</span>
          <span className={styles.rowBody}>{report.headline}</span>
        </span>
        {!report.read && <span className={styles.dot} aria-label="Unread" />}
      </button>
    </li>
  );
}

/** The Monday Weekly Player Report push switch (one per account). */
function WeeklyReportPushToggle() {
  const { available, weeklyPush, setWeeklyPush } = useFavoritePlayers();
  const [failed, setFailed] = useState(false);
  if (!available || weeklyPush === null) return null;
  return (
    <>
      <div className={styles.muteRow}>
        <span className={styles.muteTeam}>
          Weekly player report notifications
        </span>
        <button
          type="button"
          className={styles.textButton}
          aria-pressed={weeklyPush}
          aria-label="Weekly player report notifications"
          onClick={() => {
            setFailed(false);
            setWeeklyPush(!weeklyPush).catch(() => setFailed(true));
          }}
        >
          {weeklyPush ? 'On' : 'Off'}
        </button>
      </div>
      {failed && (
        <p className={styles.footnote} role="alert">
          Couldn't update the weekly report setting. Try again.
        </p>
      )}
    </>
  );
}

/** Phone notification opt-in and per-team mutes, shown above browser alerts. */
function PushControls() {
  const { favorites, push, setTeamPushMuted } = useAfterActionReports();
  const [muteError, setMuteError] = useState(false);

  if (push.status === 'hidden') return null;
  if (push.status === 'ios-install') {
    return (
      <p className={styles.footnote}>
        Add to Home Screen to get phone notifications: tap Share, then Add to
        Home Screen, and open the app from there.
      </p>
    );
  }
  if (push.status === 'denied') {
    return (
      <p className={styles.footnote}>
        Phone notifications are blocked for this site. Re-enable them in your
        browser or phone settings.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={styles.alertsButton}
        disabled={push.busy}
        onClick={() => {
          (push.status === 'on' ? push.disable() : push.enable()).catch(
            () => undefined,
          );
        }}
      >
        {push.busy
          ? 'Working…'
          : push.status === 'on'
            ? 'Turn off phone notifications'
            : 'Turn on phone notifications'}
      </button>
      {push.error && (
        <p className={styles.footnote} role="alert">
          {push.error}
        </p>
      )}
      {push.status === 'on' && (
        <>
          <p className={styles.footnote}>
            Phone notifications are on. Browser alerts are off on this device.
          </p>
          {favorites.length > 0 && (
            <ul
              className={styles.muteList}
              aria-label="Phone notifications by team"
            >
              {favorites.map((favorite) => (
                <li key={favorite.triCode} className={styles.muteRow}>
                  <span className={styles.muteTeam}>{favorite.triCode}</span>
                  <button
                    type="button"
                    className={styles.textButton}
                    aria-pressed={favorite.pushMuted}
                    onClick={() => {
                      setMuteError(false);
                      setTeamPushMuted(
                        favorite.triCode,
                        !favorite.pushMuted,
                      ).catch(() => setMuteError(true));
                    }}
                  >
                    {favorite.pushMuted ? 'Muted' : 'Mute'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {muteError && (
            <p className={styles.footnote} role="alert">
              Couldn't update that team. Try again.
            </p>
          )}
          <WeeklyReportPushToggle />
        </>
      )}
    </div>
  );
}

type InboxItem =
  | { kind: 'game'; time: number; report: AfterActionReport }
  | { kind: 'weekly'; time: number; report: WeeklyPlayerReport };

/** Newest first: games by start time, weekly reports by generation time. */
function inboxItems(
  reports: AfterActionReport[],
  weeklyReports: WeeklyPlayerReport[],
): InboxItem[] {
  const items: InboxItem[] = [
    ...reports.map((report) => ({
      kind: 'game' as const,
      time: Date.parse(report.gameTime) || Date.parse(report.date) || 0,
      report,
    })),
    ...weeklyReports.map((report) => ({
      kind: 'weekly' as const,
      time: Date.parse(report.createdAt) || 0,
      report,
    })),
  ];
  return items.sort((a, b) => b.time - a.time);
}

/**
 * Global-header inbox for After Action Reports and Weekly Player Reports. The
 * badge counts both kinds of unread report; choosing one marks it read and
 * opens its game detail page or weekly report page.
 */
export default function NotificationBell() {
  const {
    favorites,
    reports,
    unreadCount,
    alertPermission,
    push,
    markRead,
    markAllRead,
    enableAlerts,
  } = useAfterActionReports();
  const {
    favorites: favoritePlayers,
    reports: weeklyReports,
    unreadCount: weeklyUnread,
    markReportRead,
    markAllReportsRead,
  } = useFavoritePlayers();
  const totalUnread = unreadCount + weeklyUnread;
  const items = inboxItems(reports, weeklyReports);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // Listen on document: focus can drop to <body> (e.g. "Mark all read"
    // unmounts), so a wrapper-level handler would miss Escape.
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      bellRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openReport = (report: AfterActionReport) => {
    markRead(report.gameId);
    setOpen(false);
    const back = `${location.pathname}${location.search}`;
    navigate(`/game/${report.gameId}`, {
      state: {
        sourcePath: back,
        fallbackPath: back,
        activeNavPath: back.split('?')[0],
      },
    });
  };

  const openWeeklyReport = (report: WeeklyPlayerReport) => {
    markReportRead(report.weekStart);
    setOpen(false);
    navigate(`/weekly-report/${report.weekStart}`);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) markAllRead();
    markAllReportsRead();
    // The button unmounts once nothing is unread; keep focus on the bell.
    bellRef.current?.focus();
  };

  const label = totalUnread > 0 ? `Reports, ${totalUnread} unread` : 'Reports';

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        ref={bellRef}
        className={styles.bell}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={label}
      >
        <BellIcon />
        {totalUnread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
      {open && (
        <div className={styles.panel} id={panelId} role="menu">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Reports</span>
            {totalUnread > 0 && (
              <button
                type="button"
                className={styles.textButton}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length > 0 ? (
            <ul className={styles.list}>
              {items.map((item) =>
                item.kind === 'game' ? (
                  <ReportRow
                    key={`game-${item.report.gameId}`}
                    report={item.report}
                    onOpen={openReport}
                  />
                ) : (
                  <WeeklyReportRow
                    key={`week-${item.report.weekStart}`}
                    report={item.report}
                    onOpen={openWeeklyReport}
                  />
                ),
              )}
            </ul>
          ) : (
            <p className={styles.empty}>
              {favorites.length === 0
                ? 'Favorite a team with the ☆ on its team page to get an After Action Report after every game.'
                : `No reports yet. One lands here after ${favorites
                    .map((f) => f.triCode)
                    .join(
                      ', ',
                    )} play${favorites.length === 1 ? 's' : ''} next.`}
              {favoritePlayers.length === 0 &&
                ' Star a player on their headshot for a Weekly Player Report every Monday.'}
            </p>
          )}
          <PushControls />
          {push.status !== 'on' && alertPermission === 'default' && (
            <button
              type="button"
              className={styles.alertsButton}
              onClick={() => {
                enableAlerts();
              }}
            >
              Turn on browser alerts
            </button>
          )}
          {push.status !== 'on' && alertPermission === 'denied' && (
            <p className={styles.footnote}>
              Browser alerts are blocked for this site in your browser settings.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
