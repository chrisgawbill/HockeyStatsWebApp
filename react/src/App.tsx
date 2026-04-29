import LandingPage from "./Pages/LandingPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StandingsPage from "./Pages/StandingsPage";
import TeamPage from "./Pages/TeamPage";
import TeamList from "./Pages/TeamList";
import SchedulePage from "./Pages/SchedulePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="standings" element={<StandingsPage/>} />
        <Route path="schedule" element={<SchedulePage/>} />
        <Route path="teamList" element={<TeamList/>} />
        <Route path="team" element={<TeamPage teamId={28}/>} />
      </Routes>
    </BrowserRouter>
  );
}
