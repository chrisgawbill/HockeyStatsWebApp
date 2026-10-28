import { ENERGY } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import { composePlaybook } from '@/features/board-game/data/playbooks';
import { planCards } from '@/features/board-game/engine/cpuDuelPolicy';
import { createDeck } from '@/features/board-game/engine/deck';
import type { Side } from '@/features/board-game/engine/duelShared';
import {
  canPlayCard,
  canUnqueueCard,
  cardBlockReason,
  createDuel,
  endDuelRound,
  playCard,
  resolveDuel,
  unqueueCard,
} from '@/features/board-game/engine/duel';
import type {
  BattleSide,
  Deck,
  GameState,
} from '@/features/board-game/types/game';
import { makeState } from '@/test/fixtures/duel';
import { describe, expect, it } from 'vitest';

type OrdinaryKind = 'deke' | 'check' | 'intercept';
const ORDINARY_KINDS: OrdinaryKind[] = ['deke', 'check', 'intercept'];
const BASIC_ACTIONS = ['shield_the_puck', 'stay_on_him'];

/** The neutral playbook both teams start from until teams are assigned. */
const NEUTRAL_PLAYBOOK = composePlaybook();

/** The Product Owner's ON2-04 card map, written out independently of the card data so the data is checked against it. */
const BATTLE_CARD_MAP: Record<OrdinaryKind, Record<BattleSide, string[]>> = {
  deke: {
    possession: [
      'deke',
      'toe_drag',
      'protect_puck',
      'stickhandle',
      'drive_wide',
      'cutback',
      'shield_the_puck',
    ],
    challenger: [
      'poke_check',
      'body_check',
      'angle_out',
      'gap_control',
      'stick_lift',
      'active_stick',
      'stay_on_him',
    ],
  },
  check: {
    possession: [
      'protect_puck',
      'stickhandle',
      'slip_the_check',
      'brace_for_contact',
      'shield_the_puck',
    ],
    challenger: [
      'poke_check',
      'body_check',
      'stick_lift',
      'pin_to_boards',
      'finish_the_check',
      'stay_on_him',
    ],
  },
  intercept: {
    possession: [
      'stickhandle',
      'deke',
      'protect_puck',
      'cutback',
      'saucer_pass',
      'quick_touch',
      'shield_the_puck',
    ],
    challenger: [
      'poke_check',
      'angle_out',
      'read_the_lane',
      'active_stick',
      'step_up',
      'deflect_pass',
      'stay_on_him',
    ],
  },
};

/** The puck carrier is the defender in a check, the attacker otherwise. */
function battleSideFor(kind: OrdinaryKind, side: Side): BattleSide {
  const carrier: Side = kind === 'check' ? 'defender' : 'attacker';
  return side === carrier ? 'possession' : 'challenger';
}

/** Every card id in a deck's piles plus hand, basic actions excluded, sorted. */
function deckCardIds(deck: Deck): string[] {
  return [
    ...deck.drawPile,
    ...deck.hand,
    ...deck.discardPile,
    ...deck.exhaustPile,
  ]
    .filter((id) => !BASIC_ACTIONS.includes(id))
    .sort();
}

/** True if any deck pile (not the hand) holds a basic action. */
function pileHoldsBasicAction(deck: Deck): boolean {
  return [...deck.drawPile, ...deck.discardPile, ...deck.exhaustPile].some(
    (id) => BASIC_ACTIONS.includes(id),
  );
}

/** Drives a duel to completion by discarding the user's hand every round (a passive human). */
function driveToCompletion(state: GameState, maxRounds = 10): GameState {
  let s = state;
  for (let i = 0; i < maxRounds && s.duel; i++) {
    s = endDuelRound({ ...s, deck: { ...s.deck, hand: [] } });
  }
  return s;
}

describe('createDuel', () => {
  // BG-A15b: the faceoff duel no longer goes through this generic
  // hand-dealing machinery at all (it's an ante pick now - see
  // engine/faceoffDuel.test.ts), so `handSizeFor`'s old +1-for-faceoff perk
  // branch is gone; every remaining duel kind here offers a plain 3.
  it('offers 3 cards each, plans CPU cards within budget, and adds streak energy to the user only', () => {
    const state = makeState();
    const check = createDuel(state, 'check', 'user-LD', 'cpu-C');
    expect(check.duel!.energy).toBe(3);
    expect(check.deck.hand).toHaveLength(3);
    expect(check.cpuDeck.hand).toHaveLength(3);

    // Plans the CPU's round-1 cards within the energy budget.
    {
      const state = makeState();
      const duel = createDuel(state, 'check', 'user-LD', 'cpu-C');
      const plan = duel.duel!.cpuPlan;
      const totalCost = plan.reduce((sum, id) => sum + CARDS[id].cost, 0);
      expect(totalCost).toBeLessThanOrEqual(ENERGY);
      expect(plan.every((id) => duel.cpuDeck.hand.includes(id))).toBe(true);
    }

    // Adds daily-streak bonus energy to the user duel budget only.
    {
      const state = makeState({
        bonusEnergy: 1,
        cpuDeck: {
          drawPile: ['body_check', 'body_check'],
          hand: [],
          discardPile: [],
          exhaustPile: [],
        },
      });
      const duel = createDuel(state, 'deke', 'user-LW', 'cpu-LD');
      const cpuPlanCost = duel.duel!.cpuPlan.reduce(
        (sum, id) => sum + CARDS[id].cost,
        0,
      );

      expect(duel.duel!.energy).toBe(ENERGY + 1);
      expect(cpuPlanCost).toBe(ENERGY - 1);
    }
  });
});

