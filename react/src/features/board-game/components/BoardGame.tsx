import { useEffect, useState } from 'react';
import type {
  Coord,
  GameLength,
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
import { cardBlockReason } from '@/features/board-game/engine/duel';
import { describeOutcome } from '@/features/board-game/utils/describeOutcome';
import { isStunned, sameCoord } from '@/features/board-game/engine/rink';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import RinkBoard from '@/features/board-game/components/RinkBoard';
import SkaterSprite from '@/features/board-game/components/SkaterSprite';
import DiceRoller from '@/features/board-game/components/DiceRoller';
import TurnHud from '@/features/board-game/components/TurnHud';
import GameButton from '@/features/board-game/components/GameButton';
import DuelScreen from '@/features/board-game/components/DuelScreen';
import RevealPanel from '@/features/board-game/components/RevealPanel';
import DuelResultBanner from '@/features/board-game/components/DuelResultBanner';
import GameOverModal from '@/features/board-game/components/GameOverModal';
import styles from '@/features/board-game/components/BoardGamePage.module.css';

type Mode = 'move' | 'pass';

export interface BoardGameProps {
  length: GameLength;
  onChangeLength: () => void;
}

/**
 * Owns one match's `useBoardGame` hook (fresh per mount, i.e. per length
 * pick) and dispatches actions; it computes no rules itself.
 */
export default function BoardGame({ length, onChangeLength }: BoardGameProps) {
  const { state, dispatch, legalSteps, newGame, cpuThinking } = useBoardGame(
    Date.now(),
    length,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('move');

  const isUserTurn = state.activeTeam === 'user';
  const highlighted: Coord[] = selectedId ? legalSteps(selectedId) : [];

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

      {state.phase === 'duel' && state.duel && (
        <DuelScreen
          duel={state.duel}
          deck={state.deck}
          cpuDeck={state.cpuDeck}
          skaters={state.skaters}
          lastReveal={state.lastReveal}
          onPlayCard={(i) => dispatch({ type: 'PLAY_CARD', handIndex: i })}
          onUnqueue={(i) => dispatch({ type: 'UNQUEUE_CARD', queueIndex: i })}
          onEndRound={() => dispatch({ type: 'END_DUEL_ROUND' })}
          blockReason={(i) => cardBlockReason(state, i)}
        />
      )}

      {state.phase === 'duelResult' && state.lastOutcome && (
        <DuelResultBanner
          summary={describeOutcome(state.lastOutcome, state.skaters)}
          onContinue={() => dispatch({ type: 'DISMISS_DUEL_RESULT' })}
        >
          {state.lastReveal && <RevealPanel reveal={state.lastReveal} />}
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
