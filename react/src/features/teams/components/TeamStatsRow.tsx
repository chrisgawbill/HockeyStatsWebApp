import { StatItem } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface TeamStatsRowProps {
  stats: StatItem[];
}

export default function TeamStatsRow({ stats }: TeamStatsRowProps) {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Team Stats</h2>
      <div className={styles['stat-strip']}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${styles['stat-pill']} ${shared.surface} ${shared.surfaceInteractive}`}
          >
            <span className={styles['stat-pill__value']}>{stat.value}</span>
            <span className={styles['stat-pill__label']}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
