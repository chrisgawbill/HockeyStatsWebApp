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
      className={fullPage ? 'ds-state ds-state-full' : 'ds-state'}
      role="status"
      aria-live="polite"
    >
      <span className="ds-cluster">
        <span className="ds-spinner" aria-hidden="true" />
        <span className={`ds-state-message ${styles.label}`}>{label}</span>
      </span>
    </div>
  );
}
