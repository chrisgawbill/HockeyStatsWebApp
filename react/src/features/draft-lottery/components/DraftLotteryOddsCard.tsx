import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';
import { getTeamShortName } from '@/features/draft-lottery/utils/teamShortName';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsCard.module.css';

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  /** Board position (1-based): pre-lottery rank, or final pick after a draw. */
  rank: number;
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
  result,
}: DraftLotteryOddsCardProps) {
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

  const marker =
    result && result.pick <= 2
      ? `★ #${result.pick}`
      : result && result.drawWon !== null
        ? '★'
        : null;

  return (
    <li
      className={[styles['slot'], isWinner ? styles['slot--winner'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      title={team.teamName}
    >
      <span className={styles['slot__rank']} aria-hidden="true">
        {rank}
      </span>
      {marker && (
        <span className={styles['slot__marker']} aria-hidden="true">
          {marker}
        </span>
      )}
      <img
        src={team.teamLogo}
        alt=""
        className={styles['slot__logo']}
        aria-hidden="true"
      />
      <span className={styles['slot__name']} aria-hidden="true">
        {getTeamShortName(team.teamName)}
      </span>
      <span className={styles['slot__tag']} aria-hidden="true">
        <span className={styles['slot__odds']}>{team.draftLotteryOdds}%</span>
        {trendIcon && (
          <span className={`${styles['slot__trend']} ${trendClass}`}>
            {trendIcon}
          </span>
        )}
      </span>
      <span
        className={[
          styles['slot__move'],
          movement > 0 ? styles['slot__move--up'] : '',
          movement < 0 ? styles['slot__move--down'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {result && movement !== 0
          ? movement > 0
            ? `▲${movement}`
            : `▼${-movement}`
          : ''}
      </span>
    </li>
  );
}
