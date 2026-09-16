import { TeamResult } from '@/features/teams/utils/teamFormHelper';
import styles from '@/features/teams/components/TeamPage.module.css';

interface FormStripProps {
  results: TeamResult[];
  className?: string;
}

export default function FormStrip({ results, className }: FormStripProps) {
  const record = results.reduce(
    (counts, result) => {
      counts[result.outcome] += 1;
      return counts;
    },
    { W: 0, L: 0, OTL: 0 },
  );

  return (
    <div
      className={[styles['form-strip'], className].filter(Boolean).join(' ')}
      role="img"
      aria-label={`Last ${results.length}: ${record.W}-${record.L}-${record.OTL}`}
    >
      {results.length === 0 ? (
        <span className={styles['form-strip__empty']}>No completed games</span>
      ) : (
        results.map((result, index) => (
          <span
            key={`${result.date.getTime()}-${index}`}
            className={`${styles['form-strip__result']} ${styles[`form-strip__result--${result.outcome.toLowerCase()}`]}`}
            aria-hidden="true"
          >
            {result.outcome}
          </span>
        ))
      )}
    </div>
  );
}
