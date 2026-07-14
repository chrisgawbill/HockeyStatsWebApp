import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';

/**
 * The backend (api/services/mappers/playerMapper.js -> mapStatLeaders) now returns
 * a flat array of StatLeaderContract for the requested category, with the fragile
 * `.default` unwrapping already done defensively server-side. This converter just
 * wraps each contract in the PlayerStatLeader model the UI expects.
 */
export default function PlayerStatLeaderConverter(leaders: any[]) {
  let playerStatLeaderArray: PlayerStatLeader[] = [];
  if (!Array.isArray(leaders)) return playerStatLeaderArray;

  for (let i = 0; i < leaders.length; i++) {
    const leader = leaders[i];
    const playerStatLeader: PlayerStatLeader = new PlayerStatLeader(
      leader.id,
      leader.firstName,
      leader.lastName,
      leader.sweaterNumber,
      leader.headshot,
      leader.teamAbbrev,
      leader.teamName,
      leader.teamLogo,
      leader.position,
      true,
      leader.value,
    );
    playerStatLeaderArray.push(playerStatLeader);
  }
  return playerStatLeaderArray;
}
