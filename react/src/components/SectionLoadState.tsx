import { ReactNode } from 'react';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { joinClassNames } from '@/lib/joinClassNames';
import styles from '@/components/SectionLoadState.module.css';

interface SectionLoadStateProps {
  loading: boolean;
  error: string | null;
  /** Spinner label, such as "Loading standings". */
  loadingLabel: string;
  onRetry: () => void;
  /** Holds the loaded section's height so the content below does not jump. */
  className?: string;
  children: ReactNode;
}

/**
 * One section's own loading spinner, or its error with Try again, shown in the
 * space its loaded content takes; renders `children` once the data is in.
 * The caller keeps its heading outside, so the heading stays put throughout.
 */
export default function SectionLoadState({
  loading,
  error,
  loadingLabel,
  onRetry,
  className,
  children,
}: SectionLoadStateProps) {
  if (!loading && !error) return <>{children}</>;

  return (
    <div className={joinClassNames(styles.placeholder, className)}>
      {loading ? (
        <LoadingState label={loadingLabel} />
      ) : (
        <ErrorState message={error ?? undefined} onRetry={onRetry} />
      )}
    </div>
  );
}
