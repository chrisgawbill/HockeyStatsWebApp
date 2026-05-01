import React from "react";
import { POSITIONS, Position, RosterPlayer } from "../../Data/LocalData/TeamPageMockData";
import PlayerCard from "./PlayerCard";

interface RosterSectionProps {
  roster: Record<Position, RosterPlayer[]>;
}

export default function RosterSection({ roster }: RosterSectionProps) {
  return (
    <section className="team-section">
      <h2 className="team-section__title">Roster</h2>
      <div className="roster-grid">
        {POSITIONS.map((pos) => (
          <div key={pos} className="roster-column">
            <h3 className="roster-column__header">{pos}</h3>
            {roster[pos].map((player) => (
              <PlayerCard key={`${player.id}-${player.name}`} player={player} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
