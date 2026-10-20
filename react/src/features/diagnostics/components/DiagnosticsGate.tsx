import { FormEvent } from 'react';

import { LockIcon } from '@/features/diagnostics/components/DiagnosticsIcons';
import styles from '@/features/diagnostics/components/DiagnosticsPage.module.css';

interface DiagnosticsGateProps {
  passphrase: string;
  onPassphraseChange: (passphrase: string) => void;
  onSubmit: (event: FormEvent) => void;
  loading: boolean;
  authError: boolean;
  fetchError: boolean;
}

/** Passphrase form shown until the diagnostics data has been unlocked. */
export default function DiagnosticsGate({
  passphrase,
  onPassphraseChange,
  onSubmit,
  loading,
  authError,
  fetchError,
}: DiagnosticsGateProps) {
  return (
    <div className={styles['diagnostics-gate-wrap']}>
      <div className={styles['diagnostics-gate']}>
        <span className={styles['diagnostics-gate__icon']} aria-hidden="true">
          <LockIcon />
        </span>
        <h1 className={styles['diagnostics-gate__title']}>Diagnostics</h1>
        <p className={styles['diagnostics-gate__desc']}>
          This page is restricted. Enter the diagnostics passphrase to view API
          status and cache usage.
        </p>
        <form className={styles['diagnostics-gate__form']} onSubmit={onSubmit}>
          <input
            className={styles['diagnostics-gate__input']}
            type="password"
            value={passphrase}
            onChange={(event) => onPassphraseChange(event.target.value)}
            placeholder="Passphrase"
            aria-label="Diagnostics passphrase"
            autoComplete="current-password"
            autoFocus
          />
          <button
            className={styles['diagnostics-gate__button']}
            type="submit"
            disabled={loading || !passphrase.trim()}
          >
            {loading ? 'Checking…' : 'Unlock'}
          </button>
          {authError && (
            <p className={styles['diagnostics-gate__error']}>
              Incorrect passphrase. Try again.
            </p>
          )}
          {fetchError && (
            <p className={styles['diagnostics-gate__error']}>
              Could not reach the API. Is the backend running?
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
