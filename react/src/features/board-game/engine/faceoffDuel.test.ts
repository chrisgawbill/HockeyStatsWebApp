import { CARDS } from '@/features/board-game/data/cards';
import { MOVE_ALLOWANCE } from '@/features/board-game/data/balance';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
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
import {
  rollBandFromAnticipation,
  rollFaceoffHeadToHead,
} from '@/features/board-game/engine/faceoffModel';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { manhattan } from '@/features/board-game/engine/rink';
import type { FaceoffBand, GameState } from '@/features/board-game/types/game';
import {
  makeFaceoffState,
  withFaceoffCards,
} from '@/test/fixtures/boardScenarios';
import { describe, expect, it } from 'vitest';

/**
 * The smallest seed >= `from` where resolving `band` (the user's real,
 * fixed reaction) against `state`'s forced cards - CPU's band rolled fresh
 * each try, exactly as `resolveFaceoffBand` really does it - satisfies
 * `predicate` on the resulting state. Black-box (drives the real function,
 * not a re-implementation of its math), so it stays correct even if the
 * internals change.
 */
function findSeedWhere(
  state: GameState,
  pickedCardId: string,
  band: FaceoffBand,
  predicate: (result: GameState) => boolean,
  from = 0,
  tries = 5000,
): number {
  for (let seed = from; seed < from + tries; seed++) {
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      pickedCardId,
      band,
    );
    if (predicate(result)) return seed;
  }
  throw new Error('no seed found in range');
}

/** The smallest seed >= `from` where the CPU's own simulated reaction (on `anticipation`) reads `band`. */
function findSeedWhereCpuBandIs(
  anticipation: number,
  band: Exclude<FaceoffBand, 'jump'>,
  from = 0,
): number {
  for (let seed = from; seed < from + 5000; seed++) {
    const [rolled] = rollBandFromAnticipation(anticipation, seed);
    if (rolled === band) return seed;
  }
  throw new Error('no seed found in range');
}

describe('createFaceoffDuel (both centres ante)', () => {
  it('both centres ante deterministically: the user draws 4 and picks 1, the CPU picks and settles', () => {
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

    // Is deterministic for a fixed seed.
    const run = () =>
      createFaceoffDuel(createInitialState(11, 'long'), 'user-C', 'cpu-C');
    expect(run()).toEqual(run());
  });
});

describe('pickFaceoffCard / canPickFaceoffCard', () => {
  it('sets one pick, refusing a second pick or an out-of-range index', () => {
    let state = makeFaceoffState();
    const cardId = state.deck.hand[0];
    expect(canPickFaceoffCard(state, 0)).toBe(true);
    state = pickFaceoffCard(state, 0);
    expect(state.duel!.faceoffPickedCardId).toBe(cardId);
    expect(canPickFaceoffCard(state, 1)).toBe(false);

    // Refuses an out-of-range hand index.
    {
      const state = makeFaceoffState();
      expect(canPickFaceoffCard(state, 99)).toBe(false);
    }
  });
});

describe('pickBestFaceoffCard', () => {
  it('picks the highest-anticipation card offered', () => {
    expect(
      pickBestFaceoffCard(['tie_it_up', 'cheat_the_draw', 'body_the_dot']),
    ).toBe('cheat_the_draw');
  });
});

