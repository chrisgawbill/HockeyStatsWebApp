import React from "react";
import { CLINCH_STATUS_META, ClinchStatus } from "./ClinchStatus";
import "../../../style/LandingPage/LandingPageStandings.css";

export default function StandingsClinchLegend() {
  return (
    <div
      className="standings-clinch-legend"
      aria-label="Standings clinch legend"
    >
      {(Object.keys(CLINCH_STATUS_META) as ClinchStatus[]).map((status) => {
        const statusMeta = CLINCH_STATUS_META[status];
        return (
          <span key={status} className="standings-clinch-legend__item">
            <span
              className={`standings-clinch-badge ${statusMeta.className}`}
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
