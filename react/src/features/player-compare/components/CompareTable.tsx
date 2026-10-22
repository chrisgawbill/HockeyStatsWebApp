import CompareSlotHeader from '@/features/player-compare/components/CompareSlotHeader';
import { buildCompareRows } from '@/features/player-compare/utils/compareStats';
import type {
  CompareSlot,
  PlayerGroup,
} from '@/features/player-compare/types/playerCompare';
import styles from '@/features/player-compare/components/CompareTable.module.css';

interface CompareTableProps {
  group: PlayerGroup;
  slots: CompareSlot[];
  season: string;
  onRemove: (playerId: number) => void;
}

/**
 * Players side by side: a column per slot, a row per stat, the best value in
 * each row marked. The stat labels stay put while a third column scrolls
 * inside the table, never the page.
 */
export default function CompareTable({
  group,
  slots,
  season,
  onRemove,
}: CompareTableProps) {
  const rows = buildCompareRows(group, slots);
  return (
    <div className={styles.card}>
      <div
        className={styles.scroller}
        role="region"
        aria-label="Comparison table"
        tabIndex={0}
      >
        <table
          className={styles.table}
          style={{ '--slot-count': slots.length } as React.CSSProperties}
        >
          <caption className={styles.visuallyHidden}>
            Season stats side by side; the best value in each row is marked
          </caption>
          <thead>
            <tr>
              <td className={styles.corner} />
              {slots.map((slot) => (
                <th
                  key={
                    slot.kind === 'unknown'
                      ? slot.playerId
                      : slot.player.playerId
                  }
                  scope="col"
                  className={styles.slotColumn}
                >
                  <CompareSlotHeader
                    slot={slot}
                    season={season}
                    onRemove={onRemove}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className={styles.statLabel}>
                  <abbr title={row.title}>{row.label}</abbr>
                </th>
                {row.cells.map((cell, column) => (
                  <td
                    key={column}
                    className={cell.isBest ? styles.bestCell : styles.cell}
                  >
                    {cell.text}
                    {cell.isBest && (
                      <span className={styles.bestMark}>
                        <span aria-hidden="true">●</span>
                        <span className={styles.visuallyHidden}> (best)</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
