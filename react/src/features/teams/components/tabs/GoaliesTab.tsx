import { useMemo, useState } from 'react';
import { sortByKey } from '@/features/teams/utils/teamPageHelper';
import { GoalieStatLine, SortDirection } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface Props {
  goalies: GoalieStatLine[];
}

interface Column {
  key: keyof GoalieStatLine;
  label: string;
  render: (line: GoalieStatLine) => string;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Goalie', render: (g) => g.name },
  { key: 'gamesPlayed', label: 'GP', render: (g) => String(g.gamesPlayed) },
  { key: 'wins', label: 'W', render: (g) => String(g.wins) },
  { key: 'losses', label: 'L', render: (g) => String(g.losses) },
  {
    key: 'savePctg',
    label: 'SV%',
    render: (g) => (g.savePctg != null ? (g.savePctg * 100).toFixed(1) + '%' : '—'),
  },
  {
    key: 'goalsAgainstAverage',
    label: 'GAA',
    render: (g) => (g.goalsAgainstAverage != null ? g.goalsAgainstAverage.toFixed(2) : '—'),
  },
  { key: 'shutouts', label: 'SO', render: (g) => String(g.shutouts) },
];

/** Goalies tab: sortable table over the normalized goalie summary contract. */
export default function GoaliesTab({ goalies }: Props) {
  const [sortKey, setSortKey] = useState<keyof GoalieStatLine>('wins');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const sorted = useMemo(
    () => sortByKey(goalies, sortKey, sortDir),
    [goalies, sortKey, sortDir],
  );

  function handleSort(key: keyof GoalieStatLine) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (goalies.length === 0) {
    return (
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>Goalies</h2>
        <p className={styles['tab-empty-state']}>No goalie data available.</p>
      </section>
    );
  }

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Goalies</h2>
      <div
        className={`${styles['stat-table-wrapper']} ${shared.surface} ${shared.surfaceClip}`}
      >
        <table className={styles['stat-table']}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={col.key === sortKey ? styles['active-sort'] : ''}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {col.key === sortKey ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => (
              <tr key={g.goalieId}>
                {COLUMNS.map((col) => (
                  <td key={col.key}>{col.render(g)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
