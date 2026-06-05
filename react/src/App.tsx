import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SkaterStatLeaderProvider } from './Data/Context/SkaterStatLeadersContext';
import { GoalieLeaderDataProvider } from './Data/Context/GoalieStatLeadersContext';
import { ListOfGamesProvider } from './Data/Context/ScheduleContext';
import { SeasonProvider } from './Data/Context/SeasonContext';
import { StandingsDataProvider } from './Data/Context/StandingsContext';

const LandingPage = lazy(() => import('./Pages/LandingPage'));
const StandingsPage = lazy(() => import('./Pages/StandingsPage'));
const TeamPage = lazy(() => import('./Pages/TeamPage'));
const TeamList = lazy(() => import('./Pages/TeamList'));
const SchedulePage = lazy(() => import('./Pages/SchedulePage'));
const GameDetailPage = lazy(() => import('./Pages/GameDetailPage'));
const DiagnosticsPage = lazy(() => import('./Pages/DiagnosticsPage'));

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
            <SkaterStatLeaderProvider>
              <GoalieLeaderDataProvider>
                <Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="standings" element={<StandingsPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="teamList" element={<TeamList />} />
                    <Route path="team/:teamId" element={<TeamPage />} />
                    <Route path="game/:gameId" element={<GameDetailPage />} />
                    <Route path="diagnostics" element={<DiagnosticsPage />} />
                  </Routes>
                </Suspense>
              </GoalieLeaderDataProvider>
            </SkaterStatLeaderProvider>
          </ListOfGamesProvider>
        </StandingsDataProvider>
      </SeasonProvider>
    </HashRouter>
  );
}
