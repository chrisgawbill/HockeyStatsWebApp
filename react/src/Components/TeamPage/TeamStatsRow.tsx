import React from "react";
import { MockStatItem } from "../../Data/LocalData/teamPageMockData";
import shared from "../../style/shared.module.css";
import styles from "../../style/TeamPage/TeamPage.module.css";

interface TeamStatsRowProps {
  stats: MockStatItem[];
}

export default function TeamStatsRow({ stats }: TeamStatsRowProps) {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Team Stats</h2>
      <div className={styles["stat-strip"]}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${styles["stat-pill"]} ${shared.surface} ${shared.surfaceInteractive}`}
          >
            <span className={styles["stat-pill__value"]}>{stat.value}</span>
            <span className={styles["stat-pill__label"]}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
