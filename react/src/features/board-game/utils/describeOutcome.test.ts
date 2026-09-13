import { describe, expect, it } from 'vitest';
import { describeOutcome } from '@/features/board-game/utils/describeOutcome';
import type { DuelOutcome, Skater } from '@/features/board-game/types/game';

function makeSkater(overrides: Partial<Skater> = {}): Skater {
  return {
    id: 'user-C',
    team: 'user',
    role: 'C',
    pos: { col: 5, row: 3 },
    stunnedUntilTurn: null,
    ...overrides,
  };
}

const skaters: Skater[] = [
  makeSkater({ id: 'user-C', team: 'user', role: 'C' }),
  makeSkater({ id: 'cpu-C', team: 'cpu', role: 'C' }),
  makeSkater({ id: 'user-LW', team: 'user', role: 'LW' }),
  makeSkater({ id: 'cpu-LD', team: 'cpu', role: 'LD' }),
  makeSkater({ id: 'cpu-C-checker', team: 'cpu', role: 'C' }),
  makeSkater({ id: 'user-RW', team: 'user', role: 'RW' }),
  makeSkater({ id: 'cpu-RD', team: 'cpu', role: 'RD' }),
  makeSkater({ id: 'cpu-G', team: 'cpu', role: 'G' }),
];

function makeOutcome(overrides: Partial<DuelOutcome> = {}): DuelOutcome {
  return {
    kind: 'faceoff',
    winner: 'attacker',
    byKo: false,
    attackerId: 'user-C',
    defenderId: 'cpu-C',
    goal: false,
    cleanSave: false,
    summary: 'debug summary',
    receiverId: null,
    ...overrides,
  };
}

describe('describeOutcome', () => {
  it('describes a faceoff win', () => {
    const outcome = makeOutcome({
      kind: 'faceoff',
      winner: 'attacker',
      attackerId: 'user-C',
      defenderId: 'cpu-C',
    });
    expect(describeOutcome(outcome, skaters)).toBe('Blue C wins the faceoff');
  });

  it('describes a deke attacker win', () => {
    const outcome = makeOutcome({
      kind: 'deke',
      winner: 'attacker',
      attackerId: 'user-LW',
      defenderId: 'cpu-LD',
    });
    expect(describeOutcome(outcome, skaters)).toBe('Blue LW dekes past Red LD');
  });

  it('describes a deke defender win', () => {
    const outcome = makeOutcome({
      kind: 'deke',
      winner: 'defender',
      attackerId: 'user-LW',
      defenderId: 'cpu-LD',
    });
    expect(describeOutcome(outcome, skaters)).toBe('Red LD strips Blue LW');
  });

  it('describes a check attacker win', () => {
    const outcome = makeOutcome({
      kind: 'check',
      winner: 'attacker',
      attackerId: 'cpu-C-checker',
      defenderId: 'user-RW',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'Red C checks Blue RW and takes the puck',
    );
  });

  it('describes a check defender win', () => {
    const outcome = makeOutcome({
      kind: 'check',
      winner: 'defender',
      attackerId: 'cpu-C-checker',
      defenderId: 'user-RW',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      "Blue RW shrugs off Red C's check",
    );
  });

  it('describes an intercept attacker win using the receiver', () => {
    const outcome = makeOutcome({
      kind: 'intercept',
      winner: 'attacker',
      attackerId: 'user-C',
      defenderId: 'cpu-RD',
      receiverId: 'user-RW',
    });
    expect(describeOutcome(outcome, skaters)).toBe('Pass completed to Blue RW');
  });

  it('describes an intercept attacker win falling back to the attacker when receiverId is null', () => {
    const outcome = makeOutcome({
      kind: 'intercept',
      winner: 'attacker',
      attackerId: 'user-C',
      defenderId: 'cpu-RD',
      receiverId: null,
    });
    expect(describeOutcome(outcome, skaters)).toBe('Pass completed to Blue C');
  });

  it('describes an intercept defender win', () => {
    const outcome = makeOutcome({
      kind: 'intercept',
      winner: 'defender',
      attackerId: 'user-C',
      defenderId: 'cpu-RD',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'Red RD intercepts the pass',
    );
  });

  it('describes a shot goal', () => {
    const outcome = makeOutcome({
      kind: 'shot',
      winner: 'attacker',
      attackerId: 'user-RW',
      defenderId: 'cpu-G',
      goal: true,
    });
    expect(describeOutcome(outcome, skaters)).toBe('GOAL! Blue RW scores');
  });

  it('describes a shot freeze (clean save)', () => {
    const outcome = makeOutcome({
      kind: 'shot',
      winner: 'defender',
      byKo: false,
      cleanSave: true,
      attackerId: 'user-RW',
      defenderId: 'cpu-G',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'Red G freezes the puck — clean save',
    );
  });

  it('describes a shot rebound (not a clean save)', () => {
    const outcome = makeOutcome({
      kind: 'shot',
      winner: 'defender',
      byKo: false,
      cleanSave: false,
      attackerId: 'user-RW',
      defenderId: 'cpu-G',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'Red G makes the save — rebound!',
    );
  });

  it('appends ", by knockout" for a non-shot KO win', () => {
    const outcome = makeOutcome({
      kind: 'deke',
      winner: 'attacker',
      byKo: true,
      attackerId: 'user-LW',
      defenderId: 'cpu-LD',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'Blue LW dekes past Red LD, by knockout',
    );
  });

  it('falls back to an unknown skater id verbatim', () => {
    const outcome = makeOutcome({
      kind: 'faceoff',
      winner: 'attacker',
      attackerId: 'ghost-skater',
      defenderId: 'cpu-C',
    });
    expect(describeOutcome(outcome, skaters)).toBe(
      'ghost-skater wins the faceoff',
    );
  });
});