describe('ordinary card contexts', () => {
  it('match the Product Owner card map for every ordinary battle and side', () => {
    for (const kind of ORDINARY_KINDS) {
      for (const side of ['possession', 'challenger'] as BattleSide[]) {
        const eligible = Object.values(CARDS)
          .filter((card) => card.allowedIn[kind]?.includes(side))
          .map((card) => card.id)
          .sort();
        expect(eligible).toEqual([...BATTLE_CARD_MAP[kind][side]].sort());
      }
    }
  });
});

describe('filtered duel draw (BG-A13)', () => {
  const isAllowedIn = (id: string, kind: OrdinaryKind, side: Side) =>
    BATTLE_CARD_MAP[kind][battleSideFor(kind, side)].includes(id);

  // BG-A15b: the starter deck (now the neutral playbook) carries the 6 faceoff-pool cards too (they're
  // drawn by the faceoff ante instead, see engine/faceoffDuel.test.ts), so
  // this also guards that a faceoff-only card never leaks into a deke hand -
  // it's the same filter path a shot- or check-only card was already
  // guarded against here.
  it('deals only eligible cards, short hands safely, deterministically, keeping the rest in the deck', () => {
    const state = makeState();
    const duel = createDuel(state, 'deke', 'user-LW', 'cpu-LD');
    for (const id of duel.deck.hand)
      expect(isAllowedIn(id, 'deke', 'attacker')).toBe(true);
    for (const id of duel.cpuDeck.hand)
      expect(isAllowedIn(id, 'deke', 'defender')).toBe(true);

    // Pads the offer with the side's basic action (not a throw or a hang) when the eligible pool is empty.
    {
      // Stock the CPU carrier's deck entirely with shot-only cards so its eligible pool is empty.
      const state = makeState();
      const [cpuDeck] = createDeck(
        ['wrist_shot', 'wrist_shot', 'wrist_shot', 'slapshot', 'wrist_shot'],
        1,
      );
      const duel = createDuel(
        { ...state, cpuDeck },
        'check',
        'user-LD',
        'cpu-C',
      );
      expect(duel.cpuDeck.hand).toEqual([
        'shield_the_puck',
        'shield_the_puck',
        'shield_the_puck',
      ]);
      expect([...duel.cpuDeck.drawPile].sort()).toEqual(
        [...cpuDeck.drawPile].sort(),
      );
      expect(duel.phase).toBe('duel');
    }

    // Leaves ineligible cards in the deck for a later duel of a different kind.
    {
      const state = makeState();
      const deke = createDuel(state, 'deke', 'user-LW', 'cpu-LD');
      const remaining = [
        ...deke.deck.drawPile,
        ...deke.deck.discardPile,
        ...deke.deck.hand,
      ];
      expect([...remaining].sort()).toEqual([...NEUTRAL_PLAYBOOK].sort());
    }

    // Is deterministic for a fixed seed.
    const s1 = createDuel(
      makeState({ rngSeed: 7 }),
      'deke',
      'user-LW',
      'cpu-LD',
    );
    const s2 = createDuel(
      makeState({ rngSeed: 7 }),
      'deke',
      'user-LW',
      'cpu-LD',
    );
    expect(s1.deck.hand).toEqual(s2.deck.hand);
    expect(s1.cpuDeck.hand).toEqual(s2.cpuDeck.hand);
    expect(s1.rngSeed).toEqual(s2.rngSeed);
  });

  it('redraws filter the same way and reset energy to base plus the streak bonus', () => {
    const state = makeState();
    let duel = createDuel(state, 'check', 'user-LD', 'cpu-C');
    // Force the round to advance without a KO so a fresh hand is drawn.
    duel = endDuelRound({ ...duel, deck: { ...duel.deck, hand: [] } });
    expect(duel.duel).not.toBeNull();
    for (const id of duel.deck.hand)
      expect(isAllowedIn(id, 'check', 'attacker')).toBe(true);
    for (const id of duel.cpuDeck.hand)
      expect(isAllowedIn(id, 'check', 'defender')).toBe(true);

    // Resets the next user duel round to base energy plus the daily-streak bonus.
    {
      let duel = createDuel(
        makeState({ bonusEnergy: 1 }),
        'check',
        'user-LD',
        'cpu-C',
      );
      duel = {
        ...duel,
        deck: { ...duel.deck, hand: [] },
        cpuDeck: { ...duel.cpuDeck, hand: [] },
        duel: { ...duel.duel!, cpuPlan: [] },
      };

      const next = endDuelRound(duel);

      expect(next.duel!.round).toBe(2);
      expect(next.duel!.energy).toBe(ENERGY + 1);
    }
  });
});

