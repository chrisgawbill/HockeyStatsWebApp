import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ListOfGamesProvider } from '@/features/schedule/hooks/ScheduleContext';
import { SeasonProvider } from '@/features/season/hooks/SeasonContext';
import { StandingsDataProvider } from '@/features/standings/hooks/StandingsContext';
import { StatLeadersProvider } from '@/features/stat-leaders/hooks/StatLeadersContext';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';

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
const DiagnosticsPage = lazy(
  () => import('@/features/diagnostics/components/DiagnosticsPage'),
);

/**
 * Route table plus the providers that depend on routing or the selected season.
 * The nesting is deliberate: SeasonProvider reads `?season=` so it must sit inside
 * HashRouter, and the season-dependent data providers (standings, schedule,
 * skater/goalie leaders) nest inside it so they re-fetch when the season changes.
 * Routing-agnostic providers live higher up in index.tsx.
 */
export default function App() {
  return (
    <HashRouter>
      <SeasonProvider>
        <StandingsDataProvider>
          <ListOfGamesProvider>
            <StatLeadersProvider>
              <Suspense fallback={null}>
                <ErrorBoundary
                  fallbackRender={({ error, resetErrorBoundary }) => (
                    <div role="alert">
                      <p>Something went wrong:</p>
                      <pre>{getErrorMessage(error)}</pre>
                      <button onClick={resetErrorBoundary}>Try again</button>
                    </div>
                  )}
                >
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="standings" element={<StandingsPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="teamList" element={<TeamList />} />
                    <Route path="team/:teamId" element={<TeamPage />} />
                    <Route path="game/:gameId" element={<GameDetailPage />} />
                    <Route path="diagnostics" element={<DiagnosticsPage />} />
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </StatLeadersProvider>
          </ListOfGamesProvider>
        </StandingsDataProvider>
      </SeasonProvider>
    </HashRouter>
  );
}
