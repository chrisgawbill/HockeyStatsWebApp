import type { Coord, Role, TeamId } from '@/features/board-game/types/game';

/** Every skater role, in a stable order used to build a team's six skaters. */
export const ROLES: Role[] = ['LW', 'C', 'RW', 'LD', 'RD', 'G'];

/** Starting position per team (user = Blue, cpu = Red) and role. */
export const FORMATIONS: Record<TeamId, Record<Role, Coord>> = {
  user: {
    G: { col: 0, row: 3 },
    LD: { col: 3, row: 2 },
    RD: { col: 3, row: 4 },
    LW: { col: 6, row: 1 },
    C: { col: 6, row: 3 },
    RW: { col: 6, row: 5 },
  },
  cpu: {
    G: { col: 14, row: 3 },
    LD: { col: 11, row: 4 },
    RD: { col: 11, row: 2 },
    LW: { col: 8, row: 5 },
    C: { col: 8, row: 3 },
    RW: { col: 8, row: 1 },
  },
};
