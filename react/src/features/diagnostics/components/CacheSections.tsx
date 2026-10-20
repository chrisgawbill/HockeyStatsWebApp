import {
  CacheSummaryItem,
  ShareBarCell,
  StatusBadge,
} from '@/features/diagnostics/components/DiagnosticsParts';
import { CacheReportDto } from '@/features/diagnostics/api/diagnosticsApi';
import { formatBytes } from '@/features/diagnostics/utils/diagnosticsFormat';
import styles from '@/features/diagnostics/components/DiagnosticsPage.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

/** `part` as a percentage of `total`, or 0 when the total is empty. */
function percentOf(part: number, total: number): number {
  return total ? (part / total) * 100 : 0;
}

/** Usage of the external database cache: connection state, totals, and per-section rows. */
export function DatabaseUsageSection({
  external,
}: {
  external: CacheReportDto['external'];
}) {
  const sectionRows = Object.entries(external.sections).sort(
    ([, first], [, second]) => second.bytes - first.bytes,
  );

  return (
    <section className={styles['diagnostics-section']}>
      <h2 className={styles['diagnostics-section__title']}>Database Usage</h2>
      <div className={styles['cache-card']}>
        <div className={styles['cache-summary']}>
          <CacheSummaryItem label="Connection">
            <StatusBadge
              ok={external.reachable}
              okLabel="Reachable"
              badLabel="Unreachable"
            />
          </CacheSummaryItem>
          <CacheSummaryItem label="Entries">
            {external.totalEntries.toLocaleString()}
          </CacheSummaryItem>
          <CacheSummaryItem label="Stored Data">
            {formatBytes(external.totalBytes)}
          </CacheSummaryItem>
          <CacheSummaryItem label="Size on Disk">
            {formatBytes(external.tableBytes)}
          </CacheSummaryItem>
        </div>
        {!external.reachable ? (
          <p className={styles['cache-empty']}>
            Database is configured but not reachable.
          </p>
        ) : sectionRows.length === 0 ? (
          <p className={styles['cache-empty']}>No cached entries stored yet.</p>
        ) : (
          <table className={styles['cache-table']}>
            <thead>
              <tr>
                <th className={styles['cache-table__section-col']}>Section</th>
                <th>Entries</th>
                <th>Stored Data</th>
                <th className={styles['cache-table__bar-col']}>Share</th>
              </tr>
            </thead>
            <tbody>
              {sectionRows.map(([type, section]) => (
                <tr key={type}>
                  <td className={styles['cache-table__section-col']}>{type}</td>
                  <td>{section.entries.toLocaleString()}</td>
                  <td>{formatBytes(section.bytes)}</td>
                  <ShareBarCell
                    percent={percentOf(section.bytes, external.totalBytes)}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/** Size of each file-cache section, with the largest one highlighted. */
export function CacheUsageSection({
  cacheReport,
}: {
  cacheReport: CacheReportDto;
}) {
  const sectionRows = Object.entries(cacheReport.sections).sort(
    ([, firstSize], [, secondSize]) => secondSize - firstSize,
  );

  return (
    <section className={styles['diagnostics-section']}>
      <h2 className={styles['diagnostics-section__title']}>Cache Usage</h2>
      <div className={styles['cache-card']}>
        <div className={styles['cache-summary']}>
          <CacheSummaryItem label="Total">
            {formatBytes(cacheReport.total)}
          </CacheSummaryItem>
          <CacheSummaryItem label="Largest Section">
            {cacheReport.largestSection.type ?? '—'}
          </CacheSummaryItem>
        </div>
        <table className={styles['cache-table']}>
          <thead>
            <tr>
              <th className={styles['cache-table__section-col']}>Section</th>
              <th>Size</th>
              <th className={styles['cache-table__bar-col']}>Share</th>
            </tr>
          </thead>
          <tbody>
            {sectionRows.map(([type, size]) => (
              <tr
                key={type}
                className={joinClassNames(
                  type === cacheReport.largestSection.type &&
                    styles['cache-table__row--largest'],
                )}
              >
                <td className={styles['cache-table__section-col']}>{type}</td>
                <td>{formatBytes(size)}</td>
                <ShareBarCell percent={percentOf(size, cacheReport.total)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
