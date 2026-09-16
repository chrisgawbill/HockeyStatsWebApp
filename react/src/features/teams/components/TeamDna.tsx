import { TeamDnaMetric } from '@/features/teams/utils/teamDnaHelper';
import styles from '@/features/teams/components/TeamPage.module.css';
import shared from '@/styles/shared.module.css';

interface TeamDnaProps {
  metrics: TeamDnaMetric[];
  season: string;
}

function seasonLabel(season: string): string {
  return /^\d{8}$/.test(season)
    ? `${season.slice(0, 4)}–${season.slice(6)}`
    : season;
}

export default function TeamDna({ metrics, season }: TeamDnaProps) {
  const displaySeason = seasonLabel(season);

  return (
    <section
      className={`${styles['dna-panel']} ${shared.surface}`}
      aria-labelledby="team-dna-heading"
    >
      <div className={styles['dna-panel__header']}>
        <div>
          <h2 id="team-dna-heading" className={shared.sectionTitle}>
            Team DNA
          </h2>
          <p className={styles['dna-panel__caption']}>
            {displaySeason} season · {metrics.length} measurable tendencies
          </p>
        </div>
        <span className={styles['dna-panel__scale']}>Relative scale</span>
      </div>
      {metrics.length === 0 ? (
        <p className={styles['dna-panel__empty']}>
          Team DNA will appear when this season has completed team data.
        </p>
      ) : (
        <div className={styles['dna-metrics']} role="list">
          {metrics.map((metric) => (
            <div
              className={styles['dna-metric']}
              role="listitem"
              key={metric.key}
            >
              <div className={styles['dna-metric__heading']}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
              <div
                className={styles['dna-metric__track']}
                role="img"
                aria-label={`${metric.label}: ${metric.value}`}
              >
                <span style={{ width: `${metric.normalized}%` }} />
              </div>
              <span className={styles['dna-metric__description']}>
                {metric.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
