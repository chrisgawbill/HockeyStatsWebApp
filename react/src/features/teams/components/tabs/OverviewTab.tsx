import TeamStatsRow from '@/features/teams/components/TeamStatsRow';
import PlayerStatsSection from '@/features/teams/components/PlayerStatsSection';
import AiHistoryBlock from '@/features/teams/components/tabs/AiHistoryBlock';
import {
  AiHistoryStatus,
  PlayerStatLine,
  StatItem,
  TeamAiHistory,
  TeamOverview,
} from '@/features/teams/types/teamPageTypes';

interface Props {
  team: TeamOverview;
  aiHistory: TeamAiHistory | null;
  aiHistoryStatus: AiHistoryStatus;
  stats: StatItem[];
  playerStats: PlayerStatLine[];
  headshotMap: Map<number, string>;
}

/**
 * Overview tab. The franchise-history block (arena, founded, Stanley Cups,
 * etc.) is AI-generated and rendered via the shared `AiHistoryBlock`, which
 * gives it its own visually distinct container (`.ai-history-block`) — so it
 * reads as clearly separate from the official NHL stats below it (season
 * stat tiles, stat-leader glance), not re-blended with them. The same AI
 * payload/status also backs the History tab; nothing here fetches or derives
 * it again.
 */
export default function OverviewTab({
  team,
  aiHistory,
  aiHistoryStatus,
  stats,
  playerStats,
  headshotMap,
}: Props) {
  return (
    <>
      <AiHistoryBlock team={team} aiHistory={aiHistory} status={aiHistoryStatus} />
      <TeamStatsRow stats={stats} />
      <PlayerStatsSection players={playerStats} headshotMap={headshotMap} />
    </>
  );
}
