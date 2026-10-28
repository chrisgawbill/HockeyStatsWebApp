import { ENERGY } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import {
  planCards,
  planCpuCards,
} from '@/features/board-game/engine/cpuDuelPolicy';
import { makeDuel, makeReveal, makeState } from '@/test/fixtures/cpuDuelPolicy';
import { describe, expect, it } from 'vitest';

describe('planCpuCards', () => {
  it('plans nothing without a duel, filters by duel kind, and fills energy greedily', () => {
    const state = makeState([], makeDuel());
    expect(planCpuCards({ ...state, duel: null })).toEqual([]);

    // Excludes cards not allowed in this duel kind.
    {
      // check duel: wrist_shot is shot-only and must be excluded even though it's cheap and strong.
      const duel = makeDuel({ kind: 'check' });
      const state = makeState(['wrist_shot', 'poke_check'], duel);
      const plan = planCpuCards(state);
      expect(plan).not.toContain('wrist_shot');
      expect(plan).toContain('poke_check');
    }

    // Greedily fills the energy budget by value-per-energy, ties broken by hand order.
    {
      // deke: 6dmg/1energy=6. toe_drag: 10dmg/2energy=5. poke_check: 5dmg/1energy=5 (tied with toe_drag, later in hand).
      const duel = makeDuel({ kind: 'check' });
      const state = makeState(['toe_drag', 'deke', 'poke_check'], duel);
      const plan = planCpuCards(state);
      // deke first (best ratio), then toe_drag (ties poke_check on ratio but comes first in hand); energy(3) then exhausted.
      expect(plan).toEqual(['deke', 'toe_drag']);
    }
  });

  it('prefers block when the user could KO again, else damage first', () => {
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

    // Defaults to damage-first when there is no prior-round reveal (e.g. round 1).
    {
      const duel = makeDuel();
      const state = makeState(['protect_puck', 'deke'], duel);
      const plan = planCpuCards(state);
      expect(plan[0]).toBe('deke');
    }
  });

  it('applies role perks and uses the base energy budget', () => {
    const duel = makeDuel();
    const state = makeState(['body_check'], duel, 'LD');
    const plan = planCpuCards(state);
    expect(plan).toEqual(['body_check']);

    // Plans CPU cards with the base energy budget even when the user has bonus energy.
    {
      const duel = makeDuel({ energy: ENERGY + 1 });
      const state = {
        ...makeState(['toe_drag', 'toe_drag'], duel),
        bonusEnergy: 1,
      };

      const plan = planCpuCards(state);
      const totalCost = plan.reduce((sum, id) => sum + CARDS[id].cost, 0);

      expect(plan).toEqual(['toe_drag']);
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
