import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';
import { joinClassNames } from '@/lib/joinClassNames';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsCard.module.css';

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  /** Board position (1-based): pre-lottery rank, or final pick after a draw. */
  rank: number;
  /** Present once a simulation has finished. */
  lotteryResult?: LotteryResultEntry;
  selected: boolean;
  onSelect: () => void;
}

/** One team tile on the lottery board: rank, logo, odds, and pick movement after a draw. */
export default function DraftLotteryOddsCard({
  team,
  rank,
  lotteryResult,
  selected,
  onSelect,
}: DraftLotteryOddsCardProps) {
  const isWinner = lotteryResult?.drawWon != null;
  const odds = team.draftLotteryOdds.toFixed(1);
  const movement = lotteryResult?.movement ?? 0;
  const rankLabel = isWinner ? `★${rank}` : `#${rank}`;

  const moveText =
    movement > 0
      ? `, moved up ${movement}`
      : movement < 0
        ? `, moved down ${-movement}`
        : '';
  const ariaLabel = `#${rank} ${team.teamName}: ${odds}% draft lottery odds${moveText}`;

  return (
    <li className={styles['item']}>
      <button
        type="button"
        className={joinClassNames(
          styles['slot'],
          isWinner && styles['slot--winner'],
          selected && styles['slot--selected'],
        )}
        aria-label={ariaLabel}
        aria-pressed={selected}
        title={team.teamName}
        onClick={onSelect}
      >
        <span className={styles['slot__top']} aria-hidden="true">
          <span className={styles['slot__rank']}>{rankLabel}</span>
          {lotteryResult && movement !== 0 && (
            <span
              className={
                movement > 0
                  ? styles['slot__move--up']
                  : styles['slot__move--down']
              }
            >
              {movement > 0 ? `▲${movement}` : `▼${-movement}`}
            </span>
          )}
        </span>
        <span className={styles['slot__id']} aria-hidden="true">
          <img src={team.teamLogo} alt="" className={styles['slot__logo']} />
          <span className={styles['slot__abbr']}>{team.id}</span>
        </span>
        <span className={styles['slot__tag']} aria-hidden="true">
          {odds}%
        </span>
      </button>
    </li>
  );
}
