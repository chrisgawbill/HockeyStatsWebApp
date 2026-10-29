import React from 'react';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

type TeamTotals = {
  sog: number;
  hits: number;
  blockedShots: number;
  pim: number;
  powerPlayGoals: number | null;
  giveaways: number | null;
  takeaways: number | null;
};

type TeamComparisonProps = {
  homeTotals: TeamTotals;
  awayTotals: TeamTotals;
  homeAbbrev: string;
  awayAbbrev: string;
};

const STAT_ROWS: { label: string; key: keyof TeamTotals }[] = [
  { label: 'Shots', key: 'sog' },
  { label: 'Hits', key: 'hits' },
  { label: 'Blocked Shots', key: 'blockedShots' },
  { label: 'Penalty Minutes', key: 'pim' },
  { label: 'PP Goals', key: 'powerPlayGoals' },
  { label: 'Giveaways', key: 'giveaways' },
  { label: 'Takeaways', key: 'takeaways' },
];

/** Side-by-side bars comparing the teams' game totals; stats the feed lacks are left out. */
function TeamComparison({
  homeTotals,
  awayTotals,
  homeAbbrev,
  awayAbbrev,
}: TeamComparisonProps) {
  const { league } = useLeague();
  const awayColor = getTeamPrimaryColor(awayAbbrev, league);
  const homeColor = getTeamPrimaryColor(homeAbbrev, league);

  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Team Stats</h2>
      <div
        className={`${styles['team-comparison-card']} ${shared.surface} ${shared.surfaceClip}`}
        style={
          {
            '--away-team-color': awayColor,
            '--home-team-color': homeColor,
          } as React.CSSProperties
        }
      >
        <div className={styles['team-comparison-header']}>
          <span
            className={joinClassNames(
              styles['team-comparison-abbrev'],
              styles['team-comparison-abbrev--away'],
            )}
          >
            {awayAbbrev}
          </span>
          <span />
          <span
            className={joinClassNames(
              styles['team-comparison-abbrev'],
              styles['team-comparison-abbrev--home'],
            )}
          >
            {homeAbbrev}
          </span>
        </div>
        {STAT_ROWS.map(({ label, key }) => {
          const awayVal = awayTotals[key];
          const homeVal = homeTotals[key];
          if (awayVal == null || homeVal == null) return null;
          const awayLeads = awayVal > homeVal;
          const homeLeads = homeVal > awayVal;

          return (
            <div key={key} className={styles['team-stat-row']}>
              <span
                className={joinClassNames(
                  styles['team-stat-row__value'],
                  styles['team-stat-row__away'],
                  awayLeads && styles['team-stat-row__value--leader'],
                  awayLeads && styles['team-stat-row__value--away-leader'],
                )}
              >
                {awayVal}
              </span>
              <span className={styles['team-stat-row__label']}>{label}</span>
              <span
                className={joinClassNames(
                  styles['team-stat-row__value'],
                  styles['team-stat-row__home'],
                  homeLeads && styles['team-stat-row__value--leader'],
                  homeLeads && styles['team-stat-row__value--home-leader'],
                )}
              >
                {homeVal}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TeamComparison;
