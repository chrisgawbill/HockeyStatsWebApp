import React from "react";
import { CLINCH_STATUS_META, ClinchStatus } from "./ClinchStatus";
import styles from "../../../style/LandingPage/LandingPageStandings.module.css";

interface Props {
  className?: string;
}

export default function StandingsClinchLegend({ className }: Props) {
  return (
    <div
      className={[styles["standings-clinch-legend"], className].filter(Boolean).join(" ")}
      aria-label="Standings clinch legend"
    >
      {(Object.keys(CLINCH_STATUS_META) as ClinchStatus[]).map((status) => {
        const statusMeta = CLINCH_STATUS_META[status];
        return (
          <span key={status} className={styles["standings-clinch-legend__item"]}>
            <span
              className={`${styles["standings-clinch-badge"]} ${statusMeta.className}`}
              aria-hidden="true"
            >
              {statusMeta.badge}
            </span>
            <span>{statusMeta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
