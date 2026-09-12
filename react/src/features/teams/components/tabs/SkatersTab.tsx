import { useMemo, useState } from 'react';
import { sortByKey } from '@/features/teams/utils/teamPageHelper';
import { PlayerStatLine, SortDirection } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface Props {
  players: PlayerStatLine[];
}

interface Column {
  key: keyof PlayerStatLine;
  label: string;
  render: (line: PlayerStatLine) => string;
}

const formatPct = (v: number | null) => (v != null ? `${(v * 100).toFixed(1)}%` : '—');

const COLUMNS: Column[] = [
  { key: 'name', label: 'Player', render: (l) => l.name },
  { key: 'gamesPlayed', label: 'GP', render: (l) => String(l.gamesPlayed) },
  { key: 'goals', label: 'G', render: (l) => String(l.goals) },
  { key: 'assists', label: 'A', render: (l) => String(l.assists) },
  { key: 'points', label: 'P', render: (l) => String(l.points) },
  {
    key: 'plusMinus',
    label: '+/-',
    render: (l) => (l.plusMinus > 0 ? `+${l.plusMinus}` : String(l.plusMinus)),
  },
  { key: 'penaltyMinutes', label: 'PIM', render: (l) => String(l.penaltyMinutes) },
  { key: 'faceoffWinPct', label: 'FO%', render: (l) => formatPct(l.faceoffWinPct) },
  { key: 'corsiPct', label: 'CF%', render: (l) => formatPct(l.corsiPct) },
];

/** Skaters tab: sortable table over the normalized skater summary (+ merged Corsi) contract. */
export default function SkatersTab({ players }: Props) {
  const [sortKey, setSortKey] = useState<keyof PlayerStatLine>('points');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const sorted = useMemo(
    () => sortByKey(players, sortKey, sortDir),
    [players, sortKey, sortDir],
  );

  function handleSort(key: keyof PlayerStatLine) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Skaters</h2>
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
            {sorted.map((p) => (
              <tr key={p.playerId}>
                {COLUMNS.map((col) => (
                  <td key={col.key}>{col.render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
