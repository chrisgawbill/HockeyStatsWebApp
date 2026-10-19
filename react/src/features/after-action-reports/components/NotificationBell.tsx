import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import {
  describeReport,
  formatReportDate,
  reportOutcome,
} from '@/features/after-action-reports/utils/afterActionReportFormat';
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

/**
 * Global-header inbox for After Action Reports. The badge counts unread
 * reports; choosing one marks it read and opens its game detail page.
 */
export default function NotificationBell() {
  const {
    favorites,
    reports,
    unreadCount,
    alertPermission,
    markRead,
    markAllRead,
    enableAlerts,
  } = useAfterActionReports();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setOpen(false);
  };

  const label =
    unreadCount > 0
      ? `After Action Reports, ${unreadCount} unread`
      : 'After Action Reports';

  return (
    <div className={styles.wrapper} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={label}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className={styles.panel} id={panelId} role="menu">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>After Action Reports</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.textButton}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          {reports.length > 0 ? (
            <ul className={styles.list}>
              {reports.map((report) => (
                <ReportRow
                  key={report.gameId}
                  report={report}
                  onOpen={openReport}
                />
              ))}
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
            </p>
          )}
          {alertPermission === 'default' && (
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
          {alertPermission === 'denied' && (
            <p className={styles.footnote}>
              Browser alerts are blocked for this site in your browser settings.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
