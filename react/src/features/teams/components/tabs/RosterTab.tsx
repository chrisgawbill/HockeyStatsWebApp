import { useMemo } from 'react';

import RosterLinesTabs from '@/features/teams/components/RosterLinesTabs';
import { TeamLinesDto } from '@/features/teams/types/teamLines';
import {
  GoalieStatLine,
  PlayerStatLine,
  Position,
  RosterPlayer,
} from '@/features/teams/types/teamPageTypes';
import { buildTeamLinesView } from '@/features/teams/utils/teamLinesHelper';
import {
  getContrastTextColor,
  getTeamPrimaryColor,
  toDarkModeAccentColor,
} from '@/lib/teamColor';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import { useTheme } from '@/lib/ThemeContext';
import shared from '@/styles/shared.module.css';

interface Props {
  roster: Record<Position, RosterPlayer[]>;
  triCode: string;
  /** Real lines from `/team/lines`; null while loading or when the call failed (projected lines are used). */
  lines: TeamLinesDto | null;
  playerStats: PlayerStatLine[];
  goalieStats: GoalieStatLine[];
}

/**
 * Roster tab: the "Line Change" rink view. Renders projected lines from ice
 * time immediately and swaps to real shift-based lines when `lines` arrives.
 */
export default function RosterTab({
  roster,
  triCode,
  lines,
  playerStats,
  goalieStats,
}: Props) {
  const { theme } = useTheme();
  const { league } = useLeague();
  const view = useMemo(
    () => buildTeamLinesView(roster, lines),
    [roster, lines],
  );
  const base = getTeamPrimaryColor(triCode, league);
  const teamColor = theme === 'dark' ? toDarkModeAccentColor(base, 45) : base;

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Roster</h2>
      <RosterLinesTabs
        view={view}
        teamColor={teamColor}
        teamInk={getContrastTextColor(teamColor)}
        playerStats={playerStats}
        goalieStats={goalieStats}
      />
    </section>
  );
}
