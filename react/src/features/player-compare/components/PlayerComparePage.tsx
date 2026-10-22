import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import PageIntro from '@/components/PageIntro';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import SlidingToggle from '@/components/SlidingToggle';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import {
  formatComparePlayerIds,
  MAX_COMPARE_PLAYERS,
  parseComparePlayerIds,
} from '@/lib/comparePath';
import { useSeasonPlayerPool } from '@/features/player-compare/hooks/useSeasonPlayerPool';
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
function PlayerComparison({
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

/**
 * Player comparison route (`/compare?players=<id>,<id>[,<id>]`): two or three
 * skaters or goalies side by side for the selected season. The URL holds the
 * players, so a copied link rebuilds the same comparison; picking or removing
 * a player replaces it without adding a history entry.
 */
export default function PlayerComparePage() {
  const { season } = useSeason();
  const [searchParams, setSearchParams] = useSearchParams();
  const playersParam = searchParams.get('players');
  const playerIds = useMemo(
    () => parseComparePlayerIds(playersParam),
    [playersParam],
  );
  const [arrivedWithOnePlayer] = useState(playerIds.length === 1);
  const { load, retry } = useSeasonPlayerPool(season);

  /** Writes the compared players to the URL, keeping the season. */
  function replacePlayerIds(nextPlayerIds: number[]) {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        if (nextPlayerIds.length > 0) {
          nextParams.set('players', formatComparePlayerIds(nextPlayerIds));
        } else {
          nextParams.delete('players');
        }
        return nextParams;
      },
      { replace: true },
    );
  }

  return (
    <>
      <PageHeader />
      <main className={`${styles.page} ds-page-shell ds-container`}>
        <PageIntro
          kicker="Players"
          title="Compare players"
          description={`${formatSeasonLabel(season)} regular season. Copy this page's link to share the comparison.`}
        />
        {load.status === 'loading' && <LoadingState label="Loading players" />}
        {load.status === 'failed' && (
          <ErrorState
            title="Couldn't load players"
            message="Try again in a moment."
            onRetry={retry}
          />
        )}
        {load.status === 'loaded' && (
          <PlayerComparison
            pool={load.pool}
            season={season}
            playerIds={playerIds}
            focusPicker={arrivedWithOnePlayer}
            onChangePlayerIds={replacePlayerIds}
          />
        )}
      </main>
    </>
  );
}
