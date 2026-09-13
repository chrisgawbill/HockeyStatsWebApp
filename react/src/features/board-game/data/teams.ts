import type { TeamId } from '@/features/board-game/types/game';

/** Display name for each team (user = Blue, cpu = Red). */
export const TEAM_NAME: Record<TeamId, string> = {
  user: 'Blue',
  cpu: 'Red',
};
