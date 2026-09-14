import { describe, expect, it } from 'vitest';
import { CARDS } from '@/features/board-game/data/cards';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import {
  FACEOFF_ANTE_SIZE,
  canPickFaceoffCard,
  createFaceoffDuel,
  faceoffBandWindowsFor,
  pickBestFaceoffCard,
  pickDefendingDot,
  pickFaceoffCard,
  resolveFaceoffBand,
} from '@/features/board-game/engine/faceoffDuel';
import { rollFaceoffContest } from '@/features/board-game/engine/faceoffModel';
import { manhattan } from '@/features/board-game/engine/rink';
import type { FaceoffBand, GameState } from '@/features/board-game/types/game';

/** Fresh state right after START_FACEOFF (the opening centre-ice draw). */
function makeFaceoffState(seed = 1): GameState {
  const state = createInitialState(seed, 'long');
  return gameReducer(state, { type: 'START_FACEOFF' });
}

/** Forces the user's and CPU's ante picks for a deterministic scenario. */
function withFaceoffCards(
  state: GameState,
  userCardId: string,
  cpuCardId: string,
): GameState {
  return {
    ...state,
    deck: { ...state.deck, hand: [userCardId] },
    duel: { ...state.duel!, faceoffCpuCardId: cpuCardId },
  };
}

/** The smallest seed >= `from` where the user's own contest resolves to `won`. */
function findSeedForWin(
  band: Exclude<FaceoffBand, 'jump'>,
  userGrip: number,
  cpuGrip: number,
  won: boolean,
  from = 0,
): number {
  for (let seed = from; seed < from + 5000; seed++) {
    const [result] = rollFaceoffContest(band, userGrip, cpuGrip, false, seed);
    if (result.won === won) return seed;
  }
  throw new Error('no seed found in range');
}

describe('createFaceoffDuel (ante)', () => {
  it('draws a faceoff-pool ante (draw 4 = 3 + the C perk, pick 1) and has the CPU centre pick+settle its own card immediately', () => {
    const state = makeFaceoffState();
    expect(state.phase).toBe('duel');
    expect(state.duel!.kind).toBe('faceoff');
    expect(FACEOFF_ANTE_SIZE).toBe(4);
    expect(state.deck.hand.length).toBeGreaterThan(0);
    expect(state.deck.hand.length).toBeLessThanOrEqual(FACEOFF_ANTE_SIZE);
    expect(
      state.deck.hand.every((id) => CARDS[id].tags.includes('faceoff')),
    ).toBe(true);
    expect(state.duel!.faceoffPickedCardId).toBeNull();
    expect(state.duel!.faceoffCpuCardId).not.toBeNull();
    expect(CARDS[state.duel!.faceoffCpuCardId!].tags).toContain('faceoff');
    // The CPU's picked card is already out of its own deck's hand (settled).
    expect(state.cpuDeck.hand).not.toContain(state.duel!.faceoffCpuCardId);
  });

  it('is deterministic for a fixed seed', () => {
    const run = () =>
      createFaceoffDuel(createInitialState(11, 'long'), 'user-C', 'cpu-C');
    expect(run()).toEqual(run());
  });
});

describe('pickFaceoffCard / canPickFaceoffCard', () => {
  it('sets the pick and refuses a second pick', () => {
    let state = makeFaceoffState();
    const cardId = state.deck.hand[0];
    expect(canPickFaceoffCard(state, 0)).toBe(true);
    state = pickFaceoffCard(state, 0);
    expect(state.duel!.faceoffPickedCardId).toBe(cardId);
    expect(canPickFaceoffCard(state, 1)).toBe(false);
  });

  it('refuses an out-of-range hand index', () => {
    const state = makeFaceoffState();
    expect(canPickFaceoffCard(state, 99)).toBe(false);
  });
});

describe('pickBestFaceoffCard', () => {
  it('picks the highest-anticipation card offered', () => {
    expect(
      pickBestFaceoffCard(['tie_it_up', 'cheat_the_draw', 'body_the_dot']),
    ).toBe('cheat_the_draw');
  });
});

