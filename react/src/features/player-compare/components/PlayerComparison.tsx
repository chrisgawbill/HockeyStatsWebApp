import { useState } from 'react';
import SlidingToggle from '@/components/SlidingToggle';
import { MAX_COMPARE_PLAYERS } from '@/lib/comparePath';
import { buildCompareSlots } from '@/features/player-compare/utils/compareSlots';
import { getGroupNoun } from '@/features/player-compare/utils/compareStats';
import CompareTable from '@/features/player-compare/components/CompareTable';
import PlayerPicker from '@/features/player-compare/components/PlayerPicker';
import type {
  PlayerGroup,
  SeasonPlayerPool,
} from '@/features/player-compare/types/playerCompare';
import styles from '@/features/player-compare/components/PlayerComparePage.module.css';

const GROUP_OPTIONS: { label: string; value: PlayerGroup }[] = [
  { label: 'Skaters', value: 'skater' },
  { label: 'Goalies', value: 'goalie' },
];

interface PlayerComparisonProps {
  pool: SeasonPlayerPool;
  season: string;
  playerIds: number[];
  /** Focus the search on arrival (opened from a player's Compare button). */
  focusPicker: boolean;
  onChangePlayerIds: (playerIds: number[]) => void;
}

/**
 * The group switch or chip, the player search, and the table for the players
 * in the URL. The first player found sets the group; with none, the switch
 * chooses which group the search covers.
 */
export default function PlayerComparison({
  pool,
  season,
  playerIds,
  focusPicker,
  onChangePlayerIds,
}: PlayerComparisonProps) {
  const [chosenGroup, setChosenGroup] = useState<PlayerGroup>('skater');
  const { group: urlGroup, slots } = buildCompareSlots(playerIds, pool);
  const group = urlGroup ?? chosenGroup;
  const groupNoun = getGroupNoun(group);
  const searchablePlayers = group === 'skater' ? pool.skaters : pool.goalies;
  const comparedCount = slots.filter((slot) => slot.kind === 'player').length;

  return (
    <>
      <div className={styles.toolbar}>
        {urlGroup ? (
          <span className={styles.groupChip}>
            {GROUP_OPTIONS.find((option) => option.value === urlGroup)?.label}
          </span>
        ) : (
          <SlidingToggle
            options={GROUP_OPTIONS}
            value={chosenGroup}
            onChange={setChosenGroup}
          />
        )}
        <PlayerPicker
          players={searchablePlayers}
          groupNoun={groupNoun}
          excludedIds={playerIds}
          isFull={playerIds.length >= MAX_COMPARE_PLAYERS}
          autoFocus={focusPicker}
          onPick={(player) =>
            onChangePlayerIds([...playerIds, player.playerId])
          }
        />
      </div>
      {comparedCount < 2 && (
        <p className={styles.hint}>
          {comparedCount === 0
            ? `Search for two or three ${groupNoun} to compare their season stats.`
            : `Add another ${group} to compare.`}
        </p>
      )}
      {slots.length > 0 && (
        <CompareTable
          group={group}
          slots={slots}
          season={season}
          onRemove={(removedId) =>
            onChangePlayerIds(playerIds.filter((id) => id !== removedId))
          }
        />
      )}
    </>
  );
}
