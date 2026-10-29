import React from 'react';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

type PeriodGoalBreakdown = {
  periodNum: number;
  periodType: string;
  homeGoals: number;
  awayGoals: number;
};

type PeriodGoalsBreakdownTableProps = {
  periodGoalsBreakdown: PeriodGoalBreakdown[];
  homeAbbrev: string;
  awayAbbrev: string;
};

/** Column header for a period: P1-P3, then OT or SO. */
function getPeriodLabel(period: PeriodGoalBreakdown): string {
  if (period.periodType === 'OT') return 'OT';
  if (period.periodType === 'SO') return 'SO';
  return `P${period.periodNum}`;
}

/** Goals by period for each team, with totals. */
function PeriodGoalsBreakdownTable({
  periodGoalsBreakdown,
  homeAbbrev,
  awayAbbrev,
}: PeriodGoalsBreakdownTableProps) {
  const awayTotal = periodGoalsBreakdown.reduce(
    (sum, period) => sum + period.awayGoals,
    0,
  );
  const homeTotal = periodGoalsBreakdown.reduce(
    (sum, period) => sum + period.homeGoals,
    0,
  );
  const { league } = useLeague();
  const awayColor = getTeamPrimaryColor(awayAbbrev, league);
  const homeColor = getTeamPrimaryColor(homeAbbrev, league);

  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Period Goals Breakdown</h2>
      <div
        className={`${styles['period-goals-breakdown-wrapper']} ${shared.surface} ${shared.surfaceScroll}`}
      >
        <table className={styles['period-goals-breakdown-table']}>
          <thead>
            <tr>
              <th className={styles['period-goals-breakdown-table__team-col']}>
                Team
              </th>
              {periodGoalsBreakdown.map((period) => (
                <th key={period.periodNum}>{getPeriodLabel(period)}</th>
              ))}
              <th className={styles['total-col']}>T</th>
            </tr>
          </thead>
          <tbody>
            <tr
              style={
                { '--period-team-color': awayColor } as React.CSSProperties
              }
            >
              <td className={styles['period-goals-breakdown-table__team-col']}>
                {awayAbbrev}
              </td>
              {periodGoalsBreakdown.map((period) => (
                <td key={period.periodNum}>{period.awayGoals}</td>
              ))}
              <td className={styles['total-col']}>{awayTotal}</td>
            </tr>
            <tr
              style={
                { '--period-team-color': homeColor } as React.CSSProperties
              }
            >
              <td className={styles['period-goals-breakdown-table__team-col']}>
                {homeAbbrev}
              </td>
              {periodGoalsBreakdown.map((period) => (
                <td key={period.periodNum}>{period.homeGoals}</td>
              ))}
              <td className={styles['total-col']}>{homeTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PeriodGoalsBreakdownTable;
