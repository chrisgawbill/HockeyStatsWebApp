import styles from '@/components/LoadingState.module.css';

interface LoadingStateProps {
  label?: string;
  fullPage?: boolean;
}

/** Spinner with an accessible status label, inline or filling the page. */
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
