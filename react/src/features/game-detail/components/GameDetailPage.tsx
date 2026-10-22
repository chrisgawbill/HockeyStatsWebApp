import { ReactNode, useMemo } from 'react';
import { useGameDetail } from '@/features/game-detail/hooks/useGameDetail';
import {
  computeTeamTotals,
  getPeriodGoalsBreakdown,
  hasBoxscoreStats,
  hasScoringSummary,
  hasThreeStars,
} from '@/features/game-detail/utils/gameDetailHelper';
import { getGameStoryFacts } from '@/features/game-detail/utils/gameStoryHelper';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getMatchupPreviewPath, isPreviewGame } from '@/lib/gamePath';
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

/** Header plus page-width main wrapper shared by every state of the game page. */
function GameDetailShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader />
      <main className={`${styles['game-detail-page']} ${shared.pageShell}`}>
        {children}
      </main>
    </>
  );
}

/**
 * Game route (`/game/:gameId`): hero scoreboard plus, for games that have
 * started, the story, period breakdown, scoring summary, three stars, team
 * comparison, and player stats. A game whose box score shows it has not
 * started yet moves to its matchup preview; past its scheduled start (a late
 * puck drop) it stays here on the preview scoreboard.
 */
const GameDetailPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { boxscore, landing, loading, error, status } = useGameDetail(gameId);

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
      <GameDetailShell>
        <h1 className="ds-visually-hidden">Game Detail</h1>
        <LoadingState label="Loading game" fullPage />
      </GameDetailShell>
    );
  if (error || !boxscore)
    return (
      <GameDetailShell>
        <h1 className="ds-visually-hidden">Game Detail</h1>
        <ErrorState
          fullPage
          title="Game unavailable"
          message="Game data unavailable."
        />
      </GameDetailShell>
    );

  if (isPreviewGame(boxscore.gameState, boxscore.startTimeUTC))
    return (
      <Navigate
        key={location.key}
        to={getMatchupPreviewPath({
          gameId: boxscore.id,
          awayTeam: boxscore.awayTeam.abbrev,
          homeTeam: boxscore.homeTeam.abbrev,
        })}
        replace
        state={location.state}
      />
    );

  const isPreview = status === 'preview';

  return (
    <GameDetailShell>
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
    </GameDetailShell>
  );
};
export default GameDetailPage;
