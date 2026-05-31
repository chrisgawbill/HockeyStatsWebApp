import LandingPage from "./Pages/LandingPage";
import { HashRouter, Routes, Route } from "react-router-dom";
import StandingsPage from "./Pages/StandingsPage";
import TeamPage from "./Pages/TeamPage";
import TeamList from "./Pages/TeamList";
import SchedulePage from "./Pages/SchedulePage";
import GameDetailPage from "./Pages/GameDetailPage";
import DiagnosticsPage from "./Pages/DiagnosticsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="standings" element={<StandingsPage/>} />
        <Route path="schedule" element={<SchedulePage/>} />
        <Route path="teamList" element={<TeamList/>} />
        <Route path="team/:teamId" element={<TeamPage />} />
        <Route path="game/:gameId" element={<GameDetailPage />} />
        <Route path="diagnostics" element={<DiagnosticsPage />} />
      </Routes>
    </HashRouter>
  );
}
