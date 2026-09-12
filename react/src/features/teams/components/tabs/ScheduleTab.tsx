import ScheduleStrip from '@/features/teams/components/ScheduleStrip';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';

interface Props {
  games: ScheduledGame[];
  teamAbbrev: string;
  sourceLabel: string;
  sourcePath: string;
  activeNavPath: string;
}

/** Schedule tab: thin pass-through to the existing ScheduleStrip. */
export default function ScheduleTab(props: Props) {
  return <ScheduleStrip {...props} />;
}
