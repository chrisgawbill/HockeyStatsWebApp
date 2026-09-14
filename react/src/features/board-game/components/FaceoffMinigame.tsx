import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type {
  CardDef,
  FaceoffBand,
  FaceoffBandWindows,
  FaceoffCardEffect,
  FaceoffDuelResult,
} from '@/features/board-game/types/game';
import {
  bandForReaction,
  rollDropDelayMs,
} from '@/features/board-game/engine/faceoffModel';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import CardView from '@/features/board-game/components/CardView';
import CardBack from '@/features/board-game/components/CardBack';
import ModalOverlay from '@/features/board-game/components/ModalOverlay';
import styles from '@/features/board-game/components/FaceoffMinigame.module.css';

export interface FaceoffMinigameProps {
  /** The 3-4 cards offered for the ante (the C's `PERK_CENTER_FACEOFF_DRAW` widens this to 4); the player picks one. */
  cards: CardDef[];
  /** The CPU centre's already-committed ante card, known the instant the duel is created. Null only if its faceoff pool was exhausted. */
  cpuCard: CardDef | null;
  /** True once this duel has already had one false start - narrows the re-drop's clean window (already folded into `windows`) and drives the "Too early" wording. */
  jumped: boolean;
  /**
   * This duel's reaction windows for the picked card, from
   * `faceoffBandWindowsFor(state)` - null until the ante is picked. Never
   * hardcode window geometry here; these are the only source of truth for
   * where clean/scrum/late fall.
   */
  windows: FaceoffBandWindows | null;
  /** RNG seed for the linesman's hold-length roll only - the real contest roll is entirely the engine's job once a band is reported. */
  seed: number;
  /** Commits the ante pick immediately (`PICK_FACEOFF_CARD`), before any reaction is known. */
  onPickCard: (cardId: string) => void;
  /** Reports the drop's reaction band once known (`RESOLVE_FACEOFF_BAND`) - a real press, or a jump (first jump re-drops, second forfeits; the engine decides which). */
  onResolve: (band: FaceoffBand) => void;
  /** `prefers-reduced-motion`/headless fallback: resolves without a real drop (`AUTO_RESOLVE_FACEOFF`), after the ante is already picked. */
  onAutoResolve: () => void;
}

type Step = 'ante' | 'drop';
type DropPhase = 'held' | 'open';

/**
 * Grace period (ms) past `scrumWindowMs` before an un-pressed drop
 * auto-resolves as `late`, so the modal never hangs open. Dead-man's-switch
 * only - doesn't affect the contest's fairness or difficulty.
 */
const LATE_GRACE_MS = 500;

function bandLabel(band: FaceoffBand): string {
  if (band === 'clean') return 'Clean';
  if (band === 'scrum') return 'Scrum';
  if (band === 'late') return 'Late';
  return 'Jumped';
}

const FACEOFF_EFFECT_LABEL: Record<FaceoffCardEffect, string> = {
  backDraw: 'puck drops back to the point instead of the dot',
  stunLoser: 'the beaten centre is stunned for a turn',
  bonusMp: '+1 MP banked for this turn',
  scrumOnLoss: 'a loss ties up into a scrum instead',
  freeJump: 'no window penalty on the re-drop',
};

function headline(result: FaceoffDuelResult): string {
  if (result.forfeitedByJump) return 'Too early, twice — lost the draw';
  if (result.outcome === 'scrum') return 'Tied up — puck is loose';
  if (result.outcome === 'win') {
    return result.userBand === 'clean' ? 'Won it clean' : 'Won the draw';
  }
  return 'Lost the draw';
}

