import React from 'react';

import styles from '@/features/diagnostics/components/DiagnosticsPage.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

/** Green/red pill with a status dot and a label for the ok/bad state. */
export function StatusBadge({
  ok,
  okLabel = 'Available',
  badLabel = 'Unavailable',
}: {
  ok: boolean;
  okLabel?: string;
  badLabel?: string;
}) {
  return (
    <span
      className={joinClassNames(
        styles['status-badge'],
        ok ? styles['status-badge--ok'] : styles['status-badge--bad'],
      )}
    >
      <span className={styles['status-badge__dot']} aria-hidden="true" />
      {ok ? okLabel : badLabel}
    </span>
  );
}

/** Labeled tile in the API status grid. */
export function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles['diagnostics-stat-card']}>
      <span className={styles['diagnostics-stat-card__label']}>{label}</span>
      <span className={styles['diagnostics-stat-card__value']}>{children}</span>
    </div>
  );
}

/** Label/value pair in a cache card's summary row. */
export function CacheSummaryItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles['cache-summary__item']}>
      <span className={styles['cache-summary__label']}>{label}</span>
      <span className={styles['cache-summary__value']}>{children}</span>
    </div>
  );
}

/** Table cell with a filled bar and a rounded percentage for a share of a total. */
export function ShareBarCell({ percent }: { percent: number }) {
  return (
    <td className={styles['cache-table__bar-col']}>
      <span className={styles['cache-bar-track']}>
        <span
          className={styles['cache-bar-fill']}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className={styles['cache-bar__pct']}>{percent.toFixed(0)}%</span>
    </td>
  );
}
