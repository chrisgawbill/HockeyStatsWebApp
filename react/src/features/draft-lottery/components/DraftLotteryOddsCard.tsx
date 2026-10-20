import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsCard.module.css';

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  /** Board position (1-based): pre-lottery rank, or final pick after a draw. */
  rank: number;
  maxOdds: number;
  /** Present once a simulation has finished. */
  result?: LotteryResultEntry;
}

const TREND_ICON: Record<string, string> = { up: '▲', down: '▼' };
const TREND_LABEL: Record<string, string> = {
  up: ', trending up',
  down: ', trending down',
};

export default function DraftLotteryOddsCard({
  team,
  rank,
  maxOdds,
  result,
}: DraftLotteryOddsCardProps) {
  const progressPct = maxOdds > 0 ? (team.draftLotteryOdds / maxOdds) * 100 : 0;
  const trend = team.draftLotteryOddsTrend.toLowerCase();
  const trendIcon = TREND_ICON[trend] ?? null;
  const trendClass = trend === 'up' ? styles['trend-up'] : styles['trend-down'];

  const isWinner = !!result && (result.pick <= 2 || result.drawWon !== null);
  const movement = result?.movement ?? 0;

  const ariaLabel = [
    `#${rank} ${team.teamName}: ${team.draftLotteryOdds}% draft lottery odds`,
    TREND_LABEL[trend] ?? '',
    result && movement > 0 ? `, moved up ${movement}` : '',
    result && movement < 0 ? `, moved down ${-movement}` : '',
  ].join('');

  return (
    <li
      className={[
        styles['slot'],
        isWinner ? styles['slot--winner'] : '',
        result?.pick === 1 ? styles['slot--first'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
    >
      <div className={styles['slot__main']} aria-hidden="true">
        <span className={styles['slot__rank']}>{rank}</span>
        <img src={team.teamLogo} alt="" className={styles['slot__logo']} />
        <span className={styles['slot__name']}>{team.teamName}</span>
        <span className={styles['slot__tag']}>
          {trendIcon && (
            <span className={`${styles['slot__trend']} ${trendClass}`}>
              {trendIcon}
            </span>
          )}
          <span className={styles['slot__odds']}>{team.draftLotteryOdds}%</span>
        </span>
      </div>
      <div className={styles['slot__foot']} aria-hidden="true">
        <span className={styles['slot__bar-track']}>
          <span
            className={styles['slot__bar-fill']}
            style={{ width: `${progressPct}%` }}
          />
        </span>
        {result && result.drawWon !== null && (
          <span className={styles['slot__badge']}>WINNER</span>
        )}
        {result && movement !== 0 && (
          <span
            className={`${styles['slot__move']} ${
              movement > 0
                ? styles['slot__move--up']
                : styles['slot__move--down']
            }`}
          >
            {movement > 0 ? `▲${movement}` : `▼${-movement}`}
          </span>
        )}
      </div>
    </li>
  );
}
