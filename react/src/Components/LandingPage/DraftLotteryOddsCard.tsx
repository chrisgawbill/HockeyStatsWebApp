import React from "react";
import { StandingsTeam } from "../../Data/Models/StandingsTeam";
import "../../style/LandingPage/DraftLotteryOddsCard.css";

interface DraftLotteryOddsCardProps {
  team: StandingsTeam;
  index: number;
  maxOdds: number;
}

export default function DraftLotteryOddsCard({
  team,
  index,
  maxOdds,
}: DraftLotteryOddsCardProps) {
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
    <div className="lottery-card">
      <div className="lottery-card__header">
        <span className="lottery-card__rank">#{index + 1}</span>
        <img
          src={team.teamLogo}
          alt={team.teamName}
          className="lottery-card__logo"
        />
        <span className="lottery-card__name">{team.teamName}</span>
        <div className="lottery-card__right">
          {trendIcon && (
            <span className={`lottery-card__trend ${trendClass}`}>
              {trendIcon}
            </span>
          )}
          <span className="lottery-card__odds">{team.draftLotteryOdds}%</span>
        </div>
      </div>

      <div className="lottery-card__bar-track">
        <div
          className="lottery-card__bar-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
