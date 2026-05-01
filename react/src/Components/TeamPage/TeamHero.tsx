import React from "react";
import { Link } from "react-router-dom";
import { MockTeam } from "../../Data/LocalData/TeamPageMockData";
import { localTeamList } from "../../Data/LocalData/TeamListData";

interface TeamHeroProps {
  team: MockTeam;
}

export default function TeamHero({ team }: TeamHeroProps) {
  const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${team.triCode}_light.svg`;
  var primaryColor = localTeamList.find(x => x.triCode == team.triCode)?.primary;

  return (
    <div className="team-hero" style={{background: `linear-gradient(135deg, ${primaryColor} 0%, #1a1a1a 100%)`,}}>
      <nav className="team-hero__breadcrumb">
        <Link to="/teamList" className="team-hero__breadcrumb-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Team List
        </Link>
        <span className="team-hero__breadcrumb-sep">/</span>
        <span className="team-hero__breadcrumb-current">{team.name}</span>
      </nav>
      <div className="team-hero__body">
        <img className="team-hero__logo" src={logoUrl} alt={team.name} />
        <div className="team-hero__info">
          <h1 className="team-hero__name">{team.name}</h1>
          <p className="team-hero__record">
            {team.wins}-{team.losses}-{team.otLosses}&nbsp;·&nbsp;{team.points} PTS
          </p>
          <div className="team-hero__badges">
            <span className="team-hero__badge">{team.conference} Conference</span>
            <span className="team-hero__badge">#{team.divisionRank} {team.division}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
