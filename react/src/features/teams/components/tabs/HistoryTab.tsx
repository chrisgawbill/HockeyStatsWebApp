import AiHistoryBlock from '@/features/teams/components/tabs/AiHistoryBlock';
import {
  AiHistoryStatus,
  TeamAiHistory,
  TeamOverview,
} from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';

interface Props {
  team: TeamOverview;
  aiHistory: TeamAiHistory | null;
  status: AiHistoryStatus;
}

/**
 * History tab: dedicated home for the AI-generated franchise history via the
 * shared AiHistoryBlock (disclaimer + loading/error/ready states included).
 */
export default function HistoryTab({ team, aiHistory, status }: Props) {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>History</h2>
      <AiHistoryBlock team={team} aiHistory={aiHistory} status={status} />
    </section>
  );
}
