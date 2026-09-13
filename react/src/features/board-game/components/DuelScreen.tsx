import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import type {
  CardBlockReason,
  Deck,
  DuelState,
  Duelist,
  Skater,
} from '@/features/board-game/types/game';
import { CARDS } from '@/features/board-game/data/cards';
import { ENERGY, MAX_ROUNDS } from '@/features/board-game/data/balance';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import SkaterSprite from '@/features/board-game/components/SkaterSprite';
import CardView from '@/features/board-game/components/CardView';
import CardBack from '@/features/board-game/components/CardBack';
import GameButton from '@/features/board-game/components/GameButton';
import ModalOverlay from '@/features/board-game/components/ModalOverlay';
import RevealPanel, {
  type Reveal,
} from '@/features/board-game/components/RevealPanel';
import styles from '@/features/board-game/components/DuelScreen.module.css';

export interface DuelScreenProps {
  duel: DuelState;
  deck: Deck;
  cpuDeck: Deck;
  skaters: Skater[];
  lastReveal: Reveal | null;
  onPlayCard: (handIndex: number) => void;
  onUnqueue: (queueIndex: number) => void;
  onEndRound: () => void;
  blockReason: (handIndex: number) => CardBlockReason | null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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

function skaterLabel(skater: Skater | undefined): string {
  return skater ? `${TEAM_NAME[skater.team]} ${skater.role}` : 'Unknown';
}

function DuelistPanel({
  duelist,
  skater,
  cpuPlan,
}: {
  duelist: Duelist;
  skater: Skater | undefined;
  cpuPlan: string[] | null;
}) {
  const label = skaterLabel(skater);
  return (
    <div className={styles.panel}>
      <div className={styles.sprite}>
        {skater && (
          <SkaterSprite
            skater={skater}
            hasPuck={false}
            selected={false}
            stunned={false}
            moving={false}
          />
        )}
      </div>
      <span className={styles.panelLabel}>{label}</span>
      <progress
        className={styles.poiseBar}
        value={duelist.poise}
        max={duelist.maxPoise}
        aria-label={`${label} poise`}
      />
      {duelist.block > 0 && (
        <span className={styles.blockBadge}>🛡 {duelist.block}</span>
      )}
      {cpuPlan && (
        <div className={styles.plan}>
          <span className={styles.planLabel}>
            {TEAM_NAME.cpu} has {cpuPlan.length} card(s) ready
          </span>
          {cpuPlan.length > 0 && (
            <div className={styles.planCards}>
              {Array.from({ length: cpuPlan.length }, (_, i) => (
                <CardBack key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Slay-the-Spire-style card duel overlay. Dumb: props in, callbacks out. */
export default function DuelScreen({
  duel,
  deck,
  cpuDeck,
  skaters,
  lastReveal,
  onPlayCard,
  onUnqueue,
  onEndRound,
  blockReason,
}: DuelScreenProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const revealButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const attackerSkater = skaters.find((s) => s.id === duel.attacker.skaterId);
  const defenderSkater = skaters.find((s) => s.id === duel.defender.skaterId);
  const cpuSide = duel.userSide === 'attacker' ? 'defender' : 'attacker';

  const title = `${capitalize(duel.kind)} — ${skaterLabel(attackerSkater)} vs ${skaterLabel(defenderSkater)}`;

  const showReveal = lastReveal !== null && lastReveal.round === duel.round - 1;

  // Keeps focus inside the dialog after a card queues/unqueues (its button
  // unmounts) or a new round starts: first playable hand card, else the
  // first queued card, else the Reveal button.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handSelector = `.${styles.hand} button:not(:disabled)`;
    const queueSelector = `.${styles.queueCards} button:not(:disabled)`;
    const target =
      dialog.querySelector<HTMLButtonElement>(handSelector) ??
      dialog.querySelector<HTMLButtonElement>(queueSelector) ??
      revealButtonRef.current;
    if (target) {
      target.focus();
    } else {
      dialog.focus();
    }
  }, [duel.round, duel.userQueue.length, deck.hand.length]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (isTypingTarget(e.target)) return;

    if (e.key === 'Tab') {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
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
      return;
    }

    if (e.code === 'KeyE') {
      onEndRound();
      return;
    }

    const digitMatch = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (digitMatch) {
      const index = Number(digitMatch[1]) - 1;
      if (e.shiftKey) {
        if (index < duel.userQueue.length) {
          onUnqueue(index);
        }
      } else if (index < deck.hand.length && blockReason(index) === null) {
        onPlayCard(index);
      }
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
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>

        <div className={styles.scrollArea}>
          <div className={styles.duelists}>
            <DuelistPanel
              duelist={duel.attacker}
              skater={attackerSkater}
              cpuPlan={cpuSide === 'attacker' ? duel.cpuPlan : null}
            />
            <DuelistPanel
              duelist={duel.defender}
              skater={defenderSkater}
              cpuPlan={cpuSide === 'defender' ? duel.cpuPlan : null}
            />
          </div>

          {showReveal && lastReveal && <RevealPanel reveal={lastReveal} />}

          <div className={styles.meta}>
            <div className={styles.metaTop}>
              <span>
                Round {duel.round}/{MAX_ROUNDS}
              </span>
              <span
                className={styles.energy}
                role="img"
                aria-label={`${duel.energy} of ${ENERGY} energy`}
              >
                {Array.from({ length: ENERGY }, (_, i) => (
                  <span
                    key={i}
                    className={i < duel.energy ? styles.orbFull : styles.orb}
                  />
                ))}
              </span>
            </div>
            <div className={styles.metaPiles}>
              <span>
                {TEAM_NAME.user} draw {deck.drawPile.length} / discard{' '}
                {deck.discardPile.length}
              </span>
              <span>
                {TEAM_NAME.cpu} draw {cpuDeck.drawPile.length} / discard{' '}
                {cpuDeck.discardPile.length}
              </span>
            </div>
          </div>

          <div className={styles.queue}>
            <span className={styles.queueLabel}>Your play</span>
            {duel.userQueue.length === 0 ? (
              <span className={styles.queueEmpty}>
                Queue cards, then End Round to reveal
              </span>
            ) : (
              <div className={styles.queueCards}>
                {duel.userQueue.map((id, i) => (
                  <CardView
                    key={`${id}-${i}`}
                    card={CARDS[id]}
                    disabled={false}
                    onClick={() => onUnqueue(i)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.hand}>
            {deck.hand.map((id, i) => {
              const reason = blockReason(i);
              return (
                <CardView
                  key={`${id}-${i}`}
                  card={CARDS[id]}
                  disabled={reason !== null}
                  blockReason={reason}
                  energy={duel.energy}
                  onClick={() => onPlayCard(i)}
                />
              );
            })}
          </div>
        </div>

        <GameButton
          ref={revealButtonRef}
          onClick={onEndRound}
          variant="primary"
        >
          Reveal (E)
        </GameButton>
      </div>
    </ModalOverlay>
  );
}
