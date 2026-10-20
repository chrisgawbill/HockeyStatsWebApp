import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import DraftLotteryOddsCard from '@/features/draft-lottery/components/DraftLotteryOddsCard';
import { useDraftLotterySimulation } from '@/features/draft-lottery/hooks/useDraftLotterySimulation';
import { LotteryResultEntry } from '@/features/draft-lottery/utils/draftLotterySim';
import { joinClassNames } from '@/lib/joinClassNames';
import headerStyles from '@/styles/LandingPageRow.module.css';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsRow.module.css';

interface DraftLotteryOddsRowProps {
  title: string;
  /** Lottery teams ordered worst team first. */
  data: StandingsTeam[];
}

interface StageSlotProps {
  pick: 1 | 2;
  entry: LotteryResultEntry | undefined;
  revealed: boolean;
  teamsById: Map<string, StandingsTeam>;
}

/** One "Pick #n" placeholder in the reveal stage: shows "?" until its team is revealed. */
function StageSlot({ pick, entry, revealed, teamsById }: StageSlotProps) {
  const team = entry ? teamsById.get(entry.id) : undefined;
  return (
    <div
      className={joinClassNames(
        styles['stage__slot'],
        revealed && styles['stage__slot--revealed'],
      )}
    >
      <span className={styles['stage__pick']}>Pick #{pick}</span>
      {revealed && team ? (
        <>
          <img src={team.teamLogo} alt="" className={styles['stage__logo']} />
          <span className={styles['stage__name']}>{team.teamName}</span>
        </>
      ) : (
        <span className={styles['stage__mystery']}>?</span>
      )}
    </div>
  );
}

/**
 * Home-page draft lottery board: the lottery teams in odds order, with a
 * Simulate button that animates a draw and re-ranks the board by the result.
 */
export default function DraftLotteryOddsRow({
  title,
  data: lotteryTeams,
}: DraftLotteryOddsRowProps) {
  const {
    phase,
    lotteryResult,
    announcement,
    selectedId,
    setSelectedId,
    teamsById,
    animating,
    simulate,
    reset,
  } = useDraftLotterySimulation(lotteryTeams);

  if (lotteryTeams.length <= 1) return null;

  const showResult = phase === 'done' && lotteryResult !== null;
  const board: {
    team: StandingsTeam;
    rank: number;
    entry?: LotteryResultEntry;
  }[] = showResult
    ? lotteryResult.flatMap((entry) => {
        const team = teamsById.get(entry.id);
        return team ? [{ team, rank: entry.pick, entry }] : [];
      })
    : lotteryTeams.map((team, index) => ({ team, rank: index + 1 }));

  const revealed2 = phase === 'reveal-2' || phase === 'reveal-1';
  const revealed1 = phase === 'reveal-1';

  const selectedTeam = selectedId ? teamsById.get(selectedId) : undefined;
  const selectedRank = selectedTeam
    ? board.findIndex((boardEntry) => boardEntry.team.id === selectedTeam.id) +
      1
    : 0;

  return (
    <div className={headerStyles['section-container']}>
      <div
        className={`${headerStyles['landing-header']} ${headerStyles['landing-header--actions']}`}
      >
        <h2>{title}</h2>
        <div className={headerStyles['landing-header-actions']}>
          <button
            type="button"
            className={styles['action']}
            onClick={simulate}
            disabled={animating}
            aria-label="Simulate the draft lottery"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
            Simulate
          </button>
          <button
            type="button"
            className={styles['action-reset']}
            onClick={reset}
            disabled={phase === 'idle' || animating}
            aria-label="Reset draft lottery"
            title="Reset draft lottery"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <polyline points="3 3 3 9 9 9" />
            </svg>
          </button>
        </div>
      </div>
      <div role="status" aria-live="polite" className={styles['sr-only']}>
        {announcement}
      </div>
      <div className={styles['frame']}>
        <div className={styles['frame__inner']}>
          {animating && lotteryResult && (
            <div className={styles['stage']} aria-hidden="true">
              <p className={styles['stage__title']}>
                {phase === 'rolling'
                  ? 'Drawing the winners…'
                  : 'And the pick goes to…'}
              </p>
              <div
                className={joinClassNames(
                  styles['stage__slots'],
                  phase === 'rolling' && styles['stage__slots--rolling'],
                )}
              >
                <StageSlot
                  pick={2}
                  entry={lotteryResult[1]}
                  revealed={revealed2}
                  teamsById={teamsById}
                />
                <StageSlot
                  pick={1}
                  entry={lotteryResult[0]}
                  revealed={revealed1}
                  teamsById={teamsById}
                />
              </div>
            </div>
          )}
          <ol className={styles['grid']}>
            {board.map(({ team, rank, entry }) => (
              <DraftLotteryOddsCard
                key={team.id}
                team={team}
                rank={rank}
                lotteryResult={entry}
                selected={selectedId === team.id}
                onSelect={() =>
                  setSelectedId((current) =>
                    current === team.id ? null : team.id,
                  )
                }
              />
            ))}
          </ol>
          <p className={styles['caption']}>
            {selectedTeam
              ? `${selectedTeam.teamName} · #${selectedRank} · ${selectedTeam.draftLotteryOdds.toFixed(1)}%`
              : 'Tap a tile for the full team name'}
          </p>
        </div>
      </div>
    </div>
  );
}
