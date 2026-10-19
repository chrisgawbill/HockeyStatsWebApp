import {
  TeamDnaProfile,
  TeamDnaRow,
  describeRow,
  ordinal,
} from '@/features/teams/utils/teamDnaHelper';
import styles from '@/features/teams/components/TeamPage.module.css';
import shared from '@/styles/shared.module.css';

interface TeamDnaProps {
  profile: TeamDnaProfile;
  season: string;
}

function seasonLabel(season: string): string {
  return /^\d{8}$/.test(season)
    ? `${season.slice(0, 4)}–${season.slice(6)}`
    : season;
}

function captionOf(profile: TeamDnaProfile, season: string): string {
  const parts = [seasonLabel(season)];
  if (profile.ranked) {
    parts.push(`ranked vs. ${profile.teamCount} teams`);
    if (profile.gamesPlayed != null) parts.push(`${profile.gamesPlayed} GP`);
  } else {
    parts.push('League ranks unavailable');
  }
  if (profile.earlySample) parts.push('Early-season sample');
  return parts.join(' · ');
}

function DnaRow({ row, index }: { row: TeamDnaRow; index: number }) {
  const tierClass = row.tier ? styles[`dna-metric--${row.tier}`] : '';
  return (
    <div
      className={`${styles['dna-metric']} ${tierClass}`}
      role="listitem"
      style={{ '--dna-index': index } as React.CSSProperties}
    >
      <div className={styles['dna-metric__heading']} aria-hidden="true">
        <span>{row.label}</span>
        <span className={styles['dna-metric__stat']}>
          <strong>{row.value}</strong>
          {row.rank != null && row.of != null && (
            <span className={styles['dna-metric__rank']}>
              {ordinal(row.rank)}{' '}
              <span className={styles['dna-metric__of']}>of {row.of}</span>
            </span>
          )}
        </span>
      </div>
      {row.fill != null && row.average != null && (
        <div
          className={styles['dna-metric__track']}
          role="img"
          aria-label={describeRow(row)}
        >
          <span
            className={styles['dna-metric__fill']}
            style={{ width: `${row.fill}%` }}
          />
          <i
            className={styles['dna-metric__avg']}
            style={{ left: `${row.average}%` }}
          />
        </div>
      )}
      {row.rank == null && (
        <span className={styles['dna-sr-only']}>{describeRow(row)}</span>
      )}
      {row.note && (
        <span className={styles['dna-metric__description']}>{row.note}</span>
      )}
    </div>
  );
}

export default function TeamDna({ profile, season }: TeamDnaProps) {
  const { rows, chips, ranked } = profile;

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
          {rows.length > 0 && (
            <p className={styles['dna-panel__caption']}>
              {captionOf(profile, season)}
            </p>
          )}
        </div>
        {ranked && rows.length > 0 && (
          <span className={styles['dna-panel__scale']} aria-hidden="true">
            <i className={styles['dna-panel__legend-tick']} /> League avg
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className={styles['dna-panel__empty']}>
          Team DNA will appear when this season has completed team data.
        </p>
      ) : (
        <>
          {chips.length > 0 && (
            <ul className={styles['dna-chips']} aria-label="Team identity">
              {chips.map((chip) => (
                <li
                  key={chip.label}
                  className={`${styles['dna-chip']} ${styles[`dna-chip--${chip.kind}`]}`}
                >
                  {chip.label}
                </li>
              ))}
            </ul>
          )}
          <div className={styles['dna-metrics']} role="list">
            {rows.map((row, index) => (
              <DnaRow row={row} index={index} key={row.key} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
