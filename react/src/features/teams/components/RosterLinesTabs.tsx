import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import BenchStrip from '@/features/teams/components/BenchStrip';
import GoalieCrease from '@/features/teams/components/GoalieCrease';
import LineCarousel from '@/features/teams/components/LineCarousel';
import PlayerStatsDialog from '@/features/teams/components/PlayerStatsDialog';
import { PlayerDialogContext } from '@/features/teams/hooks/PlayerDialogContext';
import {
  buildPlayerStatCells,
  buildStatsLookup,
  getPositionLabel,
  PlayerStatsLookup,
} from '@/features/teams/utils/playerStatsHelper';
import {
  TokenSlot,
  TeamLinesView,
} from '@/features/teams/utils/teamLinesHelper';
import {
  GoalieStatLine,
  PlayerStatLine,
  PositionGroup,
  RosterPlayer,
} from '@/features/teams/types/teamPageTypes';
import teamStyles from '@/features/teams/components/TeamPage.module.css';
import styles from '@/features/teams/components/RosterLines.module.css';

interface RosterLinesTabsProps {
  view: TeamLinesView;
  teamColor: string;
  teamInk: string;
  playerStats: PlayerStatLine[];
  goalieStats: GoalieStatLine[];
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
  playerStats,
  goalieStats,
}: RosterLinesTabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useState<PositionGroup>('Forwards');
  const [open, setOpen] = useState<{
    player: RosterPlayer;
    slot: TokenSlot;
  } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const lookup: PlayerStatsLookup = useMemo(
    () => buildStatsLookup(playerStats, goalieStats),
    [playerStats, goalieStats],
  );
  const openPlayer = useCallback(
    (player: RosterPlayer, slot: TokenSlot, trigger: HTMLElement) => {
      triggerRef.current = trigger;
      setOpen({ player, slot });
    },
    [],
  );
  function closePlayer() {
    setOpen(null);
    // Safari does not focus buttons on click, so restore focus explicitly.
    const trigger = triggerRef.current;
    requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
  }
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

  const tabId = (group: string) => `${baseId}-tab-${group}`;
  const panelId = (group: string) => `${baseId}-panel-${group}`;

  return (
    <PlayerDialogContext.Provider value={openPlayer}>
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
          {TABS.map((group, tabIndex) => (
            <button
              key={group}
              ref={(tabElement) => {
                tabRefs.current[group] = tabElement;
              }}
              id={tabId(group)}
              type="button"
              role="tab"
              aria-selected={selected === group}
              aria-controls={panelId(group)}
              tabIndex={selected === group ? 0 : -1}
              className={`${teamStyles['player-stat-tab']} ds-button ${selected === group ? teamStyles.active : ''}`}
              onClick={() => select(group)}
              onKeyDown={(event) => onKeyDown(event, tabIndex)}
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
            columns={{ lg: 2, xl: 2 }}
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
            columns={{ lg: 2, xl: 3 }}
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
        {open && (
          <PlayerStatsDialog
            playerId={open.player.id}
            playerName={open.player.name}
            headshot={open.player.headshot}
            detail={`#${open.player.number} · ${getPositionLabel(open.slot, lookup, open.player.id)}`}
            headshotFallback={open.player.number}
            statCells={buildPlayerStatCells(
              open.player.id,
              open.slot,
              lookup,
              open.player.stat,
            )}
            teamColor={teamColor}
            teamInk={teamInk}
            onClose={closePlayer}
          />
        )}
      </div>
    </PlayerDialogContext.Provider>
  );
}
