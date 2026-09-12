import { useEffect, useMemo, useState } from 'react';
import {
  GetGameDetails,
  GetGameLanding,
} from '@/features/game-detail/api/gameDetailApi';
import {
  GameDetailBoxscore,
  GameLanding,
} from '@/features/game-detail/types/gameDetail';
import {
  LIVE_POLL_INTERVAL_MS,
  computeTeamTotals,
  getPeriodScores,
  hasBoxscoreStats,
  hasScoringSummary,
  hasThreeStars,
  mapGameStateToStatus,
} from '@/features/game-detail/utils/gameDetailHelper';
import { useTheme } from '@table-library/react-table-library/theme';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import HeroScoreboard from '@/features/game-detail/components/HeroScoreboard';
import PeriodScoresTable from '@/features/game-detail/components/PeriodScoresTable';
import ScoringSummary from '@/features/game-detail/components/ScoringSummary';
import TeamComparison from '@/features/game-detail/components/TeamComparison';
import ThreeStars from '@/features/game-detail/components/ThreeStars';
import PlayerStatsSelection from '@/features/game-detail/components/PlayerStatsSelection';
import { getTheme } from '@/lib/themeHandler';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';
import LoadingState from '@/components/LoadingState';

const GameDetailPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const theme = useTheme(getTheme());
  const [boxscore, setBoxscore] = useState<GameDetailBoxscore | null>(null);
  const [landing, setLanding] = useState<GameLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    setError(false);
    Promise.all([
      GetGameDetails(Number(gameId)),
      GetGameLanding(Number(gameId)),
    ])
      .then(([boxData, landData]) => {
        setBoxscore(boxData);
        setLanding(landData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId]);

  const status = useMemo(
    () => mapGameStateToStatus(boxscore?.gameState),
    [boxscore?.gameState],
  );

  // Live games only: refresh scores/boxscore on a single interval so the page
  // updates in place. Never scheduled for preview/final games, and always
  // cleared on unmount or when the game leaves the live state.
  useEffect(() => {
    if (!gameId || status !== 'live') return;
    const intervalId = window.setInterval(() => {
      Promise.all([
        GetGameDetails(Number(gameId)),
        GetGameLanding(Number(gameId)),
      ])
        .then(([boxData, landData]) => {
          setBoxscore(boxData);
          setLanding(landData);
        })
        .catch(() => {
          // Transient poll failure: keep showing the last good data and try
          // again on the next tick rather than surfacing an error state.
        });
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [gameId, status]);

  const periodScores = useMemo(() => {
    if (!landing?.summary?.scoring || !boxscore) return [];
    return getPeriodScores(
      landing.summary.scoring,
      boxscore.homeTeam.abbrev,
      boxscore.awayTeam.abbrev,
    );
  }, [landing, boxscore]);

  const homeTotals = useMemo(() => {
    if (!hasBoxscoreStats(boxscore)) return null;
    return computeTeamTotals(
      boxscore!.playerByGameStats!.homeTeam,
      boxscore!.homeTeam.sog,
    );
  }, [boxscore]);

  const awayTotals = useMemo(() => {
    if (!hasBoxscoreStats(boxscore)) return null;
    return computeTeamTotals(
      boxscore!.playerByGameStats!.awayTeam,
      boxscore!.awayTeam.sog,
    );
  }, [boxscore]);

  if (loading)
    return (
      <div className={styles['game-detail-page']}>
        <PageHeader />
        <LoadingState label="Loading game" />
      </div>
    );
  if (error || !boxscore)
    return (
      <div className={styles['game-detail-page']}>
        <PageHeader />
        <div className={shared.errorState}>Game data unavailable.</div>
      </div>
    );

  const isPreview = status === 'preview';

  return (
    <div className={styles['game-detail-page']}>
      <PageHeader />
      <HeroScoreboard boxscore={boxscore} status={status} theme={theme} />
      {!isPreview && (
        <div className={styles['game-detail-page__content']}>
          {periodScores.length > 0 && (
            <PeriodScoresTable
              periodScores={periodScores}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
          {hasScoringSummary(landing) && (
            <ScoringSummary scoring={landing!.summary.scoring} />
          )}
          {hasThreeStars(landing) && (
            <ThreeStars stars={landing!.summary.threeStars} />
          )}
          {homeTotals && awayTotals && (
            <TeamComparison
              homeTotals={homeTotals}
              awayTotals={awayTotals}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
          {hasBoxscoreStats(boxscore) && (
            <PlayerStatsSelection
              homeTeam={boxscore.playerByGameStats!.homeTeam}
              awayTeam={boxscore.playerByGameStats!.awayTeam}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
        </div>
      )}
    </div>
  );
};
export default GameDetailPage;