describe('canPlayCard / playCard (queue)', () => {
  it('queues allowed cards, spending energy, and resolves draw effects immediately', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['wrist_shot'] } };
    expect(canPlayCard(state, 0)).toBe(false);

    // Moves the card from hand to userQueue and spends its energy, with no combat effect yet.
    {
      let state = createDuel(makeState(), 'deke', 'user-LD', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['protect_puck'] } };
      const next = playCard(state, 0);
      expect(next.deck.hand).toEqual([]);
      expect(next.duel!.userQueue).toEqual(['protect_puck']);
      expect(next.duel!.energy).toBe(2);
      expect(next.duel!.attacker.block).toBe(0);
    }

    // Resolves a draw effect immediately on queue.
    {
      let state = createDuel(makeState(), 'deke', 'user-LD', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['stickhandle'] } };
      const next = playCard(state, 0);
      expect(next.deck.hand).toHaveLength(1);
    }
  });
});

describe('cardBlockReason', () => {
  it('reports null, rule reasons, then energy, agreeing with canPlayCard', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['poke_check'] } };
    expect(cardBlockReason(state, 0)).toBeNull();

    // Returns 'shotOnly' when the card's allowedIn excludes this duel kind and lists shot first.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['wrist_shot'] } };
      expect(cardBlockReason(state, 0)).toBe('shotOnly');
    }

    // Returns 'otherSide' when the card is legal in this battle but only for the other side.
    {
      let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['body_check'] } };
      expect(cardBlockReason(state, 0)).toBe('otherSide');
    }

    // Returns 'otherBattle' when the card is never legal in this battle kind.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['toe_drag'] } };
      expect(cardBlockReason(state, 0)).toBe('otherBattle');
    }

    // Returns 'energy' when the card costs more than the current energy, and rule reasons take priority over it.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = {
        ...state,
        duel: { ...state.duel!, energy: 0 },
        deck: { ...state.deck, hand: ['poke_check'] },
      };
      expect(cardBlockReason(state, 0)).toBe('energy');
    }

    // Agrees with canPlayCard for every hand index in a mixed fixture.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = {
        ...state,
        duel: { ...state.duel!, energy: 1 },
        deck: {
          ...state.deck,
          hand: ['poke_check', 'wrist_shot', 'toe_drag', 'body_check'],
        },
      };
      for (let i = 0; i < state.deck.hand.length; i++) {
        expect(canPlayCard(state, i)).toBe(cardBlockReason(state, i) === null);
      }
    }
  });
});

describe('unqueueCard', () => {
  it('returns the card to hand with a refund, ignoring invalid indexes, with no net change over repeats', () => {
    let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['protect_puck', 'deke'] },
    };
    const queued = playCard(state, 0);
    const unqueued = unqueueCard(queued, 0);
    expect(unqueued.duel!.userQueue).toEqual([]);
    expect(unqueued.duel!.energy).toBe(3);
    expect(unqueued.deck.hand).toEqual(['deke', 'protect_puck']);

    // Returns the same state for an invalid queue index.
    {
      const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      expect(unqueueCard(state, 0)).toBe(state);
    }

    // Queue-unqueue Stickhandle 5x leaves hand size, total card count, and energy unchanged.
    {
      let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['stickhandle'] } };
      const total = (d: Deck) =>
        d.hand.length +
        d.drawPile.length +
        d.discardPile.length +
        d.exhaustPile.length;
      const totalBefore = total(state.deck);

      for (let i = 0; i < 5; i++) {
        state = playCard(state, 0);
        expect(state.deck.hand).toHaveLength(1);
        state = unqueueCard(state, 0);
        expect(state.deck.hand).toEqual(['stickhandle']);
      }

      expect(total(state.deck)).toBe(totalBefore);
      expect(state.duel!.energy).toBe(ENERGY);
      expect(state.duel!.userQueue).toEqual([]);
      expect(state.duel!.queueDraws).toEqual([]);
    }
  });

  it('returned drawn cards are reshuffled, and a queued drawn card cannot be unqueued', () => {
    let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['stickhandle'] } };
    const queued = playCard(state, 0);
    const drawnCardId = queued.deck.hand[0];
    const unqueued = unqueueCard(queued, 0);

    expect(unqueued.deck.drawPile).toHaveLength(
      queued.deck.drawPile.length + 1,
    );
    expect(unqueued.deck.drawPile).toContain(drawnCardId);
    // A plain append (no shuffle) would put the drawn card at the bottom
    // deterministically; shuffling should not reproduce that exact order.
    expect(unqueued.deck.drawPile).not.toEqual([
      ...queued.deck.drawPile,
      drawnCardId,
    ]);

    // canUnqueueCard is false once a drawn card has itself been queued, and unqueueCard refuses (state unchanged).
    {
      let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
      state = { ...state, deck: { ...state.deck, hand: ['stickhandle'] } };
      let queued = playCard(state, 0);
      // Force a known drawn card id so the follow-up queue is deterministic.
      queued = {
        ...queued,
        deck: { ...queued.deck, hand: ['deke'] },
        duel: { ...queued.duel!, queueDraws: [['deke']] },
      };
      queued = playCard(queued, 0);
      expect(canUnqueueCard(queued, 0)).toBe(false);
      expect(unqueueCard(queued, 0)).toBe(queued);
    }
  });
});

