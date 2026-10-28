import { ENERGY } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import {
  describeCpuIntent,
  planCards,
  planCpuCards,
} from '@/features/board-game/engine/cpuDuelPolicy';
import type { DuelState } from '@/features/board-game/types/game';
import { makeDuel, makeReveal, makeState } from '@/test/fixtures/cpuDuelPolicy';
import { describe, expect, it } from 'vitest';

/** A check where the CPU is the checker (challenging side) and the user LD carries the puck. */
function makeCpuCheckingDuel(overrides: Partial<DuelState> = {}) {
  return makeDuel({
    userSide: 'defender',
    attacker: { skaterId: 'cpu-C', poise: 20, maxPoise: 20, block: 0 },
    defender: { skaterId: 'user-LD', poise: 20, maxPoise: 20, block: 0 },
    ...overrides,
  });
}

describe('planCpuCards', () => {
  it('plans nothing without a duel, filters by duel kind, and fills energy greedily', () => {
    const state = makeState([], makeDuel());
    expect(planCpuCards({ ...state, duel: null })).toEqual([]);

    // Excludes cards not allowed for its side of this duel kind.
    {
      // The CPU carries the puck in this check: wrist_shot is shot-only and
      // poke_check is for the checker, so only protect_puck is legal.
      const duel = makeDuel({ kind: 'check' });
      const state = makeState(
        ['wrist_shot', 'poke_check', 'protect_puck'],
        duel,
      );
      expect(planCpuCards(state)).toEqual(['protect_puck']);
    }

    // Greedily fills the energy budget by value-per-energy, ties broken by hand order.
    {
      // As the checker: poke_check 5dmg/1energy=5 twice (tied, hand order), body_check 9dmg/2energy=4.5.
      const duel = makeCpuCheckingDuel();
      const state = makeState(['body_check', 'poke_check', 'poke_check'], duel);
      const plan = planCpuCards(state);
      // Both poke checks first, then body_check no longer fits the remaining energy.
      expect(plan).toEqual(['poke_check', 'poke_check']);
    }
  });

  it('prefers block when the user could KO again, else damage first', () => {
    const duel = makeDuel({
      defender: { skaterId: 'cpu-C', poise: 5, maxPoise: 20, block: 0 },
    });
    // last round's reveal shows the user dealt 10, which is >= the CPU's current poise (5) -> prefer block.
    const state = makeState(
      ['stickhandle', 'protect_puck'],
      duel,
      'C',
      makeReveal(10),
    );
    const plan = planCpuCards(state);
    expect(plan[0]).toBe('protect_puck');

    // Defaults to damage-first when there is no prior-round reveal (e.g. round 1).
    {
      const duel = makeDuel();
      const state = makeState(['protect_puck', 'stickhandle'], duel);
      const plan = planCpuCards(state);
      expect(plan[0]).toBe('stickhandle');
    }
  });

  it('applies role perks and uses the base energy budget', () => {
    const duel = makeCpuCheckingDuel();
    const state = makeState(['body_check'], duel, 'LD');
    const plan = planCpuCards(state);
    expect(plan).toEqual(['body_check']);

    // Plans CPU cards with the base energy budget even when the user has bonus energy.
    {
      const duel = makeCpuCheckingDuel({ energy: ENERGY + 1 });
      const state = {
        ...makeState(['body_check', 'body_check'], duel),
        bonusEnergy: 1,
      };

      const plan = planCpuCards(state);
      const totalCost = plan.reduce((sum, id) => sum + CARDS[id].cost, 0);

      expect(plan).toEqual(['body_check']);
      expect(totalCost).toBeLessThanOrEqual(ENERGY);
    }
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

describe('describeCpuIntent', () => {
  it('bands the committed share of base energy without revealing cards', () => {
    expect(describeCpuIntent([])).toBe('Conservative');
    expect(describeCpuIntent(['shield_the_puck'])).toBe('Conservative');
    expect(describeCpuIntent(['poke_check'])).toBe('Balanced');
    expect(describeCpuIntent(['body_check'])).toBe('Aggressive');
    expect(describeCpuIntent(['poke_check', 'body_check'])).toBe(
      'Heavy Commitment',
    );
  });
});
