import { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { getMatchupPreviewPath, isPreviewGame } from '@/lib/gamePath';
import { useLeague } from '@/lib/LeagueContext';

/**
 * Guards `/game/:gameId`: a game the loaded season list shows as not started
 * yet is replaced by its matchup preview, keeping the route state so the
 * preview's back link returns to where the user came from. Anything else
 * (started, final, or not in the list yet) renders the game page, which makes
 * the same check against its own box score. The redirect is keyed on the
 * location because the season provider may replace a bare `/game/:gameId`
 * URL with its `?season=` copy right after the redirect fires; the new key
 * fires it again from that copy. The matchup page is NHL only, so AHL games
 * always open the game page.
 */
export default function GamePreviewRedirect({
  children,
}: {
  children: ReactNode;
}) {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { listOfGamesData } = useListOfGames();
  const { league } = useLeague();
  const game = listOfGamesData.find(
    (seasonGame) => String(seasonGame.gameId) === gameId,
  );
  if (
    league === 'nhl' &&
    game &&
    isPreviewGame(game.gameState, game.gameTime)
  ) {
    return (
      <Navigate
        key={location.key}
        to={getMatchupPreviewPath(game)}
        replace
        state={location.state}
      />
    );
  }
  return <>{children}</>;
}