describe('resolveFaceoffBand: three outcomes, symmetric head-to-head (BG-A15b cycle 2)', () => {
  it('WIN and LOSS: the head-to-head winner carries the puck', () => {
    // The CPU's card here must not carry `scrumOnLoss`, or its own
    // protection would legitimately downgrade this to a scrum - see the
    // dedicated scrumOnLoss tests below.
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'forehand_pull');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedWhere(
      state,
      'quick_hands',
      'clean',
      (r) => r.puck.kind === 'carried' && r.puck.skaterId === 'user-C',
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

    // LOSS: the opponent carries when the CPU wins the head-to-head.
    {
      let state = makeFaceoffState();
      state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
      state = pickFaceoffCard(state, 0);
      const seed = findSeedWhere(
        state,
        'quick_hands',
        'late',
        (r) => r.puck.kind === 'carried' && r.puck.skaterId === 'cpu-C',
      );
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'quick_hands',
        'late',
      );
      expect(result.puck).toEqual({ kind: 'carried', skaterId: 'cpu-C' });
      expect(result.lastOutcome!.winner).toBe('defender');
    }
  });

  it('same non-clean band is a scrum, one-sided clean is a real roll, and a repeat jump forfeits', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    let sawScrum = false;
    let sawCarried = false;
    for (let seed = 0; seed < 200; seed++) {
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'quick_hands',
        'scrum',
      );
      if (result.puck.kind === 'loose') {
        sawScrum = true;
        expect(manhattan(result.puck.pos, FACEOFF_SPOTS.centreIce)).toBe(1);
      } else {
        // A fixed 'scrum' user band ISN'T a scrum whenever the CPU's own
        // (rolled) band differs - either 'clean' (a real, CPU-favoured
        // win/loss roll) or 'late' (a real, user-favoured one - 'scrum'
        // genuinely outcompetes 'late'). Only a tied 'scrum'/'scrum' read is
        // the automatic scrum this test is really after - see
        // `rollFaceoffHeadToHead`'s doc comment and faceoffModel.test.ts for
        // the exact boundary and edge math.
        sawCarried = true;
        expect(result.puck.kind).toBe('carried');
      }
    }
    expect(sawScrum).toBe(true);
    expect(sawCarried).toBe(true);

    // A one-sided clean vs. non-clean band is NOT a scrum - it is a real, band-edge-favoured win/loss roll.
    {
      let state = makeFaceoffState();
      state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
      state = pickFaceoffCard(state, 0);
      // The CPU's own band happens to be clean at this seed (see the seed
      // search above's else-branch reasoning) - a clean-vs-scrum pairing, so
      // it must resolve as a win/loss roll, never a scrum.
      const seed = findSeedWhereCpuBandIs(
        CARDS.quick_hands.anticipation!,
        'clean',
      );
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'quick_hands',
        'scrum',
      );
      expect(result.puck.kind).toBe('carried');
    }

    // A repeat jump forfeits the draw outright for the user (no second re-drop) - the CPU still gets its own real band.
    {
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
      expect(secondJump.lastFaceoffResult!.forfeitedByJump).toBe(true);
      expect(secondJump.lastFaceoffResult!.userBand).toBe('jump');
    }
  });
});

describe('faceoffEffect: backDraw', () => {
  it("a clean win with that card sends the puck to the winner's nearest D instead of the C", () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'win_it_back', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedWhere(
      state,
      'win_it_back',
      'clean',
      (r) => r.puck.kind === 'carried' && r.lastOutcome!.winner === 'attacker',
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
    const seed = findSeedWhere(
      state,
      'body_the_dot',
      'clean',
      (r) => r.puck.kind === 'carried' && r.lastOutcome!.winner === 'attacker',
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'body_the_dot',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(result.skaters.find((s) => s.id === 'cpu-C')!.stunned).toBe(true);

    // The stun lasts through the shift the faceoff opens.
    const opened = gameReducer(result, { type: 'DISMISS_DUEL_RESULT' });
    expect(opened.shift).toBe(result.shift + 1);
    expect(opened.skaters.find((s) => s.id === 'cpu-C')!.stunned).toBe(true);
  });
});

describe('faceoffEffect: bonusSteps', () => {
  it('a clean win with that card adds 1 tile to the opening activation; a plain clean win does not', () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'forehand_pull', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedWhere(
      state,
      'forehand_pull',
      'clean',
      (r) => r.puck.kind === 'carried' && r.lastOutcome!.winner === 'attacker',
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'forehand_pull',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(result.pendingBonusSteps).toBe(1);

    const opened = gameReducer(result, { type: 'DISMISS_DUEL_RESULT' });
    expect(opened.activeTeam).toBe('user');
    expect(opened.stepsLeft).toBe(MOVE_ALLOWANCE + 1);
    expect(opened.pendingBonusSteps).toBe(0);

    // A plain (non-bonus) clean win does not add a tile.
    {
      // Neither card here carries scrumOnLoss, so a user win stays a plain win.
      let state = makeFaceoffState();
      state = withFaceoffCards(state, 'quick_hands', 'quick_hands');
      state = pickFaceoffCard(state, 0);
      const seed = findSeedWhere(
        state,
        'quick_hands',
        'clean',
        (r) =>
          r.puck.kind === 'carried' && r.lastOutcome!.winner === 'attacker',
      );
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'quick_hands',
        'clean',
      );
      expect(result.pendingBonusSteps).toBe(0);
    }
  });
});

