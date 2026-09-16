import React from 'react';
import { getTeamPrimaryColor } from '@/features/teams/utils/teamColor';
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

function getPeriodLabel(p: PeriodGoalBreakdown): string {
  if (p.periodType === 'OT') return 'OT';
  if (p.periodType === 'SO') return 'SO';
  return `P${p.periodNum}`;
}

function PeriodGoalsBreakdownTable({
  periodGoalsBreakdown,
  homeAbbrev,
  awayAbbrev,
}: PeriodGoalsBreakdownTableProps) {
  const awayTotal = periodGoalsBreakdown.reduce(
    (sum, p) => sum + p.awayGoals,
    0,
  );
  const homeTotal = periodGoalsBreakdown.reduce(
    (sum, p) => sum + p.homeGoals,
    0,
  );
  const awayColor = getTeamPrimaryColor(awayAbbrev);
  const homeColor = getTeamPrimaryColor(homeAbbrev);

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
              {periodGoalsBreakdown.map((p) => (
                <th key={p.periodNum}>{getPeriodLabel(p)}</th>
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
              {periodGoalsBreakdown.map((p) => (
                <td key={p.periodNum}>{p.awayGoals}</td>
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
              {periodGoalsBreakdown.map((p) => (
                <td key={p.periodNum}>{p.homeGoals}</td>
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
