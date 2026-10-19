import React, { useId, useRef, useState } from 'react';

import BenchStrip from '@/features/teams/components/BenchStrip';
import GoalieCrease from '@/features/teams/components/GoalieCrease';
import LineCarousel from '@/features/teams/components/LineCarousel';
import { TeamLinesView } from '@/features/teams/utils/teamLinesHelper';
import { PositionGroup } from '@/features/teams/types/teamPageTypes';
import teamStyles from '@/features/teams/components/TeamPage.module.css';
import styles from '@/features/teams/components/RosterLines.module.css';

interface RosterLinesTabsProps {
  view: TeamLinesView;
  teamColor: string;
  teamInk: string;
}

const TABS: PositionGroup[] = ['Forwards', 'Defense', 'Goalies'];

/**
 * "Line Change" roster view: Forwards | Defense | Goalies tabs (ARIA tablist
 * with arrow-key navigation) over rink-strip carousels and the goalie crease.
 */
export default function RosterLinesTabs({
  view,
  teamColor,
  teamInk,
}: RosterLinesTabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useState<PositionGroup>('Forwards');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(group: PositionGroup, focus = false) {
    setSelected(group);
    if (focus) tabRefs.current[group]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft')
      next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    select(TABS[next], true);
  }

  const tabId = (g: string) => `${baseId}-tab-${g}`;
  const panelId = (g: string) => `${baseId}-panel-${g}`;

  return (
    <div
      className={styles.lines}
      style={
        {
          '--rink-team': teamColor,
          '--rink-team-ink': teamInk,
        } as React.CSSProperties
      }
    >
      <div
        className={teamStyles['player-stat-categories']}
        role="tablist"
        aria-label="Roster groups"
      >
        {TABS.map((group, i) => (
          <button
            key={group}
            ref={(el) => {
              tabRefs.current[group] = el;
            }}
            id={tabId(group)}
            type="button"
            role="tab"
            aria-selected={selected === group}
            aria-controls={panelId(group)}
            tabIndex={selected === group ? 0 : -1}
            className={`${teamStyles['player-stat-tab']} ds-button ${selected === group ? teamStyles.active : ''}`}
            onClick={() => select(group)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {group}
          </button>
        ))}
      </div>

      <div
        id={panelId('Forwards')}
        role="tabpanel"
        aria-labelledby={tabId('Forwards')}
        hidden={selected !== 'Forwards'}
      >
        <LineCarousel
          lines={view.forwardLines}
          view={view}
          ariaLabel="Forward lines"
          columns={2}
        />
        <BenchStrip title="Extras" players={view.extras.forwards} slot="F" />
      </div>

      <div
        id={panelId('Defense')}
        role="tabpanel"
        aria-labelledby={tabId('Defense')}
        hidden={selected !== 'Defense'}
      >
        <LineCarousel
          lines={view.defensePairs}
          view={view}
          ariaLabel="Defense pairs"
          columns={3}
        />
        <BenchStrip title="Extras" players={view.extras.defense} slot="D" />
      </div>

      <div
        id={panelId('Goalies')}
        role="tabpanel"
        aria-labelledby={tabId('Goalies')}
        hidden={selected !== 'Goalies'}
      >
        <GoalieCrease starter={view.starter} backups={view.backups} />
      </div>
    </div>
  );
}
