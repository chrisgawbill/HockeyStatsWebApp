import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import { StatLeaderDto } from '@/features/stat-leaders/api/statLeadersApi';

/** Converts stat-leader contracts into the UI's player-leader model. */
export default function PlayerStatLeaderConverter(leaders: StatLeaderDto[]) {
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