describe('resolveFaceoffBand: three outcomes', () => {
  it('CLEAN WIN: the winner carries the puck', () => {
    // The CPU's card here must not carry `scrumOnLoss`, or its own
    // protection would legitimately downgrade this to a scrum - see the
    // dedicated scrumOnLoss tests below.
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'forehand_pull');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.quick_hands.grip!,
      CARDS.forehand_pull.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'quick_hands',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(result.lastOutcome!.kind).toBe('faceoff');
    expect(result.lastOutcome!.winner).toBe('attacker');
    expect(result.duel).toBeNull();
  });

  it('SCRUM (scrum band): the puck goes loose on a free tile adjacent to the dot, regardless of the contest roll', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    for (let seed = 0; seed < 20; seed++) {
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'quick_hands',
        'scrum',
      );
      expect(result.puck.kind).toBe('loose');
      if (result.puck.kind === 'loose') {
        expect(manhattan(result.puck.pos, FACEOFF_SPOTS.centreIce)).toBe(1);
      }
    }
  });

  it('LOSS: the opponent carries when the user does not win', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'late',
      CARDS.quick_hands.grip!,
      CARDS.quick_hands.grip!,
      false,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'quick_hands',
      'late',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
    expect(result.lastOutcome!.winner).toBe('defender');
  });

  it('a repeat jump loses outright (no second re-drop)', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const firstJump = resolveFaceoffBand(
      { ...state, rngSeed: 5 },
      'quick_hands',
      'jump',
    );
    expect(firstJump.duel).not.toBeNull();
    expect(firstJump.duel!.faceoffJumped).toBe(true);
    const secondJump = resolveFaceoffBand(firstJump, 'quick_hands', 'jump');
    expect(secondJump.duel).toBeNull();
    expect(secondJump.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
  });
});

describe('faceoffEffect: backDraw', () => {
  it('a clean win with that card sends the puck to the winner’s nearest D instead of the C', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'win_it_back', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.win_it_back.grip!,
      CARDS.quick_hands.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'win_it_back',
      'clean',
    );
    const puck = result.puck;
    expect(puck.kind).toBe('carried');
    if (puck.kind === 'carried') {
      expect(puck.skaterId).not.toBe('user-C');
      const carrier = result.skaters.find((s) => s.id === puck.skaterId)!;
      expect(carrier.team).toBe('user');
      expect(['LD', 'RD']).toContain(carrier.role);
    }
  });
});

describe('faceoffEffect: stunLoser', () => {
  it('a clean win with that card stuns the opposing centre', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'body_the_dot', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.body_the_dot.grip!,
      CARDS.quick_hands.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'body_the_dot',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(
      result.skaters.find((s) => s.id === 'cpu-C')!.stunnedUntilTurn,
    ).not.toBeNull();
  });
});

describe('faceoffEffect: bonusMp', () => {
  it('a clean win with that card adds 1 MP to the winning side’s next roll', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'forehand_pull', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.forehand_pull.grip!,
      CARDS.quick_hands.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'forehand_pull',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(result.pendingBonusMp).toBe(1);

    const dismissed = gameReducer(result, { type: 'DISMISS_DUEL_RESULT' });
    const rolled = gameReducer(dismissed, { type: 'ROLL_DICE' });
    const [d1, d2] = rolled.dice!;
    expect(rolled.mp).toBe(d1 + d2 + 1);
    expect(rolled.pendingBonusMp).toBe(0);
  });

  it('a plain (non-bonus) clean win does not add MP', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'tie_it_up');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.quick_hands.grip!,
      CARDS.tie_it_up.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'quick_hands',
      'clean',
    );
    expect(result.pendingBonusMp).toBe(0);
  });
});

describe('faceoffEffect: scrumOnLoss', () => {
  it("downgrades what would otherwise be a loss for the card's bearer into a scrum", () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'tie_it_up', 'body_the_dot');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'late',
      CARDS.tie_it_up.grip!,
      CARDS.body_the_dot.grip!,
      false,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'tie_it_up',
      'late',
    );
    expect(result.puck.kind).toBe('loose');
    if (result.puck.kind === 'loose') {
      expect(manhattan(result.puck.pos, FACEOFF_SPOTS.centreIce)).toBe(1);
    }
  });

  it('does not downgrade a win for its own bearer', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'tie_it_up', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedForWin(
      'clean',
      CARDS.tie_it_up.grip!,
      CARDS.quick_hands.grip!,
      true,
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'tie_it_up',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
  });
});

