import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import App from "./App";
import { StandingsDataProvider } from "./Data/Context/StandingsContext";
import { SkaterStatLeaderProvider } from "./Data/Context/SkaterStatLeadersContext";
import { GoalieLeaderDataProvider } from "./Data/Context/GoalieStatLeadersContext";
import { ListOfTeamsDataProvider } from "./Data/Context/ListOfTeamsContext";
import { ListOfGamesProvider } from "./Data/Context/ScheduleContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <ListOfTeamsDataProvider>
    <ListOfGamesProvider>
      <StandingsDataProvider>
        <SkaterStatLeaderProvider>
          <GoalieLeaderDataProvider>
            <App />
          </GoalieLeaderDataProvider>
        </SkaterStatLeaderProvider>
      </StandingsDataProvider>
    </ListOfGamesProvider>
  </ListOfTeamsDataProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
