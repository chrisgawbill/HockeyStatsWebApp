import BasicInfoStrip from '@/features/teams/components/BasicInfoStrip';
import LoadingState from '@/components/LoadingState';
import {
  AiHistoryStatus,
  TeamAiHistory,
  TeamOverview,
} from '@/features/teams/types/teamPageTypes';
import styles from '@/features/teams/components/TeamPage.module.css';

interface Props {
  team: TeamOverview;
  aiHistory: TeamAiHistory | null;
  status: AiHistoryStatus;
}

/**
 * The single AI-generated franchise-history block (arena, founded, Stanley
 * Cups, etc. via the existing BasicInfoStrip), gated by the shared
 * loading/error/ready status.
 *
 * TeamPage fetches the AI payload exactly once; both the Overview tab (in its
 * own visually distinct container, kept apart from official stats) and the
 * History tab render THIS component rather than each having their own copy
 * of the status handling.
 */
export default function AiHistoryBlock({ team, aiHistory, status }: Props) {
  return (
    <div className={styles['ai-history-block']}>
      {status === 'loading' && (
        <LoadingState label="Loading AI-generated history" />
      )}
      {status === 'error' && (
        <p className={styles['tab-empty-state']}>
          Couldn&apos;t load AI-generated history for this team right now.
        </p>
      )}
      {status === 'ready' && aiHistory && (
        <BasicInfoStrip team={{ ...team, ...aiHistory }} />
      )}
    </div>
  );
}
