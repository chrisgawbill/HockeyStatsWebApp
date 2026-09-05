import styles from '@/components/EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  message?: string;
  fullPage?: boolean;
}

/**
 * Shared placeholder shown when a section or page has no data (e.g. a season with
 * no games or standings). `fullPage` switches to the centered full-height layout;
 * the default is an inline block sized to its container.
 */
export default function EmptyState({
  title,
  message = 'No data available',
  fullPage = false,
}: EmptyStateProps) {
  return (
    <div
      className={
        fullPage ? styles['empty-state--full-page'] : styles['empty-state']
      }
      role="status"
      aria-live="polite"
    >
      <span className={styles['empty-state__icon']} aria-hidden="true" />
      {title && <span className={styles['empty-state__title']}>{title}</span>}
      <span className={styles['empty-state__message']}>{message}</span>
    </div>
  );
}
