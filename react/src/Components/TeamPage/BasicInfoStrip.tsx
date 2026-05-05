import React from "react";
import { MockTeam } from "../../Data/LocalData/TeamPageMockData";
import shared from "../../style/shared.module.css";
import styles from "../../style/TeamPage/TeamPage.module.css";

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
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Basic Info</h2>
      <div className={styles["info-strip"]}>
        {items.map((item) => (
          <div
            key={item.label}
            className={`${styles["info-card"]} ${shared.surface} ${shared.surfaceInteractive}`}
          >
            <span className={styles["info-card__value"]}>{item.value}</span>
            <span className={styles["info-card__label"]}>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
