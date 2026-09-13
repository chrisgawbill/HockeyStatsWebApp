import { describe, expect, it } from 'vitest';
import {
  ENERGY,
  GOALIE_POISE_BY_LENGTH,
} from '@/features/board-game/data/balance';
import { CARDS, STARTER_DECK } from '@/features/board-game/data/cards';
import { FORMATIONS } from '@/features/board-game/data/formations';
import { createDeck } from '@/features/board-game/engine/deck';
import { planCards } from '@/features/board-game/engine/cpuDuelPolicy';
import {
  canPlayCard,
  cardBlockReason,
  createDuel,
  endDuelRound,
  playCard,
  resolveDuel,
  stunUntil,
  unqueueCard,
} from '@/features/board-game/engine/duel';
import { isStunned } from '@/features/board-game/engine/rink';
import type {
  Deck,
  GameState,
  Role,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

function makeSkater(team: TeamId, role: Role): Skater {
  return {
    id: `${team}-${role}`,
    team,
    role,
    pos: FORMATIONS[team][role],
    stunnedUntilTurn: null,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const skaters: Skater[] = (
    ['LW', 'C', 'RW', 'LD', 'RD', 'G'] as Role[]
  ).flatMap((role) => [makeSkater('user', role), makeSkater('cpu', role)]);
  const [deck, seed1] = createDeck(STARTER_DECK, 1);
  const [cpuDeck, rngSeed] = createDeck(STARTER_DECK, seed1);
  return {
    phase: 'move',
    length: 'long',
    activeTeam: 'user',
    turn: 1,
    mp: 3,
    dice: null,
    skaters,
    puck: { kind: 'carried', skaterId: 'user-C' },
    deck,
    cpuDeck,
    duel: null,
    lastOutcome: null,
    lastReveal: null,
    winner: null,
    rngSeed,
    actionsThisTurn: 0,
    whistle: false,
    ...overrides,
  };
}

/** Drives a duel to completion by discarding the user's hand every round (a passive human). */
function driveToCompletion(state: GameState, maxRounds = 10): GameState {
  let s = state;
  for (let i = 0; i < maxRounds && s.duel; i++) {
    s = endDuelRound({ ...s, deck: { ...s.deck, hand: [] } });
  }
  return s;
}

describe('stunUntil', () => {
  it("lasts through the team's next turn either way", () => {
    const state = makeState({ turn: 3, activeTeam: 'user' });
    expect(stunUntil(state, 'user')).toBe(5);
    expect(stunUntil(state, 'cpu')).toBe(4);
  });

  it('a skater stunned on its own turn cannot move next turn but can the turn after', () => {
    const state = makeState({ turn: 3, activeTeam: 'user' });
    const until = stunUntil(state, 'user');
    expect(
      isStunned(
        { ...makeSkater('user', 'LW'), stunnedUntilTurn: until },
        until,
      ),
    ).toBe(true);
    expect(
      isStunned(
        { ...makeSkater('user', 'LW'), stunnedUntilTurn: until },
        until + 2,
      ),
    ).toBe(false);
  });

  it("a skater stunned on the opponent's turn cannot move its next turn but can the turn after", () => {
    const state = makeState({ turn: 3, activeTeam: 'cpu' });
    const until = stunUntil(state, 'user');
    expect(
      isStunned(
        { ...makeSkater('user', 'LW'), stunnedUntilTurn: until },
        until,
      ),
    ).toBe(true);
    expect(
      isStunned(
        { ...makeSkater('user', 'LW'), stunnedUntilTurn: until },
        until + 2,
      ),
    ).toBe(false);
  });
});

describe('createDuel', () => {
  it('draws 5 cards for both sides, or 6 for a faceoff', () => {
    const state = makeState();
    const check = createDuel(state, 'check', 'user-LD', 'cpu-C');
    expect(check.duel!.energy).toBe(3);
    expect(check.deck.hand).toHaveLength(5);
    expect(check.cpuDeck.hand).toHaveLength(5);

    const faceoff = createDuel(state, 'faceoff', 'user-C', 'cpu-C');
    expect(faceoff.deck.hand).toHaveLength(6);
    expect(faceoff.cpuDeck.hand).toHaveLength(6);
    expect(faceoff.phase).toBe('duel');
  });

  it("plans the CPU's round-1 cards within the energy budget", () => {
    const state = makeState();
    const duel = createDuel(state, 'check', 'user-LD', 'cpu-C');
    const plan = duel.duel!.cpuPlan;
    const totalCost = plan.reduce((sum, id) => sum + CARDS[id].cost, 0);
    expect(totalCost).toBeLessThanOrEqual(ENERGY);
    expect(plan.every((id) => duel.cpuDeck.hand.includes(id))).toBe(true);
  });

  it("sets the shot duel goalie's maxPoise from GOALIE_POISE_BY_LENGTH for the match length", () => {
    const short = createDuel(
      makeState({ length: 'short' }),
      'shot',
      'user-C',
      'cpu-G',
    );
    expect(short.duel!.defender.maxPoise).toBe(GOALIE_POISE_BY_LENGTH.short);
    expect(short.duel!.defender.poise).toBe(GOALIE_POISE_BY_LENGTH.short);

    const long = createDuel(
      makeState({ length: 'long' }),
      'shot',
      'user-C',
      'cpu-G',
    );
    expect(long.duel!.defender.maxPoise).toBe(GOALIE_POISE_BY_LENGTH.long);
    expect(long.duel!.defender.poise).toBe(GOALIE_POISE_BY_LENGTH.long);
  });
});

describe('canPlayCard / playCard (queue)', () => {
  it('rejects a card not allowed in this duel kind', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['wrist_shot'] } };
    expect(canPlayCard(state, 0)).toBe(false);
  });

  it('moves the card from hand to userQueue and spends its energy, with no combat effect yet', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['protect_puck'] } };
    const next = playCard(state, 0);
    expect(next.deck.hand).toEqual([]);
    expect(next.duel!.userQueue).toEqual(['protect_puck']);
    expect(next.duel!.energy).toBe(2);
    expect(next.duel!.attacker.block).toBe(0);
  });

  it('resolves a draw effect immediately on queue', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['stickhandle'] } };
    const next = playCard(state, 0);
    expect(next.deck.hand).toHaveLength(1);
  });
});

