import PageHeader from '@/components/PageHeader';
import LoadingState from '@/components/LoadingState';
import { HealthDataDto } from '@/features/diagnostics/api/diagnosticsApi';
import {
  CacheUsageSection,
  DatabaseUsageSection,
} from '@/features/diagnostics/components/CacheSections';
import DiagnosticsGate from '@/features/diagnostics/components/DiagnosticsGate';
import {
  LockIcon,
  RefreshIcon,
} from '@/features/diagnostics/components/DiagnosticsIcons';
import {
  StatCard,
  StatusBadge,
} from '@/features/diagnostics/components/DiagnosticsParts';
import { useDiagnostics } from '@/features/diagnostics/hooks/useDiagnostics';
import { formatUptime } from '@/features/diagnostics/utils/diagnosticsFormat';
import styles from '@/features/diagnostics/components/DiagnosticsPage.module.css';

/** The "API Status" grid of health tiles. */
function ApiStatusSection({ health }: { health: HealthDataDto }) {
  return (
    <section className={styles['diagnostics-section']}>
      <h2 className={styles['diagnostics-section__title']}>API Status</h2>
      <div className={styles['diagnostics-grid']}>
        <StatCard label="Status">
          <StatusBadge
            ok={health.status === 'ok'}
            okLabel="OK"
            badLabel="Down"
          />
        </StatCard>
        <StatCard label="Cache Storage">{health.cacheStorageMode}</StatCard>
        <StatCard label="Cache Directory">
          <StatusBadge
            ok={health.cacheWritable}
            okLabel="Writable"
            badLabel="Unavailable"
          />
        </StatCard>
        <StatCard label="Anthropic Key">
          <StatusBadge
            ok={health.anthropicKeyConfigured}
            okLabel="Configured"
            badLabel="Missing"
          />
        </StatCard>
        <StatCard label="Version">v{health.version}</StatCard>
        <StatCard label="Environment">{health.environment}</StatCard>
        <StatCard label="Current Season">{health.currentSeason}</StatCard>
        <StatCard label="Uptime">{formatUptime(health.uptime)}</StatCard>
        <StatCard label="Server Time">
          {new Date(health.currentTime).toLocaleString()}
        </StatCard>
      </div>
    </section>
  );
}

/**
 * Passphrase-protected `/diagnostics` page showing API health and cache usage.
 * Shows the unlock form until the diagnostics load, then the report with
 * Refresh and Lock actions.
 */
function DiagnosticsPage() {
  const diagnostics = useDiagnostics();
  const { health, cacheReport, authed, loading } = diagnostics;

  const renderReport = () => {
    if (!health || !cacheReport) return null;
    return (
      <div className={styles['diagnostics-page__content']}>
        <div className={styles['diagnostics-header']}>
          <h1 className={styles['diagnostics-title']}>Diagnostics</h1>
          <div className={styles['diagnostics-actions']}>
            <button
              className={styles['diagnostics-icon-btn']}
              onClick={() =>
                diagnostics.loadDiagnostics(diagnostics.passphrase.trim())
              }
              disabled={loading}
              aria-label="Refresh diagnostics"
            >
              <RefreshIcon />
              <span>Refresh</span>
            </button>
            <button
              className={styles['diagnostics-icon-btn']}
              onClick={diagnostics.handleLock}
              aria-label="Lock diagnostics"
            >
              <LockIcon />
              <span>Lock</span>
            </button>
          </div>
        </div>

        <ApiStatusSection health={health} />
        {cacheReport.external?.configured && (
          <DatabaseUsageSection external={cacheReport.external} />
        )}
        <CacheUsageSection cacheReport={cacheReport} />
      </div>
    );
  };

  return (
    <div className={styles['diagnostics-page']}>
      <PageHeader />
      {loading && !authed ? (
        <LoadingState label="Loading diagnostics" fullPage />
      ) : authed ? (
        renderReport()
      ) : (
        <DiagnosticsGate
          passphrase={diagnostics.passphrase}
          onPassphraseChange={diagnostics.setPassphrase}
          onSubmit={diagnostics.handleSubmit}
          loading={loading}
          authError={diagnostics.authError}
          fetchError={diagnostics.fetchError}
        />
      )}
    </div>
  );
}

export default DiagnosticsPage;
