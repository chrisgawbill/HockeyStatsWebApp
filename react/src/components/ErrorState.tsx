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
  const TitleTag = fullPage ? 'h1' : 'h2';

  return (
    <div
      className={fullPage ? 'ds-state ds-state-full' : 'ds-state'}
      role="alert"
    >
      <span className={styles.icon} aria-hidden="true" />
      {title && <TitleTag className="ds-state-title">{title}</TitleTag>}
      <span className={`ds-state-message ${styles.message}`}>{message}</span>
      {onRetry && (
        <button
          type="button"
          className={`ds-button ds-button-outlined ${styles.retry}`}
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
