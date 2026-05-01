import React from "react";
import { RosterPlayer } from "../../Data/LocalData/TeamPageMockData";

interface PlayerCardProps {
  player: RosterPlayer;
}

const FALLBACK_HEADSHOT = "https://assets.nhle.com/mugs/nhl/skater/default.png";

export default function PlayerCard({ player }: PlayerCardProps) {
  const headshotUrl = `https://assets.nhle.com/mugs/nhl/skater/${player.id}.png`;

  return (
    <div className="player-card">
      <div className="player-card__img-wrap">
        <img
          className="player-card__headshot"
          src={headshotUrl}
          alt={player.name}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HEADSHOT; }}
        />
        <span className="player-card__number">#{player.number}</span>
      </div>
      <p className="player-card__name">{player.name}</p>
      <p className="player-card__stat">{player.stat}</p>
    </div>
  );
}
