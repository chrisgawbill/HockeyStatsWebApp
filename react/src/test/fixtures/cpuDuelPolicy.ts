import type {
  DuelState,
  GameState,
  RevealResult,
  Role,
  Skater,
} from '@/features/board-game/types/game';
import { makeState as makeBaseState } from '@/test/fixtures/boardGame';
export function makeSkater(
  id: string,
  role: Role,
  team: 'user' | 'cpu' = 'cpu',
): Skater {
  return { id, team, role, pos: { col: 0, row: 0 }, stunned: false };
}
export function makeDuel(overrides: Partial<DuelState> = {}): DuelState {
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
    faceoffPickedCardId: null,
    faceoffCpuCardId: null,
    faceoffJumped: false,
    faceoffResult: null,
    ...overrides,
  };
}
export function makeState(
  cpuHand: string[],
  duel: DuelState,
  cpuRole: Role = 'C',
  lastReveal: RevealResult | null = null,
  userHand: string[] = [],
): GameState {
  return {
    ...makeBaseState(),
    phase: 'duel',
    skaters: [
      makeSkater('user-LD', 'LD', 'user'),
      makeSkater('cpu-C', cpuRole, 'cpu'),
    ],
    puck: { kind: 'carried', skaterId: 'user-LD' },
    deck: { drawPile: [], hand: userHand, discardPile: [], exhaustPile: [] },
    cpuDeck: { drawPile: [], hand: cpuHand, discardPile: [], exhaustPile: [] },
    duel,
    lastReveal,
  };
}
export function makeReveal(userDamageDealt: number): RevealResult {
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
