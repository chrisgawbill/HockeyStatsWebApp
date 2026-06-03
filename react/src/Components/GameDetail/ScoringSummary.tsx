import React from 'react';
import { LandingScoringPeriod } from '../../Data/Models/gameDetail';
import { getTeamPrimaryColor } from '../../Data/Helpers/teamColor';
import shared from '../../Style/shared.module.css';
import styles from '../../Style/GameDetailPage.module.css';

type ScoringSummaryProps = {
  scoring: LandingScoringPeriod[];
};

function getPeriodTitle(num: number, type: string): string {
  if (type === 'OT') return 'Overtime';
  if (type === 'SO') return 'Shootout';
  const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : 'rd';
  return `${num}${suffix} Period`;
}

function getStrengthBadge(strength: string, modifier: string): string | null {
  if (modifier === 'empty-net') return 'EN';
  if (strength === 'pp') return 'PP';
  if (strength === 'sh') return 'SH';
  return null;
}

function ScoringSummary({ scoring }: ScoringSummaryProps) {
  const periodsWithGoals = scoring.filter((p) => p.goals.length > 0);
  if (periodsWithGoals.length === 0) return null;

  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Scoring Summary</h2>
      <div className={styles['scoring-summary']}>
        {periodsWithGoals.map((period) => (
          <div
            key={period.periodDescriptor.number}
            className={`${styles['scoring-period']} ${shared.surface} ${shared.surfaceClip}`}
          >
            <p className={styles['scoring-period__header']}>
              {getPeriodTitle(
                period.periodDescriptor.number,
                period.periodDescriptor.periodType,
              )}
            </p>
            {period.goals.map((goal, i) => {
              const badge = getStrengthBadge(goal.strength, goal.goalModifier);
              const assists = goal.assists
                .map((a) => a.name.default)
                .join(', ');
              const scoreDisplay = `${goal.awayScore}–${goal.homeScore}`;
              const goalTeamColor = getTeamPrimaryColor(
                goal.teamAbbrev.default,
              );

              return (
                <div
                  key={i}
                  className={styles['scoring-goal-row']}
                  style={
                    {
                      '--goal-team-color': goalTeamColor,
                    } as React.CSSProperties
                  }
                >
                  <img
                    className={styles['scoring-goal__headshot']}
                    src={goal.headshot}
                    alt={goal.name.default}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className={styles['scoring-goal__info']}>
                    <span className={styles['scoring-goal__scorer']}>
                      {goal.name.default}
                    </span>
                    {assists && (
                      <span className={styles['scoring-goal__assists']}>
                        A: {assists}
                      </span>
                    )}
                  </div>
                  <div className={styles['scoring-goal__right']}>
                    <span className={styles['scoring-goal__score']}>
                      {scoreDisplay}
                    </span>
                    <span className={styles['scoring-goal__time']}>
                      {goal.timeInPeriod}
                    </span>
                    {badge && (
                      <span
                        className={`${styles['scoring-badge']} ${styles[`scoring-badge--${badge.toLowerCase()}`]}`}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export default ScoringSummary;