describe('cardBlockReason', () => {
  it('returns null for a playable card', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['poke_check'] } };
    expect(cardBlockReason(state, 0)).toBeNull();
  });

  it("returns 'shotOnly' when the card's allowedIn excludes this duel kind and lists shot first", () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['wrist_shot'] } };
    expect(cardBlockReason(state, 0)).toBe('shotOnly');
  });

  it("returns 'checkOnly' when the card's allowedIn excludes this duel kind and lists check first", () => {
    let state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
    state = { ...state, deck: { ...state.deck, hand: ['body_check'] } };
    expect(cardBlockReason(state, 0)).toBe('checkOnly');
  });

  it("returns 'goalieBlockOnly' for a non-block card on the goalie side of a shot duel", () => {
    let state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    state = {
      ...state,
      duel: { ...state.duel!, userSide: 'defender' },
      deck: { ...state.deck, hand: ['deke'] },
    };
    expect(cardBlockReason(state, 0)).toBe('goalieBlockOnly');
  });

  it("returns 'energy' when the card costs more than the current energy, and rule reasons take priority over it", () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = {
      ...state,
      duel: { ...state.duel!, energy: 0 },
      deck: { ...state.deck, hand: ['poke_check'] },
    };
    expect(cardBlockReason(state, 0)).toBe('energy');
  });

  it('agrees with canPlayCard for every hand index in a mixed fixture', () => {
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
  });
});

describe('unqueueCard', () => {
  it('returns the card to the end of hand and refunds its cost', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['protect_puck', 'deke'] },
    };
    const queued = playCard(state, 0);
    const unqueued = unqueueCard(queued, 0);
    expect(unqueued.duel!.userQueue).toEqual([]);
    expect(unqueued.duel!.energy).toBe(3);
    expect(unqueued.deck.hand).toEqual(['deke', 'protect_puck']);
  });

  it('returns the same state for an invalid queue index', () => {
    const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    expect(unqueueCard(state, 0)).toBe(state);
  });
});

