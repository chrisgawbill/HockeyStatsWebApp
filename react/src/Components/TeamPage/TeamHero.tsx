import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MockTeam } from "../../Data/LocalData/TeamPageMockData";
import { localTeamList } from "../../Data/LocalData/TeamListData";

interface TeamHeroProps {
  team: MockTeam;
}

export default function TeamHero({ team }: TeamHeroProps) {
  const location = useLocation();
  const teamRouteState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
  } | null;
  const sourcePath = teamRouteState?.sourcePath ?? "/teamList";
  const sourceLabel =
    sourcePath === "/"
      ? "Home"
      : sourcePath === "/schedule"
        ? "Schedule"
        : sourcePath === "/standings"
          ? "Standings"
          : "Team List";
  const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${team.triCode}_dark.svg`;
  var primaryColor = localTeamList.find(
    (x) => x.triCode == team.triCode,
  )?.primary;

  return (
    <div
      className="team-hero"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor} 20%, color-mix(in srgb, ${primaryColor} 30%, #000) 100%)`,
      }}
    >
      <nav className="team-hero__breadcrumb">
        <Link to={sourcePath} className="team-hero__breadcrumb-back">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {sourceLabel}
        </Link>
        <span className="team-hero__breadcrumb-sep">/</span>
        <span className="team-hero__breadcrumb-current">{team.name}</span>
      </nav>
      <div className="team-hero__body">
        <img className="team-hero__logo" src={logoUrl} alt={team.name} />
        <div className="team-hero__info">
          <h1 className="team-hero__name">{team.name}</h1>
          <p className="team-hero__record">
            {team.wins}-{team.losses}-{team.otLosses}&nbsp;·&nbsp;{team.points}{" "}
            PTS
          </p>
          <div className="team-hero__badges">
            <span className="team-hero__badge">
              #{team.conferenceRank} {team.conference} Conference
            </span>
            <span className="team-hero__badge">
              #{team.divisionRank} {team.division}
            </span>
            <span
              className={`team-hero__badge team-hero__badge--playoff ${team.playoffLineDelta >= 0 ? "above" : "below"}`}
            >
              {Math.abs(team.playoffLineDelta)} pts{" "}
              {team.playoffLineDelta >= 0 ? "above" : "below"} playoff line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
