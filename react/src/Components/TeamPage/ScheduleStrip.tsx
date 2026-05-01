import React from "react";
import { MockScheduleGame } from "../../Data/LocalData/TeamPageMockData";

interface ScheduleStripProps {
  games: MockScheduleGame[];
}

export default function ScheduleStrip({ games }: ScheduleStripProps) {
  return (
    <section className="team-section">
      <h2 className="team-section__title">Schedule</h2>
      <div className="schedule-strip">
        {games.map((game) => {
          const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${game.opponentTriCode}_light.svg`;
          return (
            <div key={game.gameId} className="schedule-strip__card">
              <img className="schedule-strip__logo" src={logoUrl} alt={game.opponent} />
              <p className="schedule-strip__opponent">{game.opponent}</p>
              <p className="schedule-strip__date">{game.date}</p>
              <span className={`schedule-strip__badge ${game.isHome ? "home" : "away"}`}>
                {game.isHome ? "Home" : "Away"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
