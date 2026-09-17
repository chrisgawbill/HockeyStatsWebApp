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
  getPeriodGoalsBreakdown,
  hasBoxscoreStats,
  hasScoringSummary,
  hasThreeStars,
  mapGameStateToStatus,
} from '@/features/game-detail/utils/gameDetailHelper';
import { getGameStoryFacts } from '@/features/game-detail/utils/gameStoryHelper';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import HeroScoreboard from '@/features/game-detail/components/HeroScoreboard';
import PeriodGoalsBreakdownTable from '@/features/game-detail/components/PeriodScoresTable';
import ScoringSummary from '@/features/game-detail/components/ScoringSummary';
import TeamComparison from '@/features/game-detail/components/TeamComparison';
import ThreeStars from '@/features/game-detail/components/ThreeStars';
import PlayerStatsSelection from '@/features/game-detail/components/PlayerStatsSelection';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import GameStory from '@/features/game-detail/components/GameStory';

const GameDetailPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
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

  const periodGoalsBreakdown = useMemo(() => {
    if (!landing?.summary?.scoring || !boxscore) return [];
    return getPeriodGoalsBreakdown(
      landing.summary.scoring,
      boxscore.homeTeam.abbrev,
      boxscore.awayTeam.abbrev,
    );
  }, [landing, boxscore]);

  const gameStoryFacts = useMemo(
    () =>
      getGameStoryFacts(
        landing,
        boxscore?.awayTeam.abbrev ?? '',
        boxscore?.homeTeam.abbrev ?? '',
      ),
    [landing, boxscore],
  );

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
      <>
        <PageHeader />
        <main className={`${styles['game-detail-page']} ${shared.pageShell}`}>
          <h1 className="ds-visually-hidden">Game Detail</h1>
          <LoadingState label="Loading game" fullPage />
        </main>
      </>
    );
  if (error || !boxscore)
    return (
      <>
        <PageHeader />
        <main className={`${styles['game-detail-page']} ${shared.pageShell}`}>
          <h1 className="ds-visually-hidden">Game Detail</h1>
          <ErrorState
            fullPage
            title="Game unavailable"
            message="Game data unavailable."
          />
        </main>
      </>
    );

  const isPreview = status === 'preview';

  return (
    <>
      <PageHeader />
      <main className={`${styles['game-detail-page']} ${shared.pageShell}`}>
        <h1 className="ds-visually-hidden">
          {`${boxscore.awayTeam.abbrev} at ${boxscore.homeTeam.abbrev}`}
        </h1>
        <HeroScoreboard boxscore={boxscore} status={status} />
        {!isPreview && (
          <div
            className={`${styles['game-detail-page__content']} ${shared.pageContent}`}
          >
            <GameStory
              facts={gameStoryFacts}
              boxscore={boxscore}
              homeTotals={homeTotals}
              awayTotals={awayTotals}
            />
            {periodGoalsBreakdown.length > 0 && (
              <PeriodGoalsBreakdownTable
                periodGoalsBreakdown={periodGoalsBreakdown}
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
      </main>
    </>
  );
};
export default GameDetailPage;
