import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type {
  CardDef,
  Role,
  ShotBand,
  ShotSaveResult,
} from '@/features/board-game/types/game';
import {
  bandForPosition,
  bandWidthsForAccuracy,
  rollBandFromAccuracy,
  shotAccuracyBonus,
} from '@/features/board-game/engine/shotModel';
import CardView from '@/features/board-game/components/CardView';
import ModalOverlay from '@/features/board-game/components/ModalOverlay';
import styles from '@/features/board-game/components/ShotMinigame.module.css';

export interface ShotMinigameProps {
  /** The 3 cards offered for the ante; the player picks one. */
  cards: CardDef[];
  /** Shooter's role: adds the LW/RW accuracy bonus and drives CardView's perk badge. */
  role: Role;
  goaliePoise: number;
  goalieMaxPoise: number;
  /** RNG seed for the reduced-motion band roll only. The save roll is never this component's job. */
  seed: number;
  /**
   * The engine's resolved save result for the band this screen already
   * reported via `onResolve`. Null while the caller hasn't rolled it yet —
   * the result step renders only once this is set, so there is exactly one
   * source of truth for the save.
   */
  result?: ShotSaveResult | null;
  /** Called once the band is resolved (press, or a miss on timeout): the picked card's id and the band. */
  onResolve: (cardId: string, band: ShotBand) => void;
}

/** Duration (ms) of one one-way sweep of the timing indicator. */
const SWEEP_CYCLE_MS = 2000;

/** Bounded swing: one there-and-back pass (2 alternating iterations) before an un-pressed shot resolves as a miss. */
const SWING_ITERATIONS = 2;
const SWING_WINDOW_MS = SWEEP_CYCLE_MS * SWING_ITERATIONS;

type Step = 'ante' | 'timing';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function bandLabel(band: ShotBand): string {
  if (band === 'perfect') return 'Perfect timing';
  if (band === 'good') return 'Good timing';
  if (band === 'weak') return 'Weak timing';
  return 'Missed the window';
}

function saveResultText(result: ShotSaveResult): string {
  if (!result.saved) return 'GOAL!';
  return result.freeze ? 'Save — the goalie freezes it' : 'Save — rebound!';
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable)
  );
}

/**
 * Shot ante + timing-bar minigame. Dumb: props in, callbacks out, same
 * pattern as `DuelScreen`. Does not call the reducer or import from
 * `hooks/`, and does not roll the save itself - `result` is supplied by the
 * caller once the engine has resolved it.
 */
export default function ShotMinigame({
  cards,
  role,
  goaliePoise,
  goalieMaxPoise,
  seed,
  result = null,
  onResolve,
}: ShotMinigameProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLButtonElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const seedRef = useRef(seed);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  const [step, setStep] = useState<Step>('ante');
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);
  const [resolvedBand, setResolvedBand] = useState<ShotBand | null>(null);

  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const accuracy = selectedCard
    ? (selectedCard.accuracy ?? 0) + shotAccuracyBonus(role)
    : 0;
  const widths = bandWidthsForAccuracy(accuracy);

  function clearSwingTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function finishTiming(finalBand: ShotBand) {
    if (!selectedCard || resolvedBand !== null) return;
    clearSwingTimer();
    setResolvedBand(finalBand);
    onResolve(selectedCard.id, finalBand);
  }

  // Reduced motion: no sweep, auto-resolve as soon as the timing step opens.
  useEffect(() => {
    if (step !== 'timing' || !reducedMotion || !selectedCard) return;
    if (resolvedBand !== null) return;
    const [rolledBand, nextSeed] = rollBandFromAccuracy(
      accuracy,
      seedRef.current,
    );
    seedRef.current = nextSeed;
    finishTiming(rolledBand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reducedMotion]);

  // Bounded swing: one there-and-back pass, then an un-pressed shot is a miss.
  useEffect(() => {
    if (step !== 'timing' || reducedMotion || resolvedBand !== null) return;
    timerRef.current = setTimeout(() => {
      finishTiming('miss');
    }, SWING_WINDOW_MS);
    return clearSwingTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reducedMotion, resolvedBand]);

  // Focus management: first playable control for the current step.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const target = dialog.querySelector<HTMLButtonElement>(
      'button:not(:disabled)',
    );
    if (target) target.focus();
    else dialog.focus();
  }, [step, resolvedBand, result]);

  function handlePress() {
    if (step !== 'timing' || reducedMotion || resolvedBand !== null) return;
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator) return;
    const trackRect = track.getBoundingClientRect();
    const indicatorRect = indicator.getBoundingClientRect();
    const position = clamp01(
      (indicatorRect.left + indicatorRect.width / 2 - trackRect.left) /
        trackRect.width,
    );
    finishTiming(bandForPosition(position, widths));
  }

  function handleDialogKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (isTypingTarget(e.target)) return;
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not(:disabled)'),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const showResult = resolvedBand !== null && result !== null;

  return (
    <ModalOverlay>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          Take the shot
        </h2>

        <div className={styles.poiseRow}>
          <span className={styles.poiseLabel}>Goalie poise</span>
          <progress
            className={styles.poiseBar}
            value={goaliePoise}
            max={goalieMaxPoise}
            aria-label="Goalie poise"
          />
        </div>

        {step === 'ante' && (
          <div className={styles.ante}>
            <p className={styles.instructions}>Pick your shot</p>
            <div className={styles.cards}>
              {cards.map((card, i) => (
                <CardView
                  key={`${card.id}-${i}`}
                  card={card}
                  role={role}
                  onClick={() => {
                    setSelectedCard(card);
                    setStep('timing');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'timing' &&
          selectedCard &&
          !reducedMotion &&
          resolvedBand === null && (
            <div className={styles.timing}>
              <p className={styles.instructions}>
                Press Space, Enter, or tap when the indicator is centred
              </p>
              <button
                ref={trackRef}
                type="button"
                className={styles.track}
                onClick={handlePress}
              >
                <span
                  className={styles.blueBand}
                  style={{ width: `${widths.blueWidth * 100}%` }}
                />
                <span
                  className={styles.yellowBand}
                  style={{ width: `${widths.yellowWidth * 100}%` }}
                />
                <span
                  ref={indicatorRef}
                  className={styles.indicator}
                  style={{ animationDuration: `${SWEEP_CYCLE_MS}ms` }}
                />
              </button>
            </div>
          )}

        {step === 'timing' && resolvedBand !== null && (
          <div className={styles.result} role="status">
            <p className={styles.bandLabel}>{bandLabel(resolvedBand)}</p>
            {showResult && result ? (
              <p className={styles.outcome}>{saveResultText(result)}</p>
            ) : (
              <p className={styles.outcome}>Resolving…</p>
            )}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