describe('endDuelRound (simultaneous reveal)', () => {
  it('block applies before damage, and LD perk boosts block', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
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
  });

  it('is order-independent: the same cards queued in either order deal the same damage to each side', () => {
    const base = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
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
  });

  it('exhaust sends the queued card to the exhaust pile at reveal, not discard', () => {
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
  });

  it('a lethal queued card KOs the opponent at reveal', () => {
    let state = createDuel(makeState(), 'faceoff', 'user-C', 'cpu-C');
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
  });

  it('a double KO goes to the higher remaining poise, tie to the defender, and counts as a KO', () => {
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
  });

  it("records lastReveal with both sides' cards and post-block damage", () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
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
    });
  });

  it('a mid-round KO discards the leftover hand, keeping all 12 cards across piles', () => {
    const [starterDeck] = createDeck(STARTER_DECK, 1);
    const toeDragIndex = starterDeck.drawPile.indexOf('toe_drag');
    const deck: Deck = {
      drawPile: starterDeck.drawPile.filter((_, i) => i !== toeDragIndex),
      hand: ['toe_drag'],
      discardPile: [],
      exhaustPile: [],
    };
    let state = createDuel(makeState({ deck }), 'check', 'user-LD', 'cpu-C');
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
    expect(total).toBe(12);
  });
});

describe('endDuelRound (passive-human scenarios)', () => {
  it('is a no-op when there is no active duel', () => {
    const state = makeState({ duel: null });
    expect(endDuelRound(state)).toBe(state);
  });

  it('faceoff timeout: equal poise after MAX_ROUNDS goes to the defender (cpu-C), who gets the puck', () => {
    let state = createDuel(makeState(), 'faceoff', 'user-C', 'cpu-C');
    // Empty both hands and both plans every round, so poise stays tied at full for all 3 rounds.
    const emptyBothSides = (s: GameState): GameState => ({
      ...s,
      deck: { ...s.deck, hand: [] },
      cpuDeck: { ...s.cpuDeck, hand: [] },
      duel: s.duel ? { ...s.duel, cpuPlan: [] } : s.duel,
    });
    for (let i = 0; i < 3 && state.duel; i++) {
      state = endDuelRound(emptyBothSides(state));
    }
    expect(state.duel).toBeNull();
    expect(state.lastOutcome!.winner).toBe('defender');
    expect(state.lastOutcome!.byKo).toBe(false);
    expect(state.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
  });

  it('a passive human (empty hand) never damages the CPU, so the CPU side always wins', () => {
    // check duel: user-LD is attacker, cpu-C is defender. Since the user never plays a
    // card, the CPU (defender) never takes damage - it wins by KO (if its own plan
    // lands a KO first) or by the timeout-favors-defender rule either way.
    const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    const result = driveToCompletion(state);
    expect(result.duel).toBeNull();
    expect(result.lastOutcome!.winner).toBe('defender');
  });

  it('faceoff: the passive user (always attacker) never damages the CPU, so the CPU (defender) wins', () => {
    const state = createDuel(makeState(), 'faceoff', 'user-C', 'cpu-C');
    const result = driveToCompletion(state);
    expect(result.duel).toBeNull();
    expect(result.lastOutcome!.winner).toBe('defender');
  });

  it("a KO from the CPU's own planned cards ends the duel with the CPU side winning", () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    // attacker is the user (userSide), so a KO here should hand the win to the defender (cpu).
    state = {
      ...state,
      deck: { ...state.deck, hand: [] },
      cpuDeck: { ...state.cpuDeck, hand: ['toe_drag'] },
      duel: {
        ...state.duel!,
        attacker: { ...state.duel!.attacker, poise: 1 },
        cpuPlan: ['toe_drag'],
      },
    };
    const next = endDuelRound(state);
    expect(next.duel).toBeNull();
    expect(next.lastOutcome!.byKo).toBe(true);
    expect(next.lastOutcome!.winner).toBe('defender');
  });
});

describe('goalies only block', () => {
  it('canPlayCard rejects a non-block card for the goalie side of a shot duel', () => {
    let state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    state = { ...state, cpuDeck: { ...state.cpuDeck, hand: ['deke'] } };
    // Simulate the user being the goalie side: swap userSide to defender.
    state = {
      ...state,
      duel: { ...state.duel!, userSide: 'defender' },
      deck: { ...state.deck, hand: ['deke'] },
    };
    expect(canPlayCard(state, 0)).toBe(false);
  });

  it('planCards never plans a non-block card for the goalie side, even from a hand full of damage cards', () => {
    const state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    const withDamageHand = {
      ...state,
      cpuDeck: {
        ...state.cpuDeck,
        hand: ['deke', 'wrist_shot', 'slapshot', 'toe_drag'],
      },
    };
    const plan = planCards(withDamageHand, 'cpu');
    expect(plan).toEqual([]); // none of those are block cards
  });

  it("a goalie in a shot duel never reduces shooter poise, so the shooter can never be KO'd", () => {
    let state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    state = {
      ...state,
      deck: { ...state.deck, hand: [] },
      cpuDeck: {
        ...state.cpuDeck,
        hand: ['deke', 'wrist_shot', 'slapshot', 'protect_puck'],
      },
    };
    const cpuPlan = planCards(state, 'cpu');
    // Defensive check on the plan itself: every planned card is block-only.
    expect(
      cpuPlan.every((id) =>
        CARDS[id].effects.every((e) => e.type !== 'damage'),
      ),
    ).toBe(true);
    state = { ...state, duel: { ...state.duel!, cpuPlan } };
    const shooterPoiseBefore = state.duel!.attacker.poise;
    const next = endDuelRound(state);
    // Duel continues (goalie dealt no damage); the shooter's poise is untouched.
    expect(next.duel).not.toBeNull();
    expect(next.duel!.attacker.poise).toBe(shooterPoiseBefore);
  });
});

