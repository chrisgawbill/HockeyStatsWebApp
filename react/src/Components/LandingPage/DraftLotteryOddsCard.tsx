import React from 'react';
import { StandingsTeam } from '../../Data/Models/standingsTeam';
import styles from '../../style/LandingPage/DraftLotteryOddsCard.module.css';

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  index: number;
  maxOdds: number;
}

export default function DraftLotteryOddsCard({
  team,
  index,
  maxOdds,
}: DraftLotteryOddsCardProps) {
  const progressPct = maxOdds > 0 ? (team.draftLotteryOdds / maxOdds) * 100 : 0;

  const trendClass =
    team.draftLotteryOddsTrend === 'up'
      ? styles['trend-up']
      : team.draftLotteryOddsTrend === 'down'
        ? styles['trend-down']
        : '';

  const trendIcon =
    team.draftLotteryOddsTrend === 'up'
      ? '▲'
      : team.draftLotteryOddsTrend === 'down'
        ? '▼'
        : null;

  return (
    <div className={styles['lottery-card']}>
      <div className={styles['lottery-card__header']}>
        <span className={styles['lottery-card__rank']}>#{index + 1}</span>
        <img
          src={team.teamLogo}
          alt={team.teamName}
          className={styles['lottery-card__logo']}
        />
        <span className={styles['lottery-card__name']}>{team.teamName}</span>
        <div className={styles['lottery-card__right']}>
          {trendIcon && (
            <span
              className={[styles['lottery-card__trend'], trendClass]
                .filter(Boolean)
                .join(' ')}
            >
              {trendIcon}
            </span>
          )}
          <span className={styles['lottery-card__odds']}>
            {team.draftLotteryOdds}%
          </span>
        </div>
      </div>

      <div className={styles['lottery-card__bar-track']}>
        <div
          className={styles['lottery-card__bar-fill']}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