describe('faceoffEffect: freeJump', () => {
  it('re-drops at the full window, not the narrowed one, after a jump', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'cheat_the_draw', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const before = faceoffBandWindowsFor(state)!;
    const jumped = resolveFaceoffBand(
      { ...state, rngSeed: 5 },
      'cheat_the_draw',
      'jump',
    );
    expect(jumped.duel!.faceoffJumped).toBe(true);
    const after = faceoffBandWindowsFor(jumped)!;
    expect(after.cleanWindowMs).toBe(before.cleanWindowMs);
  });

  it('a card without freeJump narrows the clean window on the re-drop', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const before = faceoffBandWindowsFor(state)!;
    const jumped = resolveFaceoffBand(
      { ...state, rngSeed: 5 },
      'quick_hands',
      'jump',
    );
    const after = faceoffBandWindowsFor(jumped)!;
    expect(after.cleanWindowMs).toBeLessThan(before.cleanWindowMs);
  });
});

describe('the CPU centre resolves through the same rollFaceoffContest as the user', () => {
  it("its own card's effect fires on some of its wins and not others - proof it runs a real, independent contest rather than a fixed rule", () => {
    const base = pickFaceoffCard(
      withFaceoffCards(makeFaceoffState(), 'quick_hands', 'body_the_dot'),
      0,
    );
    let sawFired = false;
    let sawNotFired = false;
    for (let seed = 0; seed < 4000 && !(sawFired && sawNotFired); seed++) {
      const result = resolveFaceoffBand(
        { ...base, rngSeed: seed },
        'quick_hands',
        'late',
      );
      if (result.puck.kind === 'carried' && result.puck.skaterId === 'cpu-C') {
        const stunned =
          result.skaters.find((s) => s.id === 'user-C')!.stunnedUntilTurn !==
          null;
        if (stunned) sawFired = true;
        else sawNotFired = true;
      }
    }
    expect(sawFired).toBe(true);
    expect(sawNotFired).toBe(true);
  });
});

describe('pickDefendingDot', () => {
  it('picks the dot nearest the shooter row', () => {
    const dots = FACEOFF_SPOTS.defendingDots.cpu;
    const [nearRow1] = pickDefendingDot(dots, 1, 0);
    expect(nearRow1).toEqual(dots[0]);
    const [nearRow5] = pickDefendingDot(dots, 6, 0);
    expect(nearRow5).toEqual(dots[1]);
  });

  it('breaks an equidistant tie with a seeded flip, deterministic for a fixed seed', () => {
    const dots = FACEOFF_SPOTS.defendingDots.cpu;
    const a = pickDefendingDot(dots, 3, 7);
    const b = pickDefendingDot(dots, 3, 7);
    expect(a).toEqual(b);
  });
});

describe('AUTO_RESOLVE_FACEOFF', () => {
  it('resolves without a band press and is deterministic for a fixed seed', () => {
    const run = () => {
      let state = createInitialState(9, 'long');
      state = gameReducer(state, { type: 'START_FACEOFF' });
      state = gameReducer(state, { type: 'PICK_FACEOFF_CARD', handIndex: 0 });
      return gameReducer(state, { type: 'AUTO_RESOLVE_FACEOFF' });
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.duel).toBeNull();
    expect(a.phase).toBe('duelResult');
    expect(a.lastOutcome!.kind).toBe('faceoff');
  });
});

describe('end-to-end determinism via the reducer', () => {
  it('the same seed and action list give a deep-equal final state', () => {
    const run = () => {
      let state = createInitialState(42, 'long');
      state = gameReducer(state, { type: 'START_FACEOFF' });
      state = gameReducer(state, { type: 'PICK_FACEOFF_CARD', handIndex: 0 });
      return gameReducer(state, {
        type: 'RESOLVE_FACEOFF_BAND',
        band: 'clean',
      });
    };
    expect(run()).toEqual(run());
  });
});
