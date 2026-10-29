import {
  CLINCH_STATUS_META,
  ClinchStatus,
} from '@/features/standings/utils/clinchStatus';
import { joinClassNames } from '@/lib/joinClassNames';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import styles from '@/features/standings/components/LandingPageStandings.module.css';

interface Props {
  className?: string;
}

/**
 * Key explaining each clinch badge letter (P, C, D, X, W) used in the
 * standings tables. These are NHL clinch codes, so the AHL view has no legend.
 */
export default function StandingsClinchLegend({ className }: Props) {
  const { league } = useLeague();
  if (league === 'ahl') return null;
  return (
    <div
      className={joinClassNames(styles['standings-clinch-legend'], className)}
      role="region"
      aria-label="Standings clinch legend"
      // Phones scroll the legend sideways, so keyboard users need a stop on it.
      tabIndex={0}
    >
      {(Object.keys(CLINCH_STATUS_META) as ClinchStatus[]).map((status) => {
        const statusMeta = CLINCH_STATUS_META[status];
        return (
          <span
            key={status}
            className={styles['standings-clinch-legend__item']}
          >
            <span
              className={`${styles['standings-clinch-badge']} ${statusMeta.className}`}
              aria-hidden="true"
            >
              {statusMeta.badge}
            </span>
            <span>{statusMeta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
