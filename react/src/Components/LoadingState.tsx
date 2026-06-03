import React from 'react';
import styles from '../style/LoadingState.module.css';

interface LoadingStateProps {
  label?: string;
  fullPage?: boolean;
}

export default function LoadingState({
  label = 'Loading',
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={
        fullPage ? styles['loading-state--full-page'] : styles['loading-state']
      }
      role="status"
      aria-live="polite"
    >
      <span className={styles['loading-state__spinner']} aria-hidden="true" />
      <span className={styles['loading-state__label']}>{label}</span>
    </div>
  );
}
