import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
export function makeLeader(statIndicator: string): TopStatLeader {
  const player = new PlayerStatLeader(
    1,
    'Connor',
    'McDavid',
    97,
    '',
    'EDM',
    'Oilers',
    '',
    'C',
    true,
    10,
  );
  return new TopStatLeader(statIndicator, player, [player]);
}
