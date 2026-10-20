import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import DraftLotteryOddsCard from '@/features/draft-lottery/components/DraftLotteryOddsCard';
import {
  LotteryResultEntry,
  simulateDraftLottery,
} from '@/features/draft-lottery/utils/draftLotterySim';
import headerStyles from '@/styles/LandingPageRow.module.css';
import styles from '@/features/draft-lottery/components/DraftLotteryOddsRow.module.css';

interface LandingPageRowProps {
  title: string;
  /** Lottery teams ordered worst team first. */
  data: StandingsTeam[];
}

type Phase = 'idle' | 'rolling' | 'reveal-2' | 'reveal-1' | 'done';

const ROLL_MS = 900;
const REVEAL_2_MS = 1100;
const REVEAL_1_MS = 1100;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LandingPageRow({ title, data }: LandingPageRowProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<LotteryResultEntry[] | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const teamsById = useMemo(
    () => new Map(data.map((team) => [team.id, team])),
    [data],
  );

  // A changed dataset (e.g. season switch) invalidates any simulation.
  useEffect(() => {
    clearTimers();
    setPhase('idle');
    setResult(null);
    setAnnouncement('');
  }, [data, clearTimers]);

  if (data.length <= 1) return <></>;

  const animating =
    phase === 'rolling' || phase === 'reveal-2' || phase === 'reveal-1';

  const nameOf = (entry?: LotteryResultEntry) =>
    (entry && teamsById.get(entry.id)?.teamName) ?? 'Unknown team';

  const finish = (outcome: LotteryResultEntry[]) => {
    setPhase('done');
    setAnnouncement(
      `${nameOf(outcome[0])} win the #1 pick. ${nameOf(outcome[1])} get the #2 pick.`,
    );
  };

  const simulate = () => {
    if (animating) return;
    clearTimers();
    const outcome = simulateDraftLottery(
      data.map((team) => ({ id: team.id, odds: team.draftLotteryOdds })),
    );
    setResult(outcome);
    setAnnouncement('');
    if (prefersReducedMotion()) {
      finish(outcome);
      return;
    }
    setPhase('rolling');
    const schedule = (fn: () => void, ms: number) =>
      timers.current.push(window.setTimeout(fn, ms));
    schedule(() => setPhase('reveal-2'), ROLL_MS);
    schedule(() => setPhase('reveal-1'), ROLL_MS + REVEAL_2_MS);
    schedule(() => finish(outcome), ROLL_MS + REVEAL_2_MS + REVEAL_1_MS);
  };

  const reset = () => {
    clearTimers();
    setPhase('idle');
    setResult(null);
    setAnnouncement('Draft lottery reset to the current odds.');
  };

  const showResult = phase === 'done' && result !== null;
  const board: {
    team: StandingsTeam;
    rank: number;
    entry?: LotteryResultEntry;
  }[] = showResult
    ? result.flatMap((entry) => {
        const team = teamsById.get(entry.id);
        return team ? [{ team, rank: entry.pick, entry }] : [];
      })
    : data.map((team, index) => ({ team, rank: index + 1 }));

  const revealed2 = phase === 'reveal-2' || phase === 'reveal-1';
  const revealed1 = phase === 'reveal-1';

  const renderStageSlot = (
    pick: 1 | 2,
    entry: LotteryResultEntry | undefined,
    revealed: boolean,
  ) => {
    const team = entry ? teamsById.get(entry.id) : undefined;
    return (
      <div
        className={[
          styles['stage__slot'],
          revealed ? styles['stage__slot--revealed'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
  };

  return (
    <div className={headerStyles['section-container']}>
      <div
        className={`${headerStyles['landing-header']} ${headerStyles['landing-header--actions']}`}
      >
        <h2>{title}</h2>
        <div className={headerStyles['landing-header-actions']}>
          <button
            type="button"
            className={`ds-button ${styles['action']}`}
            onClick={simulate}
            disabled={animating}
            aria-label="Simulate the draft lottery"
          >
            Simulate
          </button>
          <button
            type="button"
            className={`ds-button ${styles['action']}`}
            onClick={reset}
            disabled={phase === 'idle' || animating}
            aria-label="Reset the draft lottery to the current odds"
          >
            Reset
          </button>
        </div>
      </div>
      <div role="status" aria-live="polite" className={styles['sr-only']}>
        {announcement}
      </div>
      <div className={styles['frame']}>
        <div className={styles['frame__inner']}>
          {animating && result && (
            <div className={styles['stage']} aria-hidden="true">
              <p className={styles['stage__title']}>
                {phase === 'rolling'
                  ? 'Drawing the winners…'
                  : 'And the pick goes to…'}
              </p>
              <div
                className={[
                  styles['stage__slots'],
                  phase === 'rolling' ? styles['stage__slots--rolling'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {renderStageSlot(2, result[1], revealed2)}
                {renderStageSlot(1, result[0], revealed1)}
              </div>
            </div>
          )}
          <ol className={styles['grid']}>
            {board.map(({ team, rank, entry }) => (
              <DraftLotteryOddsCard
                key={team.id}
                team={team}
                rank={rank}
                result={entry}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
