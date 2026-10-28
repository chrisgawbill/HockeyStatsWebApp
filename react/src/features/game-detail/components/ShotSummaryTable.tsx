import styles from '@/features/game-detail/components/GameShots.module.css';
import {
  PeriodShotSummary,
  TeamShotCounts,
} from '@/features/game-detail/utils/shotMapHelper';

interface ShotSummaryTableProps {
  rows: PeriodShotSummary[];
  totals: { away: TeamShotCounts; home: TeamShotCounts };
  awayTriCode: string;
  homeTriCode: string;
}

/** Goals, shots on goal and attempts for one team, as table cells. */
function TeamCells({ counts }: { counts: TeamShotCounts }) {
  return (
    <>
      <td>{counts.goals}</td>
      <td>{counts.shotsOnGoal}</td>
      <td>{counts.attempts}</td>
    </>
  );
}

/**
 * The text version of both charts: shots and goals by period for each team,
 * following the shot map filters. A disclosure so keyboard and screen-reader
 * users (and anyone else) can read the numbers without the charts.
 */
function ShotSummaryTable({
  rows,
  totals,
  awayTriCode,
  homeTriCode,
}: ShotSummaryTableProps) {
  return (
    <details className={styles.summary}>
      <summary>Shots and goals by period (table)</summary>
      <table className={styles['summary-table']}>
        <caption className="ds-visually-hidden">
          Shots and goals by period. G is goals, SOG is shots on goal, Att. is
          all shot attempts including missed and blocked shots.
        </caption>
        <thead>
          <tr>
            <td />
            <th scope="colgroup" colSpan={3}>
              {awayTriCode}
            </th>
            <th scope="colgroup" colSpan={3}>
              {homeTriCode}
            </th>
          </tr>
          <tr>
            <th scope="col">Period</th>
            {[awayTriCode, homeTriCode].flatMap((triCode) => [
              <th key={`${triCode}-g`} scope="col">
                G
              </th>,
              <th key={`${triCode}-sog`} scope="col">
                SOG
              </th>,
              <th key={`${triCode}-att`} scope="col">
                Att.
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ period, away, home }) => (
            <tr key={period.period}>
              <th scope="row">{period.label}</th>
              <TeamCells counts={away} />
              <TeamCells counts={home} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <TeamCells counts={totals.away} />
            <TeamCells counts={totals.home} />
          </tr>
        </tfoot>
      </table>
    </details>
  );
}

export default ShotSummaryTable;