/** Which card's `faceoffEffect`, if any, actually fired - and whose it was. Null if nothing fired. */
function firedEffect(
  result: FaceoffDuelResult,
  userCard: CardDef | null,
  cpuCard: CardDef | null,
): { owner: 'user' | 'cpu'; card: CardDef } | null {
  if (result.forfeitedByJump) return null;
  if (
    result.outcome === 'win' &&
    result.userBand === 'clean' &&
    userCard?.faceoffEffect
  ) {
    return { owner: 'user', card: userCard };
  }
  if (
    result.outcome === 'loss' &&
    result.cpuBand === 'clean' &&
    cpuCard?.faceoffEffect
  ) {
    return { owner: 'cpu', card: cpuCard };
  }
  if (result.outcome === 'scrum') {
    if (userCard?.faceoffEffect === 'scrumOnLoss')
      return { owner: 'user', card: userCard };
    if (cpuCard?.faceoffEffect === 'scrumOnLoss')
      return { owner: 'cpu', card: cpuCard };
  }
  return null;
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

export interface FaceoffResultSummaryProps {
  result: FaceoffDuelResult;
  /** The user centre's picked card - the caller remembers this from `onPickCard`, since `DuelState` is already cleared by the time a result exists. */
  userCard: CardDef | null;
  /** The CPU centre's ante card, remembered the same way. */
  cpuCard: CardDef | null;
}

/**
 * The faceoff's result narration (band, then clean win / tied up / lost,
 * plus any buff that fired) - meant as `DuelResultBanner`'s `children`, the
 * slot `RevealPanel` fills for other duel kinds. A separate named export
 * because the ante+drop screen unmounts the instant the engine resolves, so
 * this has to live in the component still mounted once a result exists.
 */
export function FaceoffResultSummary({
  result,
  userCard,
  cpuCard,
}: FaceoffResultSummaryProps) {
  const fired = firedEffect(result, userCard, cpuCard);
  return (
    <div className={styles.resultSummary}>
      <p className={styles.headline}>{headline(result)}</p>
      <p className={styles.bandsRow}>
        <span>
          You: <strong>{bandLabel(result.userBand)}</strong>
        </span>
        <span>
          {TEAM_NAME.cpu}: <strong>{bandLabel(result.cpuBand)}</strong>
        </span>
      </p>
      {(userCard || cpuCard) && (
        <div className={styles.resultCards}>
          {userCard && <CardView card={userCard} compact />}
          {cpuCard && <CardView card={cpuCard} compact />}
        </div>
      )}
      {fired && (
        <p className={styles.buffLine}>
          {fired.owner === 'user'
            ? fired.card.name
            : `${TEAM_NAME.cpu}'s ${fired.card.name}`}
          {' fires: '}
          {FACEOFF_EFFECT_LABEL[fired.card.faceoffEffect!]}.
        </p>
      )}
    </div>
  );
}

/**
 * Faceoff ante + drop minigame. Dumb: props in, callbacks out, same pattern
 * as `ShotMinigame`. Never rolls a band itself outside the
 * `prefers-reduced-motion` path, which hands off entirely to the engine's
 * `AUTO_RESOLVE_FACEOFF` rather than sampling a band client-side.
 */
export default function FaceoffMinigame({
  cards,
  cpuCard,
  jumped,
  windows,
  seed,
  onPickCard,
  onResolve,
  onAutoResolve,
}: FaceoffMinigameProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dropButtonRef = useRef<HTMLButtonElement>(null);
  const seedRef = useRef(seed);
  const dropTimeRef = useRef(0);
  const firedRef = useRef(false);
  const titleId = useId();

  const [step, setStep] = useState<Step>('ante');
  const [dropPhase, setDropPhase] = useState<DropPhase>('held');

  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  function finishDrop(band: FaceoffBand) {
    if (firedRef.current) return;
    firedRef.current = true;
    onResolve(band);
  }

  function handlePickCard(card: CardDef) {
    onPickCard(card.id);
    if (reducedMotion) {
      onAutoResolve();
      return;
    }
    setStep('drop');
  }

  // Rolls the hold fresh from the engine on every entry to 'drop', including
  // a re-drop after a jump. Deliberately not tied to a visible countdown -
  // the drop must stay unpredictable.
  useEffect(() => {
    if (step !== 'drop' || reducedMotion) return;
    firedRef.current = false;
    setDropPhase('held');
    const [holdMs, nextSeed] = rollDropDelayMs(seedRef.current);
    seedRef.current = nextSeed;
    const timer = setTimeout(() => {
      dropTimeRef.current = performance.now();
      setDropPhase('open');
    }, holdMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, jumped, reducedMotion]);

  // Dead-man's switch so the modal can't wait forever on a never-pressed drop.
  useEffect(() => {
    if (step !== 'drop' || dropPhase !== 'open' || !windows) return;
    const timer = setTimeout(() => {
      finishDrop('late');
    }, windows.scrumWindowMs + LATE_GRACE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, dropPhase, windows]);

  // Focus management: first playable control for the current step/phase.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const target = dialog.querySelector<HTMLButtonElement>(
      'button:not(:disabled)',
    );
    if (target) target.focus();
    else dialog.focus();
  }, [step, dropPhase]);

  function handlePress() {
    if (step !== 'drop' || reducedMotion) return;
    if (dropPhase === 'held') {
      finishDrop('jump');
      return;
    }
    if (!windows) return;
    const reactionMs = performance.now() - dropTimeRef.current;
    finishDrop(bandForReaction(reactionMs, windows));
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
          Faceoff draw
        </h2>

        <div className={styles.cpuReady} role="status">
          {cpuCard ? (
            <>
              <CardBack />
              <span>{TEAM_NAME.cpu} centre has anted</span>
            </>
          ) : (
            <span>{TEAM_NAME.cpu} centre has nothing to ante</span>
          )}
        </div>

        {step === 'ante' && (
          <div className={styles.ante}>
            <p className={styles.instructions}>Pick your draw</p>
            <div className={styles.cards}>
              {cards.map((card, i) => (
                <CardView
                  key={`${card.id}-${i}`}
                  card={card}
                  onClick={() => handlePickCard(card)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'drop' && !reducedMotion && (
          <div className={styles.drop}>
            {jumped && (
              <p className={styles.jumpWarning} role="alert">
                Too early — re-drop
              </p>
            )}
            <p className={styles.instructions} aria-live="polite">
              {dropPhase === 'held'
                ? 'Linesman is holding the puck — wait for the drop'
                : "Puck's down — react!"}
            </p>
            <button
              ref={dropButtonRef}
              type="button"
              className={[
                styles.dropArea,
                dropPhase === 'held' ? styles.held : styles.open,
              ].join(' ')}
              onClick={handlePress}
            >
              <span className={styles.puckIcon} aria-hidden="true" />
              <span className={styles.dropLabel}>
                {dropPhase === 'held' ? 'Holding…' : 'DROP!'}
              </span>
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
