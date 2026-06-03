import React from 'react';
import { getTeamPrimaryColor } from '../../Data/Helpers/teamColor';
import shared from '../../Style/shared.module.css';
import styles from '../../Style/GameDetailPage.module.css';

type PeriodScore = {
  periodNum: number;
  periodType: string;
  homeGoals: number;
  awayGoals: number;
};

type PeriodScoresTableProps = {
  periodScores: PeriodScore[];
  homeAbbrev: string;
  awayAbbrev: string;
};

function getPeriodLabel(p: PeriodScore): string {
  if (p.periodType === 'OT') return 'OT';
  if (p.periodType === 'SO') return 'SO';
  return `P${p.periodNum}`;
}

function PeriodScoresTable({
  periodScores,
  homeAbbrev,
  awayAbbrev,
}: PeriodScoresTableProps) {
  const awayTotal = periodScores.reduce((sum, p) => sum + p.awayGoals, 0);
  const homeTotal = periodScores.reduce((sum, p) => sum + p.homeGoals, 0);
  const awayColor = getTeamPrimaryColor(awayAbbrev);
  const homeColor = getTeamPrimaryColor(homeAbbrev);

  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Period Scores</h2>
      <div
        className={`${styles['period-scores-wrapper']} ${shared.surface} ${shared.surfaceScroll}`}
      >
        <table className={styles['period-scores-table']}>
          <thead>
            <tr>
              <th className={styles['period-scores-table__team-col']}>Team</th>
              {periodScores.map((p) => (
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
              <td className={styles['period-scores-table__team-col']}>
                {awayAbbrev}
              </td>
              {periodScores.map((p) => (
                <td key={p.periodNum}>{p.awayGoals}</td>
              ))}
              <td className={styles['total-col']}>{awayTotal}</td>
            </tr>
            <tr
              style={
                { '--period-team-color': homeColor } as React.CSSProperties
              }
            >
              <td className={styles['period-scores-table__team-col']}>
                {homeAbbrev}
              </td>
              {periodScores.map((p) => (
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

export default PeriodScoresTable;
