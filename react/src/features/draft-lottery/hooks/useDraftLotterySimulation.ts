import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import {
  LotteryResultEntry,
  simulateDraftLottery,
} from '@/features/draft-lottery/utils/draftLotterySim';
import { buildLotteryAnnouncement } from '@/features/draft-lottery/utils/draftLotteryAnnouncement';

export type LotteryPhase =
  'idle' | 'rolling' | 'reveal-2' | 'reveal-1' | 'done';

const ROLL_MS = 900;
const REVEAL_2_MS = 1100;
const REVEAL_1_MS = 1100;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * State machine for the draft lottery simulator: runs one weighted draw over
 * `lotteryTeams` (worst team first) and steps through the reveal animation
 * (rolling, then the #2 pick, then the #1 pick) before settling on `done`.
 * Users who prefer reduced motion skip straight to `done`. A screen-reader
 * `announcement` describes each outcome or reset. Changing `lotteryTeams`
 * (for example a season switch) discards any simulation in progress. Also
 * tracks which team tile is selected for the caption.
 */
export function useDraftLotterySimulation(lotteryTeams: StandingsTeam[]) {
  const [phase, setPhase] = useState<LotteryPhase>('idle');
  const [lotteryResult, setLotteryResult] = useState<
    LotteryResultEntry[] | null
  >(null);
  const [announcement, setAnnouncement] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const teamsById = useMemo(
    () => new Map(lotteryTeams.map((team) => [team.id, team])),
    [lotteryTeams],
  );

  useEffect(() => {
    clearTimers();
    setPhase('idle');
    setLotteryResult(null);
    setAnnouncement('');
    setSelectedId(null);
  }, [lotteryTeams, clearTimers]);

  const animating =
    phase === 'rolling' || phase === 'reveal-2' || phase === 'reveal-1';

  const finish = (outcome: LotteryResultEntry[]) => {
    setPhase('done');
    setAnnouncement(
      buildLotteryAnnouncement(
        outcome,
        (id) => teamsById.get(id)?.teamName ?? 'Unknown team',
      ),
    );
  };

  const simulate = () => {
    if (animating) return;
    clearTimers();
    const outcome = simulateDraftLottery(
      lotteryTeams.map((team) => ({
        id: team.id,
        odds: team.draftLotteryOdds,
      })),
    );
    setLotteryResult(outcome);
    setAnnouncement('');
    if (prefersReducedMotion()) {
      finish(outcome);
      return;
    }
    setPhase('rolling');
    const schedule = (callback: () => void, delayMs: number) =>
      timers.current.push(window.setTimeout(callback, delayMs));
    schedule(() => setPhase('reveal-2'), ROLL_MS);
    schedule(() => setPhase('reveal-1'), ROLL_MS + REVEAL_2_MS);
    schedule(() => finish(outcome), ROLL_MS + REVEAL_2_MS + REVEAL_1_MS);
  };

  const reset = () => {
    clearTimers();
    setPhase('idle');
    setLotteryResult(null);
    setAnnouncement('Draft lottery reset to the current odds.');
  };

  return {
    phase,
    lotteryResult,
    announcement,
    selectedId,
    setSelectedId,
    teamsById,
    animating,
    simulate,
    reset,
  };
}
