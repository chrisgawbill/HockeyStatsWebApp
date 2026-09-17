import { useState } from 'react';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsCard.module.css';

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
  const [flipped, setFlipped] = useState(false);
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

  const trendLabel =
    team.draftLotteryOddsTrend === 'up'
      ? ', trending up'
      : team.draftLotteryOddsTrend === 'down'
        ? ', trending down'
        : '';

  const ariaLabel = `#${index + 1} ${team.teamName}: ${team.draftLotteryOdds}% draft lottery odds${trendLabel}`;

  return (
    <button
      type="button"
      className={[styles['lottery-card'], flipped && styles['is-flipped']]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={flipped}
      onClick={() => setFlipped((f) => !f)}
      aria-label={ariaLabel}
    >
      <span className={styles['lottery-card__inner']} aria-hidden="true">
        <span
          className={`${styles['lottery-card__face']} ${styles['lottery-card__face--front']}`}
        >
          <span className={styles['lottery-card__header']}>
            <span className={styles['lottery-card__rank']}>#{index + 1}</span>
            <img
              src={team.teamLogo}
              alt=""
              className={styles['lottery-card__logo']}
            />
            <span className={styles['lottery-card__name']}>
              {team.teamName}
            </span>
          </span>
        </span>
        <span
          className={`${styles['lottery-card__face']} ${styles['lottery-card__face--back']}`}
        >
          <span className={styles['lottery-card__header']}>
            <span className={styles['lottery-card__rank']}>#{index + 1}</span>
            <span className={styles['lottery-card__right']}>
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
            </span>
          </span>
          <span className={styles['lottery-card__bar-track']}>
            <span
              className={styles['lottery-card__bar-fill']}
              style={{ width: `${progressPct}%` }}
            />
          </span>
        </span>
      </span>
    </button>
  );
}
