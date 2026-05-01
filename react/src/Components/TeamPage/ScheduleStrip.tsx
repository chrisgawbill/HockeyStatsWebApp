import React, { useState, useEffect, useMemo } from "react";
import { MockScheduleGame } from "../../Data/LocalData/TeamPageMockData";

const PAGE_SIZE = 7;

interface ScheduleStripProps {
  games: MockScheduleGame[];
}

export default function ScheduleStrip({ games }: ScheduleStripProps) {
  const [page, setPage] = useState(0);
  const [slideDir, setSlideDir] = useState<"prev" | "next" | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const baseOffset = useMemo(() => {
    if (games.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureIdx = games.findIndex(
      (g) => new Date(g.isoDate + "T12:00:00") >= today
    );
    const anchor = futureIdx === -1 ? games.length : futureIdx;
    return Math.max(0, anchor - 3);
  }, [games]);

  // Reset to page 0 when a new team's games arrive
  const gamesSignature = `${games.length}:${games[0]?.gameId ?? ""}`;
  useEffect(() => {
    setPage(0);
    setSlideDir(null);
  }, [gamesSignature]);

  const startIdx = Math.max(0, baseOffset + page * PAGE_SIZE);
  const pageGames = games.slice(startIdx, startIdx + PAGE_SIZE);
  const canGoPrev = startIdx > 0;
  const canGoNext = startIdx + PAGE_SIZE < games.length;

  const goTo = (dir: "prev" | "next") => {
    setSlideDir(dir);
    setPage((p) => (dir === "prev" ? p - 1 : p + 1));
    setAnimKey((k) => k + 1);
  };

  return (
    <section className="team-section">
      <h2 className="team-section__title">Schedule</h2>
      <div className="schedule-strip-wrapper">
        <button
          className={`schedule-strip__nav${!canGoPrev ? " schedule-strip__nav--hidden" : ""}`}
          onClick={() => goTo("prev")}
          aria-label="Previous games"
          tabIndex={canGoPrev ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          key={animKey}
          className={`schedule-strip${slideDir ? ` schedule-strip--${slideDir}` : ""}`}
        >
          {pageGames.map((game, index) => {
            const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${game.opponentTriCode}_light.svg`;
            return (
              <div
                key={game.gameId}
                className="schedule-strip__card"
                style={{ "--card-index": index } as React.CSSProperties}
              >
                {game.isPlayoff && (
                  <div className="schedule-strip__playoff-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" aria-hidden="true">
                      <path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z"/>
                    </svg>
                    <span>
                      {game.playoffRound != null ? `R${game.playoffRound}` : "Playoffs"}
                      {game.seriesWins != null ? ` · ${game.seriesWins}` : game.playoffRound != null ? " · Playoffs" : ""}
                    </span>
                  </div>
                )}
                <img className="schedule-strip__logo" src={logoUrl} alt={game.opponent} />
                <p className="schedule-strip__opponent">{game.opponent}</p>
                {game.teamScore != null && game.oppScore != null ? (
                  <p className={`schedule-strip__score ${game.result?.includes("W") ? "win" : "loss"}`}>
                    {game.teamScore} – {game.oppScore}
                  </p>
                ) : (
                  <p className="schedule-strip__date">{game.date}</p>
                )}
                <div className="schedule-strip__footer">
                  <span className={`schedule-strip__badge ${game.isHome ? "home" : "away"}`}>
                    {game.isHome ? "Home" : "Away"}
                  </span>
                  {game.result && (
                    <span className={`schedule-strip__result ${game.result.includes("W") ? "win" : "loss"}`}>
                      {game.result}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className={`schedule-strip__nav${!canGoNext ? " schedule-strip__nav--hidden" : ""}`}
          onClick={() => goTo("next")}
          aria-label="Next games"
          tabIndex={canGoNext ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
