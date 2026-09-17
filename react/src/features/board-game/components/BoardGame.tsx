import { useEffect, useState } from 'react';
import type {
  Coord,
  DuelOutcome,
  FaceoffBand,
  GameLength,
  Role,
  ShotBand,
  Skater,
} from '@/features/board-game/types/game';
import { useBoardGame } from '@/features/board-game/hooks/useBoardGame';
import {
  canEndTurn,
  canRoll,
  canShoot,
  checkTargets,
  getCarrier,
  passTargets,
} from '@/features/board-game/engine/selectors';
import {
  canUnqueueCard,
  cardBlockReason,
} from '@/features/board-game/engine/duel';
import { faceoffBandWindowsFor } from '@/features/board-game/engine/faceoffDuel';
import { describeOutcome } from '@/features/board-game/utils/describeOutcome';
import { isStunned, sameCoord } from '@/features/board-game/engine/rink';
import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import RinkBoard from '@/features/board-game/components/RinkBoard';
import SkaterSprite from '@/features/board-game/components/SkaterSprite';
import DiceRoller from '@/features/board-game/components/DiceRoller';
import TurnHud from '@/features/board-game/components/TurnHud';
import GameButton from '@/features/board-game/components/GameButton';
import DuelScreen from '@/features/board-game/components/DuelScreen';
import ShotMinigame from '@/features/board-game/components/ShotMinigame';
import FaceoffMinigame, {
  FaceoffResultSummary,
} from '@/features/board-game/components/FaceoffMinigame';
import RevealPanel from '@/features/board-game/components/RevealPanel';
import DuelResultBanner from '@/features/board-game/components/DuelResultBanner';
import GameOverModal from '@/features/board-game/components/GameOverModal';
import styles from '@/features/board-game/components/BoardGamePage.module.css';

type Mode = 'move' | 'pass';

/** The role of `side`'s duelist in `outcome`, looked up via `skaters`. */
function duelistRole(
  outcome: DuelOutcome,
  skaters: Skater[],
  side: 'user' | 'cpu',
): Role | undefined {
  const attackerIsSide =
    skaters.find((s) => s.id === outcome.attackerId)?.team === side;
  const skaterId = attackerIsSide ? outcome.attackerId : outcome.defenderId;
  return skaters.find((s) => s.id === skaterId)?.role;
}

export interface BoardGameProps {
  length: GameLength;
  onChangeLength: () => void;
  /** Google sign-in session token, or `null` when signed out. */
  authToken: string | null;
}

/**
 * Owns one match's `useBoardGame` hook (fresh per mount, i.e. per length
 * pick) and dispatches actions; it computes no rules itself.
 */
