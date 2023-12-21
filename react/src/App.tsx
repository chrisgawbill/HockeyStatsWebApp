import React from "react";
import "./App.css";
import LandingPage from "./Pages/LandingPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StandingsPage from "./Pages/StandingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}>
          <Route path="standings" element={<StandingsPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
