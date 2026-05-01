import React from "react";
import { MockTeam } from "../../Data/LocalData/TeamPageMockData";

interface BasicInfoStripProps {
  team: MockTeam;
}

export default function BasicInfoStrip({ team }: BasicInfoStripProps) {
  const items = [
    { label: "Year Founded",             value: team.founded },
    { label: "Arena",                    value: team.arena },
    { label: "Stanley Cups",             value: team.stanleyCups },
    { label: "Conference Championships", value: team.conferenceChampionships },
    { label: "Hall of Famers",           value: team.hallOfFamers },
  ];

  return (
    <section className="team-section">
      <h2 className="team-section__title">Basic Info</h2>
      <div className="info-strip">
        {items.map((item) => (
          <div key={item.label} className="info-card">
            <span className="info-card__value">{item.value}</span>
            <span className="info-card__label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
