import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./style/components.css";
import reportWebVitals from "./reportWebVitals";
import App from "./App";
import { StandingsDataProvider } from "./Data/Context/StandingsContext";
import { SkaterStatLeaderProvider } from "./Data/Context/SkaterStatLeadersContext";
import { GoalieLeaderDataProvider } from "./Data/Context/GoalieStatLeadersContext";
import { ListOfTeamsDataProvider } from "./Data/Context/ListOfTeamsContext";
import { ListOfGamesProvider } from "./Data/Context/ScheduleContext";
import { ThemeProvider } from "./Data/Context/ThemeContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <ThemeProvider>
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
  </ThemeProvider>,
);

reportWebVitals();
