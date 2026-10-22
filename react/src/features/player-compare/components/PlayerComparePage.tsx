import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import PageIntro from '@/components/PageIntro';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import {
  formatComparePlayerIds,
  parseComparePlayerIds,
} from '@/lib/comparePath';
import { useSeasonPlayerPool } from '@/features/player-compare/hooks/useSeasonPlayerPool';
import PlayerComparison from '@/features/player-compare/components/PlayerComparison';
import styles from '@/features/player-compare/components/PlayerComparePage.module.css';

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
