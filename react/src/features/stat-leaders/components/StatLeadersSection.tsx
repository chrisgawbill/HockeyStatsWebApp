import { useState } from 'react';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import StatLeaderCard from '@/features/stat-leaders/components/StatLeaderCard';
import EmptyState from '@/components/EmptyState';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useHorizontalSwipe } from '@/lib/useHorizontalSwipe';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import { listAvailableLeaders } from '@/features/stat-leaders/utils/availableLeaders';
import rowStyles from '@/components/FavoriteRow.module.css';
import styles from '@/features/stat-leaders/components/StatLeadersSection.module.css';

type PlayerGroup = 'skaters' | 'goalies';

const PHONE_QUERY = '(max-width: 767px)';

const GROUP_LABELS: Record<PlayerGroup, string> = {
  skaters: 'Skaters',
  goalies: 'Goalies',
};

/** Swipe order: swiping left moves to the next group, right to the previous. */
const GROUP_ORDER: PlayerGroup[] = ['skaters', 'goalies'];

/** Singular group name used in the empty-state message. */
const GROUP_NOUNS: Record<PlayerGroup, string> = {
  skaters: 'skater',
  goalies: 'goalie',
};

interface StatLeadersSectionProps {
  skaterLeaders: (TopStatLeader | undefined)[];
  goalieLeaders: (TopStatLeader | undefined)[];
}

interface LeaderGridProps {
  group: PlayerGroup;
  leaders: TopStatLeader[];
  /** Id of the heading that names this grid. */
  headingId: string;
}

/** A 2-column grid of one group's leader cards, or an empty state naming the season. */
function LeaderGrid({ group, leaders, headingId }: LeaderGridProps) {
  const { season } = useSeason();
  if (leaders.length < 1) {
    return (
      <EmptyState
        message={`No ${GROUP_NOUNS[group]} stat leaders available for ${formatSeasonLabel(season)}.`}
      />
    );
  }
  return (
    <ul className={rowStyles.grid} aria-labelledby={headingId}>
      {leaders.map((leader) => (
        <StatLeaderCard key={leader.statIndicator} topStatLeader={leader} />
      ))}
    </ul>
  );
}

/** Skaters / Goalies switch built from toggle buttons. */
function GroupSwitch({
  selectedGroup,
  onSelect,
}: {
  selectedGroup: PlayerGroup;
  onSelect: (group: PlayerGroup) => void;
}) {
  return (
    <div className={styles.switch}>
      {(Object.keys(GROUP_LABELS) as PlayerGroup[]).map((group) => (
        <button
          key={group}
          type="button"
          className={styles.switchButton}
          aria-pressed={selectedGroup === group}
          onClick={() => onSelect(group)}
        >
          {GROUP_LABELS[group]}
        </button>
      ))}
    </div>
  );
}

/** The group one step from `group` in swipe order; stays put at either end. */
function getNeighborGroup(group: PlayerGroup, step: 1 | -1): PlayerGroup {
  const neighborIndex = GROUP_ORDER.indexOf(group) + step;
  return GROUP_ORDER[neighborIndex] ?? group;
}

/**
 * Home-page stat leaders as favorite-style cards. Phones show one "Stat
 * leaders" section with a Skaters / Goalies switch over a 2x2 grid that can
 * also be swiped; wider screens show both groups, each under its own heading.
 */
export default function StatLeadersSection({
  skaterLeaders,
  goalieLeaders,
}: StatLeadersSectionProps) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [selectedGroup, setSelectedGroup] = useState<PlayerGroup>('skaters');
  const swipeProps = useHorizontalSwipe({
    onSwipeLeft: () => setSelectedGroup((group) => getNeighborGroup(group, 1)),
    onSwipeRight: () =>
      setSelectedGroup((group) => getNeighborGroup(group, -1)),
  });
  const leadersByGroup: Record<PlayerGroup, TopStatLeader[]> = {
    skaters: listAvailableLeaders(skaterLeaders),
    goalies: listAvailableLeaders(goalieLeaders),
  };

  if (isPhone) {
    return (
      <section className={styles.section} aria-labelledby="stat-leaders-title">
        <h2 id="stat-leaders-title" className={rowStyles.title}>
          Stat leaders
        </h2>
        <GroupSwitch
          selectedGroup={selectedGroup}
          onSelect={setSelectedGroup}
        />
        <div className={styles.swipeArea} {...swipeProps}>
          <div key={selectedGroup} className={styles.groupPanel}>
            <LeaderGrid
              group={selectedGroup}
              leaders={leadersByGroup[selectedGroup]}
              headingId="stat-leaders-title"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className={styles.section}
        aria-labelledby="skater-leaders-title"
      >
        <h2 id="skater-leaders-title" className={rowStyles.title}>
          Skater leaders
        </h2>
        <LeaderGrid
          group="skaters"
          leaders={leadersByGroup.skaters}
          headingId="skater-leaders-title"
        />
      </section>
      <section
        className={styles.section}
        aria-labelledby="goalie-leaders-title"
      >
        <h2 id="goalie-leaders-title" className={rowStyles.title}>
          Goalie leaders
        </h2>
        <LeaderGrid
          group="goalies"
          leaders={leadersByGroup.goalies}
          headingId="goalie-leaders-title"
        />
      </section>
    </>
  );
}