describe('endDuelRound (simultaneous reveal)', () => {
  it('applies block before damage with the LD perk, order-independently, exhausting at reveal', () => {
    let state = createDuel(makeState(), 'deke', 'user-LD', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['protect_puck'] },
      cpuDeck: { ...state.cpuDeck, hand: [] },
      duel: { ...state.duel!, cpuPlan: [] },
    };
    const queued = playCard(state, 0);
    const next = endDuelRound(queued);
    // base 5 block + LD/RD perk (+2) = 7, untouched since the CPU dealt no damage.
    expect(next.duel!.attacker.block).toBe(7);
    expect(next.lastReveal!.userBlock).toBe(7);

    // Is order-independent: the same cards queued in either order deal the same damage to each side.
    const base = createDuel(makeState(), 'deke', 'user-LD', 'cpu-C');
    const withHand = (order: string[]): GameState => ({
      ...base,
      deck: { ...base.deck, hand: order },
      cpuDeck: { ...base.cpuDeck, hand: ['poke_check'] },
      duel: { ...base.duel!, cpuPlan: ['poke_check'] },
    });

    const runQueueOrder = (order: string[]) => {
      let s = withHand(order);
      for (let i = 0; i < order.length; i++) s = playCard(s, 0);
      return endDuelRound(s);
    };

    const forward = runQueueOrder(['deke', 'stickhandle']);
    const reversed = runQueueOrder(['stickhandle', 'deke']);
    expect(forward.lastReveal!.userDamageDealt).toBe(
      reversed.lastReveal!.userDamageDealt,
    );
    expect(forward.lastReveal!.cpuDamageDealt).toBe(
      reversed.lastReveal!.cpuDamageDealt,
    );

    // Exhaust sends the queued card to the exhaust pile at reveal, not discard.
    {
      let state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
      state = {
        ...state,
        deck: { ...state.deck, hand: ['slapshot'] },
        cpuDeck: { ...state.cpuDeck, hand: [] },
        duel: { ...state.duel!, cpuPlan: [] },
      };
      const queued = playCard(state, 0);
      expect(queued.deck.exhaustPile).not.toContain('slapshot'); // not yet - still face-down in the queue
      const next = endDuelRound(queued);
      expect(next.deck.exhaustPile).toContain('slapshot');
      expect(next.deck.discardPile).not.toContain('slapshot');
    }
  });

  it('resolves KOs and double KOs at reveal, recording lastReveal', () => {
    let state = createDuel(makeState(), 'deke', 'user-C', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['toe_drag'] },
      cpuDeck: { ...state.cpuDeck, hand: [] },
      duel: {
        ...state.duel!,
        cpuPlan: [],
        defender: { ...state.duel!.defender, poise: 5 },
      },
    };
    const queued = playCard(state, 0);
    const next = endDuelRound(queued);
    expect(next.duel).toBeNull();
    expect(next.lastOutcome!.byKo).toBe(true);
    expect(next.lastOutcome!.winner).toBe('attacker');

    // A double KO goes to the higher remaining poise, tie to the defender, and counts as a KO.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = {
        ...state,
        deck: { ...state.deck, hand: [] },
        cpuDeck: { ...state.cpuDeck, hand: [] },
        duel: {
          ...state.duel!,
          cpuPlan: [],
          attacker: { ...state.duel!.attacker, poise: 0 },
          defender: { ...state.duel!.defender, poise: 0 },
        },
      };
      const next = endDuelRound(state);
      expect(next.duel).toBeNull();
      expect(next.lastOutcome!.byKo).toBe(true);
      expect(next.lastOutcome!.winner).toBe('defender'); // tied at 0 -> defender
    }

    // Records lastReveal with both sides' cards and post-block damage.
    {
      let state = createDuel(makeState(), 'deke', 'user-LD', 'cpu-C');
      state = {
        ...state,
        deck: { ...state.deck, hand: ['deke'] },
        cpuDeck: { ...state.cpuDeck, hand: ['poke_check'] },
        duel: { ...state.duel!, cpuPlan: ['poke_check'] },
      };
      const queued = playCard(state, 0);
      const next = endDuelRound(queued);
      expect(next.lastReveal).toEqual({
        round: 1,
        userCards: ['deke'],
        cpuCards: ['poke_check'],
        userDamageDealt: 6,
        cpuDamageDealt: 5,
        userBlock: 0,
        cpuBlock: 0,
        userBrokeResistance: false,
        cpuBrokeResistance: false,
      });
    }
  });

  it('breaks resistance for the whole round, perk bonus included, for either side', () => {
    /** Sets both sides' committed cards directly and reveals the round. */
    const revealRound = (
      state: GameState,
      userQueue: string[],
      cpuPlan: string[],
    ): GameState =>
      endDuelRound({
        ...state,
        deck: { ...state.deck, hand: [] },
        cpuDeck: { ...state.cpuDeck, hand: [...cpuPlan] },
        duel: { ...state.duel!, userQueue, cpuPlan },
      });

    // The user's Saucer Pass zeroes the CPU LD's perk-boosted Read the Lane (5 + 2) before its 4 pressure lands.
    {
      const pass = createDuel(
        makeState(),
        'intercept',
        'user-C',
        'cpu-LD',
        'user-LW',
      );
      const next = revealRound(pass, ['saucer_pass'], ['read_the_lane']);
      expect(next.lastReveal).toMatchObject({
        userDamageDealt: 4,
        cpuBlock: 0,
        userBrokeResistance: true,
        cpuBrokeResistance: false,
      });
      expect(next.duel!.defender.poise).toBe(pass.duel!.defender.poise - 4);

      // Without the break, the same resistance absorbs the pressure.
      const blocked = revealRound(pass, ['quick_touch'], ['read_the_lane']);
      expect(blocked.lastReveal).toMatchObject({
        userDamageDealt: 0,
        cpuBlock: 7,
        userBrokeResistance: false,
      });
    }

    // The CPU's Pin to Boards breaks the user LD's perk-boosted Brace for Contact (11 + 2), and covers all its pressure.
    {
      const check = createDuel(makeState(), 'check', 'cpu-C', 'user-LD');
      const next = revealRound(
        check,
        ['brace_for_contact'],
        ['pin_to_boards', 'poke_check'],
      );
      expect(next.lastReveal).toMatchObject({
        cpuDamageDealt: 8,
        userBlock: 0,
        userBrokeResistance: false,
        cpuBrokeResistance: true,
      });
      expect(next.duel!.defender.poise).toBe(check.duel!.defender.poise - 8);
    }

    // When both sides break resistance, neither side's resistance stands (the LD's Pin to Boards carries its +2 perk).
    {
      const pass = createDuel(
        makeState(),
        'intercept',
        'user-C',
        'cpu-LD',
        'user-LW',
      );
      const next = revealRound(
        pass,
        ['saucer_pass', 'protect_puck'],
        ['pin_to_boards', 'read_the_lane'],
      );
      expect(next.lastReveal).toMatchObject({
        userDamageDealt: 4,
        cpuDamageDealt: 5,
        userBlock: 0,
        cpuBlock: 0,
        userBrokeResistance: true,
        cpuBrokeResistance: true,
      });
    }
  });

  it('a mid-round KO discards the leftover hand, keeping every card across piles', () => {
    const [starterDeck] = createDeck(NEUTRAL_PLAYBOOK, 1);
    const toeDragIndex = starterDeck.drawPile.indexOf('toe_drag');
    const deck: Deck = {
      drawPile: starterDeck.drawPile.filter((_, i) => i !== toeDragIndex),
      hand: ['toe_drag'],
      discardPile: [],
      exhaustPile: [],
    };
    let state = createDuel(makeState({ deck }), 'deke', 'user-LD', 'cpu-C');
    state = {
      ...state,
      cpuDeck: { ...state.cpuDeck, hand: [] },
      duel: {
        ...state.duel!,
        cpuPlan: [],
        defender: { ...state.duel!.defender, poise: 5 },
      },
    };
    const handIndex = state.deck.hand.indexOf('toe_drag');
    const queued = playCard(state, handIndex);
    const next = endDuelRound(queued);
    expect(next.duel).toBeNull();
    expect(next.deck.hand).toEqual([]);
    const total =
      next.deck.hand.length +
      next.deck.drawPile.length +
      next.deck.discardPile.length +
      next.deck.exhaustPile.length;
    expect(total).toBe(NEUTRAL_PLAYBOOK.length);
  });
});

