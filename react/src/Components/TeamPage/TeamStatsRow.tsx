import React from "react";
import { MockStatItem } from "../../Data/LocalData/TeamPageMockData";

interface TeamStatsRowProps {
  stats: MockStatItem[];
}

export default function TeamStatsRow({ stats }: TeamStatsRowProps) {
  return (
    <section className="team-section">
      <h2 className="team-section__title">Team Stats</h2>
      <div className="stat-strip">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-pill">
            <span className="stat-pill__value">{stat.value}</span>
            <span className="stat-pill__label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
