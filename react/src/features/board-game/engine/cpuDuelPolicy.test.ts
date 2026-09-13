import { describe, expect, it } from 'vitest';
import {
  planCards,
  planCpuCards,
} from '@/features/board-game/engine/cpuDuelPolicy';
import { CARDS } from '@/features/board-game/data/cards';
import type {
  DuelState,
  GameState,
  RevealResult,
  Role,
  Skater,
} from '@/features/board-game/types/game';

function makeSkater(
  id: string,
  role: Role,
  team: 'user' | 'cpu' = 'cpu',
): Skater {
  return { id, team, role, pos: { col: 0, row: 0 }, stunnedUntilTurn: null };
}

function makeDuel(overrides: Partial<DuelState> = {}): DuelState {
  return {
    kind: 'check',
    attacker: { skaterId: 'user-LD', poise: 20, maxPoise: 20, block: 0 },
    defender: { skaterId: 'cpu-C', poise: 20, maxPoise: 20, block: 0 },
    userSide: 'attacker',
    round: 1,
    energy: 3,
    cpuPlan: [],
    userQueue: [],
    queueDraws: [],
    receiverId: null,
    shotPickedCardId: null,
    ...overrides,
  };
}

function makeState(
  cpuHand: string[],
  duel: DuelState,
  cpuRole: Role = 'C',
  lastReveal: RevealResult | null = null,
  userHand: string[] = [],
): GameState {
  return {
    phase: 'duel',
    length: 'long',
    activeTeam: 'user',
    turn: 1,
    mp: 0,
    dice: null,
    skaters: [
      makeSkater('user-LD', 'LD', 'user'),
      makeSkater('cpu-C', cpuRole, 'cpu'),
    ],
    puck: { kind: 'carried', skaterId: 'user-LD' },
    deck: { drawPile: [], hand: userHand, discardPile: [], exhaustPile: [] },
    cpuDeck: { drawPile: [], hand: cpuHand, discardPile: [], exhaustPile: [] },
    duel,
    lastOutcome: null,
    lastReveal,
    lastShotSaveResult: null,
    winner: null,
    rngSeed: 1,
    actionsThisTurn: 0,
    whistle: false,
    goaliePoise: { user: 43, cpu: 43 },
  };
}

function makeReveal(userDamageDealt: number): RevealResult {
  return {
    round: 1,
    userCards: [],
    cpuCards: [],
    userDamageDealt,
    cpuDamageDealt: 0,
    userBlock: 0,
    cpuBlock: 0,
  };
}

describe('planCpuCards', () => {
  it('returns an empty plan when there is no active duel', () => {
    const state = makeState([], makeDuel());
    expect(planCpuCards({ ...state, duel: null })).toEqual([]);
  });

  it('excludes cards not allowed in this duel kind', () => {
    // check duel: wrist_shot is shot-only and must be excluded even though it's cheap and strong.
    const duel = makeDuel({ kind: 'check' });
    const state = makeState(['wrist_shot', 'poke_check'], duel);
    const plan = planCpuCards(state);
    expect(plan).not.toContain('wrist_shot');
    expect(plan).toContain('poke_check');
  });

  it('greedily fills the energy budget by value-per-energy, ties broken by hand order', () => {
    // deke: 6dmg/1energy=6. toe_drag: 10dmg/2energy=5. poke_check: 5dmg/1energy=5 (tied with toe_drag, later in hand).
    const duel = makeDuel({ kind: 'check' });
    const state = makeState(['toe_drag', 'deke', 'poke_check'], duel);
    const plan = planCpuCards(state);
    // deke first (best ratio), then toe_drag (ties poke_check on ratio but comes first in hand); energy(3) then exhausted.
    expect(plan).toEqual(['deke', 'toe_drag']);
  });

  it('prefers block cards over higher-value damage cards when the user could KO the CPU again', () => {
    const duel = makeDuel({
      defender: { skaterId: 'cpu-C', poise: 5, maxPoise: 20, block: 0 },
    });
    // last round's reveal shows the user dealt 10, which is >= the CPU's current poise (5) -> prefer block.
    const state = makeState(
      ['deke', 'protect_puck'],
      duel,
      'C',
      makeReveal(10),
    );
    const plan = planCpuCards(state);
    expect(plan[0]).toBe('protect_puck');
  });

  it('defaults to damage-first when there is no prior-round reveal (e.g. round 1)', () => {
    const duel = makeDuel();
    const state = makeState(['protect_puck', 'deke'], duel);
    const plan = planCpuCards(state);
    expect(plan[0]).toBe('deke');
  });

  it("applies the LD/RD perk to a check-tagged card's value", () => {
    const duel = makeDuel();
    const state = makeState(['body_check'], duel, 'LD');
    const plan = planCpuCards(state);
    expect(plan).toEqual(['body_check']);
  });
});

describe('planCards(state, "user")', () => {
  it('returns ids from the user hand within energy', () => {
    const duel = makeDuel({ energy: 3 });
    const state = makeState([], duel, 'C', null, [
      'toe_drag',
      'deke',
      'poke_check',
    ]);
    const plan = planCards(state, 'user');
    expect(plan.length).toBeGreaterThan(0);
    for (const id of plan) expect(state.deck.hand).toContain(id);
    const totalCost = plan.reduce((sum, id) => sum + CARDS[id].cost, 0);
    expect(totalCost).toBeLessThanOrEqual(duel.energy);
  });
});