describe('faceoffEffect: scrumOnLoss', () => {
  it("downgrades the bearer's clean loss to a scrum but not its win", () => {
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'tie_it_up', 'body_the_dot');
    state = pickFaceoffCard(state, 0);
    const cpuAnticipation = CARDS.body_the_dot.anticipation!;
    const cpuGrip = CARDS.body_the_dot.grip!;
    const userGrip = CARDS.tie_it_up.grip!;
    // Construct (with tie_it_up's OWN real grip, not a stand-in card) a
    // seed where the CPU's band genuinely reads clean AND the head-to-head
    // roll genuinely favours the CPU - i.e. this exact matchup really
    // would be a clean loss for tie_it_up's bearer without its protection.
    let seed = 0;
    for (; ; seed++) {
      const [cpuBand, seedAfterCpuBand] = rollBandFromAnticipation(
        cpuAnticipation,
        seed,
      );
      if (cpuBand !== 'clean') continue;
      const [contest] = rollFaceoffHeadToHead(
        'late',
        userGrip,
        cpuBand,
        cpuGrip,
        seedAfterCpuBand,
      );
      if (contest.outcome === 'win' && !contest.userWins) break;
      if (seed > 5000) throw new Error('no seed found in range');
    }
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'tie_it_up',
      'late',
    );
    expect(result.puck.kind).toBe('loose');
    if (result.puck.kind === 'loose') {
      expect(manhattan(result.puck.pos, FACEOFF_SPOTS.centreIce)).toBe(1);
    }

    // Does not downgrade a win for its own bearer.
    {
      let state = makeFaceoffState();
      state = withFaceoffCards(state, 'tie_it_up', 'quick_hands');
      state = pickFaceoffCard(state, 0);
      const seed = findSeedWhere(
        state,
        'tie_it_up',
        'clean',
        (r) =>
          r.puck.kind === 'carried' && r.lastOutcome!.winner === 'attacker',
      );
      const result = resolveFaceoffBand(
        { ...state, rngSeed: seed },
        'tie_it_up',
        'clean',
      );
      expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    }
  });
});

describe('faceoffEffect: freeJump', () => {
  it('freeJump re-drops at the full window; without it the window narrows', () => {
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

    // A card without freeJump narrows the clean window on the re-drop.
    {
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
    }
  });
});

describe('the CPU centre goes through the identical head-to-head contest as the user (no privileged path)', () => {
  it("the CPU's band genuinely varies and the user wins off a clean band the same way", () => {
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
        const stunned = result.skaters.find((s) => s.id === 'user-C')!.stunned;
        if (stunned) sawFired = true;
        else sawNotFired = true;
      }
    }
    expect(sawFired).toBe(true);
    expect(sawNotFired).toBe(true);

    // The user can win outright off a clean band exactly like the CPU can - the identical formula runs from either side.
    let state = makeFaceoffState();
    state = withFaceoffCards(state, 'body_the_dot', 'quick_hands');
    state = pickFaceoffCard(state, 0);
    const seed = findSeedWhere(
      state,
      'body_the_dot',
      'clean',
      (r) => r.puck.kind === 'carried' && r.puck.skaterId === 'user-C',
    );
    const result = resolveFaceoffBand(
      { ...state, rngSeed: seed },
      'body_the_dot',
      'clean',
    );
    expect(result.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
  });
});

describe('pickDefendingDot', () => {
  it('picks the dot nearest the shooter row, breaking ties with a seeded flip', () => {
    const dots = FACEOFF_SPOTS.defendingDots.cpu;
    const [nearRow1] = pickDefendingDot(dots, 1, 0);
    expect(nearRow1).toEqual(dots[0]);
    const [nearRow5] = pickDefendingDot(dots, 6, 0);
    expect(nearRow5).toEqual(dots[1]);

    // Breaks an equidistant tie with a seeded flip, deterministic for a fixed seed.
    {
      const dots = FACEOFF_SPOTS.defendingDots.cpu;
      const a = pickDefendingDot(dots, 3, 7);
      const b = pickDefendingDot(dots, 3, 7);
      expect(a).toEqual(b);
    }
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
