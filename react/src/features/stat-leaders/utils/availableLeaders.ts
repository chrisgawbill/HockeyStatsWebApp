import type { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';

/** Keeps the categories that have loaded, in their original order. */
export function listAvailableLeaders(
  categoryLeaders: (TopStatLeader | undefined)[],
): TopStatLeader[] {
  return categoryLeaders.filter(
    (leader): leader is TopStatLeader => leader !== undefined,
  );
}
