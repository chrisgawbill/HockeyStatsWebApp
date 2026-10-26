import { TeamSplit } from '@/lib/teamForm';
import styles from '@/components/TeamFormPanel.module.css';

interface SplitBarsProps {
  home: TeamSplit;
  road: TeamSplit;
}

/** Formats a split as wins-losses-OT losses. */
function record(split: TeamSplit): string {
  return `${split.wins}-${split.losses}-${split.otl}`;
}

/** Bar width as a percentage of the larger side. */
function barWidth(value: number, max: number): string {
  return `${max === 0 ? 0 : Math.round((value / max) * 100)}%`;
}

/** Paired bars comparing home and road records. */
export default function SplitBars({ home, road }: SplitBarsProps) {
  const maxGoals = Math.max(home.gf, home.ga, road.gf, road.ga, 1);

  return (
    <div className={styles['split-bars']}>
      {[
        ['Home', home],
        ['Road', road],
      ].map(([label, split]) => {
        const typedSplit = split as TeamSplit;
        return (
          <div className={styles['split-bars__column']} key={label as string}>
            <div className={styles['split-bars__heading']}>
              <span>{label as string}</span>
              <span>{record(typedSplit)}</span>
            </div>
            <div className={styles['split-bars__metric']}>
              <span>GF</span>
              <span className={styles['split-bars__track']}>
                <span
                  className={styles['split-bars__fill--for']}
                  style={{ width: barWidth(typedSplit.gf, maxGoals) }}
                />
              </span>
              <strong>{typedSplit.gf}</strong>
            </div>
            <div className={styles['split-bars__metric']}>
              <span>GA</span>
              <span className={styles['split-bars__track']}>
                <span
                  className={styles['split-bars__fill--against']}
                  style={{ width: barWidth(typedSplit.ga, maxGoals) }}
                />
              </span>
              <strong>{typedSplit.ga}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
