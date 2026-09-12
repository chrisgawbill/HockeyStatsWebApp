import styles from '@/components/ErrorState.module.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  fullPage?: boolean;
  onRetry?: () => void;
}

/**
 * Shared placeholder shown when a section or page failed to load data (as
 * opposed to genuinely having none — see EmptyState for that case). `fullPage`
 * switches to the centered full-height layout; the default is an inline block
 * sized to its container. When `onRetry` is given, a "Try again" button is
 * rendered so the caller can re-run its fetch.
 */
export default function ErrorState({
  title,
  message = 'Something went wrong',
  fullPage = false,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className={
        fullPage ? styles['error-state--full-page'] : styles['error-state']
      }
      role="alert"
    >
      <span className={styles['error-state__icon']} aria-hidden="true" />
      {title && <span className={styles['error-state__title']}>{title}</span>}
      <span className={styles['error-state__message']}>{message}</span>
      {onRetry && (
        <button
          type="button"
          className={styles['error-state__retry']}
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
