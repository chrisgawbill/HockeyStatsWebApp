import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ListOfGamesProvider } from '@/features/schedule/hooks/ScheduleContext';
import { SeasonProvider } from '@/features/season/hooks/SeasonContext';
import { StandingsDataProvider } from '@/features/standings/hooks/StandingsContext';
import { StatLeadersProvider } from '@/features/stat-leaders/hooks/StatLeadersContext';
import { ListOfTeamsDataProvider } from '@/features/teams/hooks/ListOfTeamsContext';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import InstallBanner from '@/features/install-prompt/components/InstallBanner';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import GamePreviewRedirect from '@/app/GamePreviewRedirect';

/** Placeholder shown while a lazily loaded route downloads. */
function RouteLoadingFallback() {
  return (
    <div className="ds-page-shell">
      <LoadingState label="Loading page" fullPage />
    </div>
  );
}

const LandingPage = lazy(() => import('@/app/LandingPage'));
const StandingsPage = lazy(
  () => import('@/features/standings/components/StandingsPage'),
);
const TeamPage = lazy(() => import('@/features/teams/components/TeamPage'));
const TeamList = lazy(() => import('@/features/teams/components/TeamList'));
const SchedulePage = lazy(
  () => import('@/features/schedule/components/SchedulePage'),
);
const GameDetailPage = lazy(
  () => import('@/features/game-detail/components/GameDetailPage'),
);
const MatchupPage = lazy(
  () => import('@/features/matchup/components/MatchupPage'),
);
const DiagnosticsPage = lazy(
  () => import('@/features/diagnostics/components/DiagnosticsPage'),
);
const WeeklyReportPage = lazy(
  () => import('@/features/favorite-players/components/WeeklyReportPage'),
);
const MyHockeyPage = lazy(
  () => import('@/features/my-hockey/components/MyHockeyPage'),
);
const BoardGamePage = lazy(
  () => import('@/features/board-game/components/BoardGamePage'),
);

/**
 * Route table plus the providers that depend on routing or the selected season.
 * The nesting is deliberate: SeasonProvider reads `?season=` so it must sit inside
 * HashRouter, and the season-dependent data providers (standings, schedule,
 * skater/goalie leaders, team list) nest inside it so they re-fetch when the
 * season changes. Routing-agnostic providers live higher up in index.tsx.
 */
export default function App() {
  return (
    <HashRouter>
      <InstallBanner />
      <SeasonProvider>
        <StandingsDataProvider>
          <ListOfGamesProvider>
            <StatLeadersProvider>
              <ListOfTeamsDataProvider>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                      <div className="ds-page-shell">
                        <ErrorState
                          fullPage
                          title="Something went wrong"
                          message={getErrorMessage(error)}
                          onRetry={resetErrorBoundary}
                        />
                      </div>
                    )}
                  >
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="standings" element={<StandingsPage />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="teamList" element={<TeamList />} />
                      <Route path="team/:teamId" element={<TeamPage />} />
                      <Route
                        path="game/:gameId"
                        element={
                          <GamePreviewRedirect>
                            <GameDetailPage />
                          </GamePreviewRedirect>
                        }
                      />
                      <Route path="matchup" element={<MatchupPage />} />
                      <Route path="diagnostics" element={<DiagnosticsPage />} />
                      <Route path="board-game" element={<BoardGamePage />} />
                      <Route path="my-hockey" element={<MyHockeyPage />} />
                      <Route
                        path="weekly-report"
                        element={<WeeklyReportPage />}
                      />
                      <Route
                        path="weekly-report/:weekStart"
                        element={<WeeklyReportPage />}
                      />
                    </Routes>
                  </ErrorBoundary>
                </Suspense>
              </ListOfTeamsDataProvider>
            </StatLeadersProvider>
          </ListOfGamesProvider>
        </StandingsDataProvider>
      </SeasonProvider>
    </HashRouter>
  );
}