describe('endDuelRound (passive-human scenarios)', () => {
  it('is a no-op without a duel; a passive human loses, including to CPU KOs', () => {
    const state = makeState({ duel: null });
    expect(endDuelRound(state)).toBe(state);

    // A passive human (empty hand) never damages the CPU, so the CPU side always wins.
    {
      // check duel: user-LD is attacker, cpu-C is defender. Since the user never plays a
      // card, the CPU (defender) never takes damage - it wins by KO (if its own plan
      // lands a KO first) or by the timeout-favors-defender rule either way.
      const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      const result = driveToCompletion(state);
      expect(result.duel).toBeNull();
      expect(result.lastOutcome!.winner).toBe('defender');
    }

    // A KO from the CPU's own planned cards ends the duel with the CPU side winning.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      // attacker is the user (userSide), so a KO here should hand the win to the defender (cpu).
      state = {
        ...state,
        deck: { ...state.deck, hand: [] },
        cpuDeck: { ...state.cpuDeck, hand: ['stickhandle'] },
        duel: {
          ...state.duel!,
          attacker: { ...state.duel!.attacker, poise: 1 },
          cpuPlan: ['stickhandle'],
        },
      };
      const next = endDuelRound(state);
      expect(next.duel).toBeNull();
      expect(next.lastOutcome!.byKo).toBe(true);
      expect(next.lastOutcome!.winner).toBe('defender');
    }
  });

  // BG-A15b removed the old faceoff-specific timeout tiebreak (poise
  // comparison) from this generic round machinery - faceoff duels no
  // longer reach it at all (they resolve through engine/faceoffDuel.ts's
  // ante+reaction; see engine/faceoffDuel.test.ts for its own timeout-free
  // outcome coverage). Every remaining duel kind here already always
  // favored the defender on a timeout, covered by the next test.
});

