import { describe, expect, it } from 'vitest';
import { createDuel, resolveDuel } from '@/features/board-game/engine/duel';
import { gameReducer } from '@/features/board-game/engine/gameReducer';
import {
  canClearCrease,
  canSetScreen,
} from '@/features/board-game/engine/selectors';
import { isDrawEligibleCard } from '@/features/board-game/engine/duelShared';
import { CARDS } from '@/features/board-game/data/cards';
import type { GameState } from '@/features/board-game/types/game';
import { makeMoveState } from '@/test/fixtures/boardScenarios';

function userScreenState() {
  const initial = makeMoveState({
    skaters: [
      {
        id: 'user-C',
        team: 'user',
        role: 'C',
        pos: { col: 11, row: 4 },
        stunned: false,
      },
      {
        id: 'user-LW',
        team: 'user',
        role: 'LW',
        pos: { col: 13, row: 2 },
        stunned: false,
      },
      {
        id: 'user-LD',
        team: 'user',
        role: 'LD',
        pos: { col: 2, row: 3 },
        stunned: false,
      },
      {
        id: 'cpu-LD',
        team: 'cpu',
        role: 'LD',
        pos: { col: 12, row: 1 },
        stunned: false,
      },
      {
        id: 'cpu-RD',
        team: 'cpu',
        role: 'RD',
        pos: { col: 12, row: 3 },
        stunned: false,
      },
      {
        id: 'cpu-C',
        team: 'cpu',
        role: 'C',
        pos: { col: 4, row: 3 },
        stunned: false,
      },
      {
        id: 'cpu-RW',
        team: 'cpu',
        role: 'RW',
        pos: { col: 4, row: 2 },
        stunned: false,
      },
      {
        id: 'user-RW',
        team: 'user',
        role: 'RW',
        pos: { col: 7, row: 3 },
        stunned: false,
      },
    ],
    puck: { kind: 'carried', skaterId: 'user-C' },
  });
  return {
    ...initial,
    screen: { screenerId: 'user-LW', team: 'user' as const },
  };
}

function cpuScreenState() {
  const state = userScreenState();
  return {
    ...state,
    activeTeam: 'cpu' as const,
    skaters: state.skaters.map((skater) =>
      skater.id === 'cpu-C'
        ? { ...skater, pos: { col: 3, row: 3 } }
        : skater.id === 'cpu-RW'
          ? { ...skater, pos: { col: 1, row: 4 } }
          : skater,
    ),
    puck: { kind: 'carried' as const, skaterId: 'cpu-C' },
    screen: null,
  };
}

