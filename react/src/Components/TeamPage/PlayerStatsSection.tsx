import React, { useState } from "react";
import {
  STAT_CATEGORIES,
  StatCategory,
  StatCategoryKey,
  PlayerStatLine,
} from "../../Data/LocalData/TeamPageMockData";

const FALLBACK_HEADSHOT = "https://assets.nhle.com/mugs/nhl/skater/default.png";

function getTopTen(players: PlayerStatLine[], category: StatCategory): PlayerStatLine[] {
  const eligible = category.key === "faceoffWinPct"
    ? players.filter((p) => p.faceoffWinPct !== null)
    : category.key === "corsiPct"
    ? players.filter((p) => p.corsiPct !== null)
    : players;

  return [...eligible]
    .sort((a, b) => {
      const aVal = a[category.key] ?? -Infinity;
      const bVal = b[category.key] ?? -Infinity;
      return category.higherIsBetter
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    })
    .slice(0, 10);
}

interface Props {
  players: PlayerStatLine[];
  headshotMap: Map<number, string>;
}

export default function PlayerStatsSection({ players, headshotMap }: Props) {
  const [selectedKey, setSelectedKey] = useState<StatCategoryKey>("goals");

  const selectedCategory = STAT_CATEGORIES.find((c) => c.key === selectedKey)!;
  const topTen = getTopTen(players, selectedCategory);

  return (
    <section className="team-section">
      <h2 className="team-section__title">Player Stats</h2>

      <div className="player-stat-categories">
        {STAT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`player-stat-tab${selectedKey === cat.key ? " active" : ""}`}
            onClick={() => setSelectedKey(cat.key)}
          >
            {cat.shortLabel}
          </button>
        ))}
      </div>

      <div className="player-stat-leaderboard">
        <p className="player-stat-leaderboard__title">{selectedCategory.label} Leaders</p>
        {topTen.map((player, index) => {
          const val = player[selectedKey];
          const formatted = val !== null ? selectedCategory.format(val as number) : "—";
          return (
            <div key={`${player.playerId}-${index}`} className="player-stat-row">
              <div className="player-stat-row__leading">
                <span className="player-stat-row__rank">#{index + 1}</span>
                <img
                  className="player-stat-row__headshot"
                  src={headshotMap.get(player.playerId) || FALLBACK_HEADSHOT}
                  alt={player.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HEADSHOT; }}
                />
              </div>
              <div className="player-stat-row__info">
                <span className="player-stat-row__name">{player.name}</span>
                <span className="player-stat-row__pos">{player.position} · {player.gamesPlayed} GP</span>
              </div>
              <span className="player-stat-row__value">{formatted}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