describe('resolveDuel outcome table', () => {
  it('discards both hands; check and deke wins move the puck and stun the loser', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['deke'] },
      cpuDeck: { ...state.cpuDeck, hand: ['deke'] },
    };
    const result = resolveDuel(state, 'attacker', true);
    expect(result.deck.hand).toEqual([]);
    expect(result.cpuDeck.hand).toEqual([]);

    // Check: defender (carrier) win stuns the checker and the puck stays with the carrier.
    {
      const state = {
        ...createDuel(makeState(), 'check', 'user-LD', 'cpu-C'),
        puck: { kind: 'carried' as const, skaterId: 'cpu-C' },
      };
      const result = resolveDuel(state, 'defender', true);
      expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
      expect(result.skaters.find((s) => s.id === 'user-LD')!.stunned).toBe(
        true,
      );
    }

    // Deke: attacker win keeps the puck and stuns the defender; defender win flips both.
    {
      const state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
      const attackerWin = resolveDuel(state, 'attacker', true);
      expect(attackerWin.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
      expect(attackerWin.skaters.find((s) => s.id === 'cpu-C')!.stunned).toBe(
        true,
      );

      const defenderWin = resolveDuel(state, 'defender', true);
      expect(defenderWin.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
      expect(defenderWin.skaters.find((s) => s.id === 'user-LW')!.stunned).toBe(
        true,
      );
    }

    // Check: attacker (checker) win takes the puck and stuns the carrier.
    {
      const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      const result = resolveDuel(state, 'attacker', true);
      expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-LD' });
      expect(result.skaters.find((s) => s.id === 'cpu-C')!.stunned).toBe(true);
    }
  });

  // BG-A15b: `applyOutcome`'s `faceoff` case now reads `duel.faceoffUserResult`
  // (set by `engine/faceoffDuel.ts`'s `resolveFaceoffBand`), so calling
  // `resolveDuel` directly on a `faceoff` duel built by the generic
  // `createDuel` (as the old version of this test did) no longer applies -
  // see engine/faceoffDuel.test.ts for the real outcome-table coverage.

  it('intercepts give the puck to the receiver or the lane opponent; a shot win scores', () => {
    const state = createDuel(
      makeState(),
      'intercept',
      'user-C',
      'cpu-LD',
      'user-RW',
    );
    const result = resolveDuel(state, 'attacker', false);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });

    // Intercept: defender win gives the lane opponent the puck.
    {
      const state = createDuel(
        makeState(),
        'intercept',
        'user-C',
        'cpu-LD',
        'user-RW',
      );
      const result = resolveDuel(state, 'defender', false);
      expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-LD' });
    }

    // Shot: attacker win scores a goal and ends the game.
    {
      const state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
      const result = resolveDuel(state, 'attacker', true);
      expect(result.phase).toBe('gameOver');
      expect(result.winner).toBe('user');
      expect(result.lastOutcome!.goal).toBe(true);
    }
  });

  it('shot saves freeze to a teammate when clean, else rebound at the crease front', () => {
    // Timeout is the only reachable defender-win path now that goalies only block
    // (they can never KO the shooter), and this goalie took no damage all duel.
    const state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    const result = resolveDuel(state, 'defender', false);
    expect(result.lastOutcome!.cleanSave).toBe(true);
    const puck = result.puck;
    expect(puck.kind).toBe('carried');
    if (puck.kind === 'carried') {
      const carrier = result.skaters.find((s) => s.id === puck.skaterId)!;
      expect(carrier.team).toBe('cpu');
      expect(carrier.role).not.toBe('G');
    }

    // Shot: a non-clean-save timeout (goalie took poise damage) rebounds loose at the crease front unless a skater stands there.
    {
      let state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
      state = {
        ...state,
        duel: {
          ...state.duel!,
          defender: { ...state.duel!.defender, poise: 25 },
        },
      };
      const result = resolveDuel(state, 'defender', false);
      expect(result.lastOutcome!.cleanSave).toBe(false);
      expect(result.puck).toEqual({ kind: 'loose', pos: { col: 13, row: 3 } });
    }
  });
});

