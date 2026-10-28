import {
  GameState,
  Skater,
  CardDef,
  DuelOutcome,
} from '@/features/board-game/types/game';

export function makeSkater(overrides: Partial<Skater> = {}): Skater {
  return {
    id: 'user-C',
    team: 'user',
    role: 'C',
    pos: { col: 5, row: 3 },
    stunnedUntilTurn: null,
    ...overrides,
  };
}
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'move',
    length: 'long',
    bonusEnergy: 0,
    activeTeam: 'user',
    turn: 1,
    mp: 3,
    dice: null,
    skaters: [],
    puck: { kind: 'loose', pos: { col: 7, row: 3 } },
    deck: { drawPile: [], hand: [], discardPile: [], exhaustPile: [] },
    cpuDeck: { drawPile: [], hand: [], discardPile: [], exhaustPile: [] },
    duel: null,
    lastOutcome: null,
    lastReveal: null,
    lastShotSaveResult: null,
    lastFaceoffResult: null,
    winner: null,
    rngSeed: 1,
    actionsThisTurn: 0,
    whistle: false,
    goaliePoise: { user: 43, cpu: 43 },
    faceoffSpot: { col: 7, row: 3 },
    pendingBonusMp: 0,
    ...overrides,
  };
}

export function makeCard(overrides: Partial<CardDef> = {}): CardDef {
  return {
    id: 'protect_puck',
    name: 'Protect Puck',
    cost: 1,
    text: '5 block',
    tags: ['block'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'block', amount: 5 }],
    ...overrides,
  };
}

export const skaters: Skater[] = [
  makeSkater({ id: 'user-C', team: 'user', role: 'C' }),
  makeSkater({ id: 'cpu-C', team: 'cpu', role: 'C' }),
  makeSkater({ id: 'user-LW', team: 'user', role: 'LW' }),
  makeSkater({ id: 'cpu-LD', team: 'cpu', role: 'LD' }),
  makeSkater({ id: 'cpu-C-checker', team: 'cpu', role: 'C' }),
  makeSkater({ id: 'user-RW', team: 'user', role: 'RW' }),
  makeSkater({ id: 'cpu-RD', team: 'cpu', role: 'RD' }),
  makeSkater({ id: 'cpu-G', team: 'cpu', role: 'G' }),
];
export function makeOutcome(overrides: Partial<DuelOutcome> = {}): DuelOutcome {
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
