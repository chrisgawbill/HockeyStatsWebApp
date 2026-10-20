import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsCard.module.css';

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  /** Board position (1-based): pre-lottery rank, or final pick after a draw. */
  rank: number;
  /** Present once a simulation has finished. */
  result?: LotteryResultEntry;
  selected: boolean;
  onSelect: () => void;
}

export default function DraftLotteryOddsCard({
  team,
  rank,
  result,
  selected,
  onSelect,
}: DraftLotteryOddsCardProps) {
  const isWinner = !!result && (result.pick <= 2 || result.drawWon !== null);
  const movement = result?.movement ?? 0;
  const rankLabel = isWinner ? `★${rank}` : `#${rank}`;

  const ariaLabel = [
    `#${rank} ${team.teamName}: ${team.draftLotteryOdds}% draft lottery odds`,
    result && movement > 0 ? `, moved up ${movement}` : '',
    result && movement < 0 ? `, moved down ${-movement}` : '',
  ].join('');

  return (
    <li className={styles['item']}>
      <button
        type="button"
        className={[
          styles['slot'],
          isWinner ? styles['slot--winner'] : '',
          selected ? styles['slot--selected'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={ariaLabel}
        aria-pressed={selected}
        title={team.teamName}
        onClick={onSelect}
      >
        <span className={styles['slot__top']} aria-hidden="true">
          <span className={styles['slot__rank']}>{rankLabel}</span>
          {result && movement !== 0 && (
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
          {team.draftLotteryOdds}%
        </span>
      </button>
    </li>
  );
}