describe('resolveDuel outcome table', () => {
  it('discards both hands', () => {
    let state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    state = {
      ...state,
      deck: { ...state.deck, hand: ['deke'] },
      cpuDeck: { ...state.cpuDeck, hand: ['deke'] },
    };
    const result = resolveDuel(state, 'attacker', true);
    expect(result.deck.hand).toEqual([]);
    expect(result.cpuDeck.hand).toEqual([]);
  });

  it('faceoff: attacker (user C) win gets the puck with no stun', () => {
    const state = createDuel(makeState(), 'faceoff', 'user-C', 'cpu-C');
    const result = resolveDuel(state, 'attacker', true);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(
      result.skaters.find((s) => s.id === 'user-C')!.stunnedUntilTurn,
    ).toBeNull();
    expect(
      result.skaters.find((s) => s.id === 'cpu-C')!.stunnedUntilTurn,
    ).toBeNull();
  });

  it('check: defender (carrier) win stuns the checker and the puck stays with the carrier', () => {
    const state = {
      ...createDuel(makeState(), 'check', 'user-LD', 'cpu-C'),
      puck: { kind: 'carried' as const, skaterId: 'cpu-C' },
    };
    const result = resolveDuel(state, 'defender', true);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
    expect(
      result.skaters.find((s) => s.id === 'user-LD')!.stunnedUntilTurn,
    ).not.toBeNull();
  });

  it('deke: attacker win keeps the puck and stuns the defender; defender win flips both', () => {
    const state = createDuel(makeState(), 'deke', 'user-LW', 'cpu-C');
    const attackerWin = resolveDuel(state, 'attacker', true);
    expect(attackerWin.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(
      attackerWin.skaters.find((s) => s.id === 'cpu-C')!.stunnedUntilTurn,
    ).not.toBeNull();

    const defenderWin = resolveDuel(state, 'defender', true);
    expect(defenderWin.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
    expect(
      defenderWin.skaters.find((s) => s.id === 'user-LW')!.stunnedUntilTurn,
    ).not.toBeNull();
  });

  it('check: attacker (checker) win takes the puck and stuns the carrier', () => {
    const state = createDuel(makeState(), 'check', 'user-LD', 'cpu-C');
    const result = resolveDuel(state, 'attacker', true);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-LD' });
    expect(
      result.skaters.find((s) => s.id === 'cpu-C')!.stunnedUntilTurn,
    ).not.toBeNull();
  });

  it('intercept: attacker win completes the pass to the receiver', () => {
    const state = createDuel(
      makeState(),
      'intercept',
      'user-C',
      'cpu-LD',
      'user-RW',
    );
    const result = resolveDuel(state, 'attacker', false);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });
  });

  it('intercept: defender win gives the lane opponent the puck', () => {
    const state = createDuel(
      makeState(),
      'intercept',
      'user-C',
      'cpu-LD',
      'user-RW',
    );
    const result = resolveDuel(state, 'defender', false);
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-LD' });
  });

  it('shot: attacker win scores a goal and ends the game', () => {
    const state = createDuel(makeState(), 'shot', 'user-C', 'cpu-G');
    const result = resolveDuel(state, 'attacker', true);
    expect(result.phase).toBe('gameOver');
    expect(result.winner).toBe('user');
    expect(result.lastOutcome!.goal).toBe(true);
  });

  it("shot: a clean save (goalie poise === maxPoise) freezes the puck to the nearest skater on the goalie's team, never the goalie itself", () => {
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
  });

  it('shot: a non-clean-save timeout (goalie took poise damage) rebounds loose at the crease front unless a skater stands there', () => {
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
  });
});