describe('net-front screens', () => {
  it('sets screens symmetrically and spends the forward activation', () => {
    const user = userScreenState();
    expect(canSetScreen({ ...user, screen: null }, 'user-LW')).toBe(true);
    const set = gameReducer(
      { ...user, screen: null },
      {
        type: 'SET_SCREEN',
        skaterId: 'user-LW',
      },
    );
    expect(set.screen).toEqual({ screenerId: 'user-LW', team: 'user' });
    expect(set.activatedSkaterIds).toContain('user-LW');
    expect(set.activeTeam).toBe('cpu');

    const cpu = cpuScreenState();
    expect(canSetScreen(cpu, 'cpu-RW')).toBe(true);
    const cpuSet = gameReducer(cpu, { type: 'SET_SCREEN', skaterId: 'cpu-RW' });
    expect(cpuSet.screen).toEqual({ screenerId: 'cpu-RW', team: 'cpu' });
    expect(cpuSet.activatedSkaterIds).toContain('cpu-RW');
  });

  it('rejects a stacked, misplaced, ineligible, stunned, or spent screen action', () => {
    const state = { ...userScreenState(), screen: null };
    expect(canSetScreen(state, 'cpu-LD')).toBe(false);
    expect(
      canSetScreen(
        { ...state, puck: { kind: 'loose', pos: { col: 11, row: 4 } } },
        'user-LW',
      ),
    ).toBe(false);
    expect(
      canSetScreen(
        { ...state, puck: { kind: 'carried', skaterId: 'cpu-C' } },
        'user-LW',
      ),
    ).toBe(false);
    expect(
      canSetScreen(
        {
          ...state,
          skaters: state.skaters.map((s) =>
            s.id === 'user-LW' ? { ...s, pos: { col: 12, row: 2 } } : s,
          ),
        },
        'user-LW',
      ),
    ).toBe(false);
    expect(
      canSetScreen(
        {
          ...state,
          skaters: state.skaters.map((s) =>
            s.id === 'user-LW' ? { ...s, stunned: true } : s,
          ),
        },
        'user-LW',
      ),
    ).toBe(false);
    expect(
      canSetScreen({ ...state, activatedSkaterIds: ['user-LW'] }, 'user-LW'),
    ).toBe(false);
    expect(
      canSetScreen(
        { ...state, screen: { screenerId: 'user-C', team: 'user' } },
        'user-LW',
      ),
    ).toBe(false);
  });

  it('offers contextual net-front cards to the screener and clearer; timeout holds the screen', () => {
    const state = { ...userScreenState(), activeTeam: 'cpu' as const };
    expect(canClearCrease(state, 'cpu-LD')).toBe(true);
    const duelState = gameReducer(state, {
      type: 'CLEAR_CREASE',
      skaterId: 'cpu-LD',
    });
    expect(duelState.duel?.kind).toBe('netFront');
    expect(duelState.activeSkaterId).toBe('cpu-LD');
    const duel = duelState.duel!;
    expect(duel.userSide).toBe('defender');
    expect(
      duelState.deck.hand.every((id) =>
        isDrawEligibleCard(duel, 'defender', id),
      ),
    ).toBe(true);
    expect(
      duelState.cpuDeck.hand.every((id) =>
        isDrawEligibleCard(duel, 'attacker', id),
      ),
    ).toBe(true);
    expect(
      Object.values(CARDS).filter((card) =>
        card.allowedIn.netFront?.includes('possession'),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      Object.values(CARDS).filter((card) =>
        card.allowedIn.netFront?.includes('challenger'),
      ).length,
    ).toBeGreaterThan(0);

    let timedOut: GameState = {
      ...duelState,
      duel: {
        ...duel,
        attacker: { ...duel.attacker, poise: 1000, maxPoise: 1000 },
        defender: { ...duel.defender, poise: 1000, maxPoise: 1000 },
      },
    };
    for (let round = 0; round < 3; round++)
      timedOut = gameReducer(timedOut, { type: 'END_DUEL_ROUND' });
    expect(timedOut.lastOutcome?.winner).toBe('defender');
    expect(timedOut.screen).toEqual(state.screen);
    expect(timedOut.puck).toEqual(state.puck);

    const cpuScreen = cpuScreenState();
    const mirrored = {
      ...cpuScreen,
      activeTeam: 'user' as const,
      screen: { screenerId: 'cpu-RW', team: 'cpu' as const },
      skaters: cpuScreen.skaters.map((skater) =>
        skater.id === 'user-LD'
          ? { ...skater, pos: { col: 2, row: 3 } }
          : skater,
      ),
    };
    expect(canClearCrease(mirrored, 'user-LD')).toBe(true);
    expect(
      gameReducer(mirrored, { type: 'CLEAR_CREASE', skaterId: 'user-LD' }).duel
        ?.kind,
    ).toBe('netFront');
  });

  it('clears without transferring possession and expires when the screener moves or receives a pass', () => {
    const state = userScreenState();
    const battle = createDuel(
      { ...state, activeSkaterId: 'cpu-LD' },
      'netFront',
      'cpu-LD',
      'user-LW',
    );
    const cleared = resolveDuel(battle, 'attacker', true);
    expect(cleared.screen).toBeNull();
    expect(cleared.puck).toEqual(state.puck);

    const moved = gameReducer(
      { ...state, activeTeam: 'user', activeSkaterId: 'user-LW' },
      { type: 'MOVE', skaterId: 'user-LW', to: { col: 12, row: 2 } },
    );
    expect(moved.screen).toBeNull();

    const passToScreener = {
      ...state,
      skaters: state.skaters.map((skater) =>
        skater.id === 'cpu-LD' || skater.id === 'cpu-RD'
          ? { ...skater, pos: { col: 4, row: skater.id === 'cpu-LD' ? 1 : 5 } }
          : skater,
      ),
    };
    const received = gameReducer(passToScreener, {
      type: 'PASS',
      toSkaterId: 'user-LW',
    });
    expect(received.screen).toBeNull();
  });

  it('expires after turnovers, offensive-zone exit, and a whistle', () => {
    const state = userScreenState();
    const check = createDuel(state, 'check', 'cpu-LD', 'user-C');
    const turnover = resolveDuel(check, 'attacker', false);
    expect(turnover.puck).toEqual({ kind: 'carried', skaterId: 'cpu-LD' });
    expect(turnover.screen).toBeNull();

    const passState = {
      ...state,
      skaters: state.skaters.map((skater) =>
        skater.id === 'cpu-LD' || skater.id === 'cpu-RD'
          ? { ...skater, pos: { col: 4, row: skater.id === 'cpu-LD' ? 1 : 5 } }
          : skater.id === 'user-RW'
            ? { ...skater, pos: { col: 7, row: 4 } }
            : skater,
      ),
    };
    const exited = gameReducer(passState, {
      type: 'PASS',
      toSkaterId: 'user-RW',
    });
    expect(exited.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });
    expect(exited.screen).toBeNull();

    const whistle = gameReducer(
      {
        ...state,
        phase: 'duelResult',
        lastOutcome: {
          kind: 'shot',
          winner: 'defender',
          byKo: false,
          attackerId: 'user-C',
          defenderId: 'cpu-G',
          goal: false,
          cleanSave: false,
          summary: 'saved',
          receiverId: null,
        },
        lastShotSaveResult: {
          band: 'perfect',
          saved: true,
          saveChance: 20,
          screenPenalty: 5,
          poiseDrain: 1,
          freeze: false,
          rebound: false,
          covered: true,
        },
        skaters: [
          ...state.skaters,
          {
            id: 'cpu-G',
            team: 'cpu',
            role: 'G',
            pos: { col: 14, row: 3 },
            stunned: false,
          },
        ],
      },
      { type: 'DISMISS_DUEL_RESULT' },
    );
    expect(whistle.phase).toBe('faceoff');
    expect(whistle.screen).toBeNull();
  });
});
