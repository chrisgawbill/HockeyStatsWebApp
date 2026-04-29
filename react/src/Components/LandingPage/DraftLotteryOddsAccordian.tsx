import React, { useState } from "react";
import { StandingsTeam } from "../../Data/Models/StandingsTeam";
import "../../style/LandingPage/DraftLotteryOddsAccordian.css";

interface DraftLotteryOddsAccordianProps {
  team: StandingsTeam;
  index: number;
  maxOdds: number;
}

export default function DraftLotteryOddsAccordian({
  team,
  index,
  maxOdds,
}: DraftLotteryOddsAccordianProps) {
  const [expanded, setExpanded] = useState(false);
  const progressPct = maxOdds > 0 ? (team.draftLotteryOdds / maxOdds) * 100 : 0;

  const trendIcon =
    team.draftLotteryOddsTrend === "up"
      ? "▲"
      : team.draftLotteryOddsTrend === "down"
      ? "▼"
      : null;
  const trendClass =
    team.draftLotteryOddsTrend === "up"
      ? "trend-up"
      : team.draftLotteryOddsTrend === "down"
      ? "trend-down"
      : "";

  return (
    <div
      className={`lottery-card${expanded ? " lottery-card--expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
    >
      <div className="lottery-card__header">
        <span className="lottery-card__rank">#{index + 1}</span>
        <img src={team.teamLogo} alt={team.teamName} className="lottery-card__logo" />
        <span className="lottery-card__name">{team.teamName}</span>
        <div className="lottery-card__right">
          {trendIcon && (
            <span className={`lottery-card__trend ${trendClass}`}>{trendIcon}</span>
          )}
          <span className="lottery-card__odds">{team.draftLotteryOdds}%</span>
          <span className={`lottery-card__chevron${expanded ? " lottery-card__chevron--open" : ""}`}>
            ›
          </span>
        </div>
      </div>

      <div className="lottery-card__bar-track">
        <div
          className="lottery-card__bar-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {expanded && (
        <div className="lottery-card__details">
          <div className="lottery-chip">
            <span className="lottery-chip__label">Record</span>
            <span className="lottery-chip__value">
              {team.wins}–{team.losses}–{team.otLosses}
            </span>
          </div>
          <div className="lottery-chip">
            <span className="lottery-chip__label">Points</span>
            <span className="lottery-chip__value">{team.points}</span>
          </div>
          <div className="lottery-chip">
            <span className="lottery-chip__label">Pts%</span>
            <span className="lottery-chip__value">
              {team.pointsPercentage.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
