import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { composePlaybook } from '@/features/board-game/data/playbooks';
import { FORMATIONS } from '@/features/board-game/data/formations';
import { createDeck } from '@/features/board-game/engine/deck';
import type {
  GameState,
  Role,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';
import { makeState as makeBaseState } from '@/test/fixtures/boardGame';
export function makeSkater(team: TeamId, role: Role): Skater {
  return {
    id: `${team}-${role}`,
    team,
    role,
    pos: FORMATIONS[team][role],
    stunned: false,
  };
}
export function makeState(overrides: Partial<GameState> = {}): GameState {
  const skaters: Skater[] = (
    ['LW', 'C', 'RW', 'LD', 'RD', 'G'] as Role[]
  ).flatMap((role) => [makeSkater('user', role), makeSkater('cpu', role)]);
  const [deck, seed1] = createDeck(composePlaybook(), 1);
  const [cpuDeck, rngSeed] = createDeck(composePlaybook(), seed1);
  return {
    ...makeBaseState(),
    skaters,
    puck: { kind: 'carried', skaterId: 'user-C' },
    deck,
    cpuDeck,
    rngSeed,
    goaliePoise: {
      user: GOALIE_POISE_BY_LENGTH.long,
      cpu: GOALIE_POISE_BY_LENGTH.long,
    },
    ...overrides,
  };
}