describe('contextual offers (ON2-03)', () => {
  /** Queues the user's planned cards, unqueuing and re-queuing the last to exercise the return path. */
  function queueUserPlan(state: GameState): GameState {
    let next = state;
    for (const cardId of planCards(next, 'user')) {
      const handIndex = next.deck.hand.indexOf(cardId);
      if (handIndex !== -1) next = playCard(next, handIndex);
    }
    const lastIndex = next.duel!.userQueue.length - 1;
    if (lastIndex >= 0 && canUnqueueCard(next, lastIndex)) {
      next = unqueueCard(next, lastIndex);
      expect(pileHoldsBasicAction(next.deck)).toBe(false);
      next = playCard(next, next.deck.hand.length - 1);
    }
    return next;
  }

  /** Moves every copy of `ids` from the draw pile to the exhaust pile, thinning the eligible pool. */
  function exhaustCopies(deck: Deck, ids: string[]): Deck {
    return {
      ...deck,
      drawPile: deck.drawPile.filter((id) => !ids.includes(id)),
      exhaustPile: deck.drawPile.filter((id) => ids.includes(id)),
    };
  }

  it('never offers a card outside the battle/side map, always offers 3, and keeps every deck card exactly once', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const thin = seed % 2 === 0;
      const [userDeck, seed1] = createDeck(NEUTRAL_PLAYBOOK, seed);
      const [cpuDeck, rngSeed] = createDeck(NEUTRAL_PLAYBOOK, seed1);
      const thinned = ['deke', 'protect_puck', 'poke_check'];
      let state = makeState({
        rngSeed,
        deck: thin ? exhaustCopies(userDeck, thinned) : userDeck,
        cpuDeck: thin ? exhaustCopies(cpuDeck, thinned) : cpuDeck,
      });
      const userExhausted = [...state.deck.exhaustPile];
      const cpuExhausted = [...state.cpuDeck.exhaustPile];

      for (let duelIndex = 0; duelIndex < 6; duelIndex++) {
        const kind = ORDINARY_KINDS[duelIndex % ORDINARY_KINDS.length];
        const userAttacks = (seed + duelIndex) % 2 === 0;
        const [attackerId, defenderId] = userAttacks
          ? ['user-LW', 'cpu-LD']
          : ['cpu-LW', 'user-LD'];
        state = createDuel(
          { ...state, phase: 'move' },
          kind,
          attackerId,
          defenderId,
          kind === 'intercept' ? attackerId.replace('LW', 'C') : null,
        );

        while (state.duel) {
          const userSide = state.duel.userSide;
          const cpuSide: Side =
            userSide === 'attacker' ? 'defender' : 'attacker';
          const userAllowed =
            BATTLE_CARD_MAP[kind][battleSideFor(kind, userSide)];
          const cpuAllowed =
            BATTLE_CARD_MAP[kind][battleSideFor(kind, cpuSide)];

          expect(state.deck.hand).toHaveLength(3);
          expect(state.cpuDeck.hand).toHaveLength(3);
          for (const id of state.deck.hand) expect(userAllowed).toContain(id);
          for (const id of state.cpuDeck.hand) expect(cpuAllowed).toContain(id);
          for (const id of state.duel.cpuPlan) expect(cpuAllowed).toContain(id);
          expect(deckCardIds(state.deck)).toEqual([...NEUTRAL_PLAYBOOK].sort());
          expect(deckCardIds(state.cpuDeck)).toEqual(
            [...NEUTRAL_PLAYBOOK].sort(),
          );

          state = queueUserPlan(state);
          for (const id of state.deck.hand) expect(userAllowed).toContain(id);
          state = endDuelRound(state);

          expect(pileHoldsBasicAction(state.deck)).toBe(false);
          expect(pileHoldsBasicAction(state.cpuDeck)).toBe(false);
          expect(state.deck.exhaustPile).toEqual(userExhausted);
          expect(state.cpuDeck.exhaustPile).toEqual(cpuExhausted);
        }
        expect(state.deck.hand).toEqual([]);
        expect(state.cpuDeck.hand).toEqual([]);
        if (state.phase === 'gameOver') break;
      }
    }
  });

  it('gives user and CPU the same offer, plan and settled piles from the same deck and side', () => {
    const deck: Deck = {
      drawPile: ['wrist_shot', 'stickhandle', 'body_check', 'protect_puck'],
      hand: [],
      discardPile: ['poke_check'],
      exhaustPile: ['deke'],
    };
    const emptyDeck: Deck = {
      drawPile: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],
    };
    const userCarrier = createDuel(
      makeState({ deck, cpuDeck: emptyDeck }),
      'deke',
      'user-LW',
      'cpu-LD',
    );
    const cpuCarrier = createDuel(
      makeState({ deck: emptyDeck, cpuDeck: deck }),
      'deke',
      'cpu-LW',
      'user-LD',
    );
    expect(userCarrier.deck.hand).toEqual(cpuCarrier.cpuDeck.hand);
    expect(userCarrier.deck.hand).toEqual([
      'stickhandle',
      'protect_puck',
      'shield_the_puck',
    ]);

    const userPlan = planCards(userCarrier, 'user');
    expect(userPlan).toEqual(cpuCarrier.duel!.cpuPlan);

    // Both carriers commit the same plan and settle it with the same energy and pile rules.
    let userPlayed = userCarrier;
    for (const id of userPlan)
      userPlayed = playCard(userPlayed, userPlayed.deck.hand.indexOf(id));
    const planCost = userPlan.reduce((sum, id) => sum + CARDS[id].cost, 0);
    expect(userPlayed.duel!.energy).toBe(ENERGY - planCost);

    const knockOutCarrier = (state: GameState): GameState => ({
      ...state,
      duel: {
        ...state.duel!,
        attacker: { ...state.duel!.attacker, poise: 1 },
        defender: { ...state.duel!.defender, poise: 1 },
      },
    });
    const userSettled = endDuelRound(knockOutCarrier(userPlayed)).deck;
    const cpuSettled = endDuelRound(knockOutCarrier(cpuCarrier)).cpuDeck;
    for (const settled of [userSettled, cpuSettled]) {
      expect(settled.hand).toEqual([]);
      expect(settled.exhaustPile).toEqual(['deke']);
      expect(pileHoldsBasicAction(settled)).toBe(false);
    }
    expect([...userSettled.discardPile].sort()).toEqual(
      [...cpuSettled.discardPile].sort(),
    );
    expect([...userSettled.drawPile].sort()).toEqual(
      [...cpuSettled.drawPile].sort(),
    );
  });

  it('discards a flexible card played in one battle and reshuffles it into a later eligible offer', () => {
    const deck: Deck = {
      drawPile: ['protect_puck', 'deke', 'toe_drag'],
      hand: [],
      discardPile: [],
      exhaustPile: [],
    };
    let state = createDuel(makeState({ deck }), 'deke', 'user-LW', 'cpu-LD');
    state = playCard(state, state.deck.hand.indexOf('protect_puck'));
    state = resolveDuel(endDuelRound(state), 'attacker', true);
    expect(state.deck.discardPile).toContain('protect_puck');

    // The user now carries the puck against a check: only protect_puck is eligible.
    const check = createDuel(
      { ...state, phase: 'move' },
      'check',
      'cpu-LD',
      'user-LW',
    );
    expect(check.deck.hand).toEqual([
      'protect_puck',
      'shield_the_puck',
      'shield_the_puck',
    ]);
    expect([...check.deck.drawPile].sort()).toEqual(['deke', 'toe_drag']);
  });

  it('draw effects pull only eligible cards for the user on queue and the CPU at reveal, never padding', () => {
    let state = createDuel(makeState(), 'check', 'cpu-LD', 'user-LW');
    state = {
      ...state,
      deck: {
        drawPile: ['poke_check', 'toe_drag', 'protect_puck', 'deke'],
        hand: ['stickhandle'],
        discardPile: [],
        exhaustPile: [],
      },
    };
    const queued = playCard(state, 0);
    expect(queued.deck.hand).toEqual(['protect_puck']);
    expect(queued.duel!.queueDraws).toEqual([['protect_puck']]);

    // With nothing eligible left, the draw finds nothing rather than a basic action.
    {
      const dry = playCard(
        {
          ...state,
          deck: { ...state.deck, drawPile: ['poke_check', 'toe_drag'] },
        },
        0,
      );
      expect(dry.deck.hand).toEqual([]);
      expect(dry.duel!.queueDraws).toEqual([[]]);
    }

    // The CPU carrier's Stickhandle draws at reveal from its eligible cards only.
    {
      let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
      state = {
        ...state,
        deck: { ...state.deck, hand: [] },
        cpuDeck: {
          drawPile: ['body_check', 'poke_check', 'protect_puck'],
          hand: ['stickhandle'],
          discardPile: [],
          exhaustPile: [],
        },
        duel: {
          ...state.duel!,
          cpuPlan: ['stickhandle'],
          attacker: { ...state.duel!.attacker, poise: 1 },
        },
      };
      const next = endDuelRound(state);
      expect(next.duel).toBeNull();
      expect(next.cpuDeck.drawPile).toEqual(['body_check', 'poke_check']);
      expect([...next.cpuDeck.discardPile].sort()).toEqual([
        'protect_puck',
        'stickhandle',
      ]);
    }
  });
});