export default function BoardGame({
  length,
  onChangeLength,
  authToken,
}: BoardGameProps) {
  const { state, dispatch, legalSteps, newGame, cpuThinking } = useBoardGame(
    Date.now(),
    length,
    authToken,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('move');
  /**
   * The two anted card ids for the most recently resolved faceoff:
   * `DuelState` is already cleared by the time a result exists, so
   * `FaceoffResultSummary` needs its own memory of them. Captured once at
   * the ante pick (`handlePickFaceoffCard`).
   */
  const [faceoffCardIds, setFaceoffCardIds] = useState<{
    user: string;
    cpu: string | null;
  } | null>(null);

  const isUserTurn = state.activeTeam === 'user';
  const highlighted: Coord[] = selectedId ? legalSteps(selectedId) : [];

  const showMoveCue =
    isUserTurn &&
    mode === 'move' &&
    selectedId === null &&
    !cpuThinking &&
    state.skaters.some((s) => s.team === 'user' && legalSteps(s.id).length > 0);

  const rollEnabled = canRoll(state) && isUserTurn;
  const endTurnEnabled = canEndTurn(state) && isUserTurn;
  const shootEnabled = canShoot(state) && isUserTurn;
  const targets = isUserTurn ? passTargets(state) : [];
  const passEnabled = targets.length > 0;

  const carrier = getCarrier(state);
  const possession = carrier
    ? `${TEAM_NAME[carrier.team]} ${carrier.role} has the puck`
    : 'Loose puck';

  useEffect(() => {
    setSelectedId(null);
    setMode('move');
  }, [state.phase, state.activeTeam]);

  useEffect(() => {
    if (mode !== 'pass') return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMode('move');
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mode]);

  function handleRoll() {
    if (!rollEnabled) return;
    dispatch({ type: 'ROLL_DICE' });
  }

  function handleTileClick(coord: Coord) {
    if (!isUserTurn || mode !== 'move' || !selectedId) return;
    if (!highlighted.some((c) => sameCoord(c, coord))) return;
    dispatch({ type: 'MOVE', skaterId: selectedId, to: coord });
  }

  function handleSkaterClick(id: string) {
    if (!isUserTurn) return;
    const skater = state.skaters.find((s) => s.id === id);
    if (!skater) return;

    if (mode === 'pass') {
      if (targets.includes(id)) {
        dispatch({ type: 'PASS', toSkaterId: id });
        setMode('move');
      }
      return;
    }

    if (skater.team === state.activeTeam) {
      setSelectedId(id);
      return;
    }

    if (
      selectedId &&
      id === getCarrier(state)?.id &&
      checkTargets(state, selectedId)
    ) {
      dispatch({ type: 'CHECK', skaterId: selectedId });
    }
  }

  function handlePass() {
    if (!isUserTurn) return;
    setMode((m) => (m === 'pass' ? 'move' : passEnabled ? 'pass' : m));
  }

  function handleShoot() {
    if (!shootEnabled) return;
    dispatch({ type: 'SHOOT' });
  }

  function handleEndTurn() {
    if (!endTurnEnabled) return;
    dispatch({ type: 'END_TURN' });
  }

  /**
   * `ShotMinigame` reports pick and band together; the reducer wants them as
   * two actions, dispatched here. Never also dispatch `AUTO_RESOLVE_SHOT` -
   * the component's reduced-motion path already reports through this same
   * callback, so that would double-resolve the shot.
   */
  function handleResolveShot(cardId: string, band: ShotBand) {
    const handIndex = state.deck.hand.indexOf(cardId);
    if (handIndex === -1) return;
    dispatch({ type: 'PICK_SHOT_CARD', handIndex });
    dispatch({ type: 'RESOLVE_SHOT_BAND', band });
  }

  /**
   * `FaceoffMinigame` reports the ante pick and the drop's reaction as two
   * separate calls (unlike `ShotMinigame`'s single `onResolve`): the pick
   * must dispatch first because `faceoffBandWindowsFor(state)` needs
   * `duel.faceoffPickedCardId` set before it can return real window geometry
   * for the drop step to render.
   */
  function handlePickFaceoffCard(cardId: string) {
    const handIndex = state.deck.hand.indexOf(cardId);
    if (handIndex === -1) return;
    setFaceoffCardIds({
      user: cardId,
      cpu:
        state.duel && state.duel.kind === 'faceoff'
          ? state.duel.faceoffCpuCardId
          : null,
    });
    dispatch({ type: 'PICK_FACEOFF_CARD', handIndex });
  }

  function handleResolveFaceoffBand(band: FaceoffBand) {
    dispatch({ type: 'RESOLVE_FACEOFF_BAND', band });
  }

  function handleAutoResolveFaceoff() {
    dispatch({ type: 'AUTO_RESOLVE_FACEOFF' });
  }

  function renderSkater(skater: Skater) {
    const hasPuck =
      state.puck.kind === 'carried' && state.puck.skaterId === skater.id;
    return (
      <SkaterSprite
        skater={skater}
        hasPuck={hasPuck}
        selected={skater.id === selectedId}
        stunned={isStunned(skater, state.turn)}
        moving={false}
        movable={
          showMoveCue &&
          skater.team === 'user' &&
          legalSteps(skater.id).length > 0
        }
      />
    );
  }

  return (
    <>
      {state.phase === 'faceoff' && (
        <>
          {state.whistle && (
            <p role="status" className={styles.whistle}>
              Whistle! The puck was frozen — back to center ice for a faceoff.
            </p>
          )}
          <GameButton
            onClick={() => dispatch({ type: 'START_FACEOFF' })}
            variant="primary"
          >
            Drop the puck
          </GameButton>
        </>
      )}

      {(state.phase === 'roll' || state.phase === 'move') && (
        <>
          <DiceRoller
            dice={state.dice}
            canRoll={rollEnabled}
            onRoll={handleRoll}
          />
          <TurnHud
            activeTeam={state.activeTeam}
            length={state.length}
            possession={possession}
            mp={state.mp}
            canPass={passEnabled}
            canShoot={shootEnabled}
            canEnd={endTurnEnabled}
            onPass={handlePass}
            onShoot={handleShoot}
            onEndTurn={handleEndTurn}
          />
          {cpuThinking && (
            <p role="status" className={styles.hint}>
              {TEAM_NAME.cpu} is thinking…
            </p>
          )}
          {mode === 'pass' && (
            <p className={styles.hint}>
              Choose a teammate to pass to, or press Pass again (or Escape) to
              cancel.
            </p>
          )}
          {showMoveCue && (
            <p className={styles.hint}>
              Select one of your blue players to move.
            </p>
          )}
        </>
      )}

      <RinkBoard
        skaters={state.skaters}
        puck={state.puck}
        highlighted={highlighted}
        selectedId={selectedId}
        onTileClick={handleTileClick}
        onSkaterClick={handleSkaterClick}
        renderSkater={renderSkater}
      />

      {state.phase === 'duel' && state.duel && state.duel.kind === 'shot' && (
        <ShotMinigame
          cards={state.deck.hand.map((id) => CARDS[id])}
          role={
            state.skaters.find((s) => s.id === state.duel!.attacker.skaterId)!
              .role
          }
          goaliePoise={
            state.goaliePoise[
              state.skaters.find((s) => s.id === state.duel!.defender.skaterId)!
                .team
            ]
          }
          goalieMaxPoise={GOALIE_POISE_BY_LENGTH[state.length]}
          seed={state.rngSeed}
          result={state.lastShotSaveResult}
          onResolve={handleResolveShot}
        />
      )}

      {state.phase === 'duel' &&
        state.duel &&
        state.duel.kind === 'faceoff' && (
          <FaceoffMinigame
            cards={state.deck.hand.map((id) => CARDS[id])}
            cpuCard={
              state.duel.faceoffCpuCardId
                ? CARDS[state.duel.faceoffCpuCardId]
                : null
            }
            jumped={state.duel.faceoffJumped}
            windows={faceoffBandWindowsFor(state)}
            seed={state.rngSeed}
            onPickCard={handlePickFaceoffCard}
            onResolve={handleResolveFaceoffBand}
            onAutoResolve={handleAutoResolveFaceoff}
          />
        )}

      {state.phase === 'duel' &&
        state.duel &&
        state.duel.kind !== 'shot' &&
        state.duel.kind !== 'faceoff' && (
          <DuelScreen
            duel={state.duel}
            deck={state.deck}
            skaters={state.skaters}
            lastReveal={state.lastReveal}
            onPlayCard={(i) => dispatch({ type: 'PLAY_CARD', handIndex: i })}
            onUnqueue={(i) => dispatch({ type: 'UNQUEUE_CARD', queueIndex: i })}
            onEndRound={() => dispatch({ type: 'END_DUEL_ROUND' })}
            blockReason={(i) => cardBlockReason(state, i)}
            canUnqueue={(i) => canUnqueueCard(state, i)}
            bonusEnergy={state.bonusEnergy}
          />
        )}

      {state.phase === 'duelResult' && state.lastOutcome && (
        <DuelResultBanner
          summary={describeOutcome(state.lastOutcome, state.skaters)}
          onContinue={() => dispatch({ type: 'DISMISS_DUEL_RESULT' })}
        >
          {state.lastOutcome.kind === 'faceoff' && state.lastFaceoffResult && (
            <FaceoffResultSummary
              result={state.lastFaceoffResult}
              userCard={faceoffCardIds ? CARDS[faceoffCardIds.user] : null}
              cpuCard={faceoffCardIds?.cpu ? CARDS[faceoffCardIds.cpu] : null}
            />
          )}
          {state.lastReveal && (
            <RevealPanel
              reveal={state.lastReveal}
              userRole={duelistRole(state.lastOutcome, state.skaters, 'user')}
              cpuRole={duelistRole(state.lastOutcome, state.skaters, 'cpu')}
            />
          )}
        </DuelResultBanner>
      )}

      {state.phase === 'gameOver' && state.winner && (
        <GameOverModal
          winner={state.winner}
          onPlayAgain={newGame}
          onChangeLength={onChangeLength}
        />
      )}
    </>
  );
}
