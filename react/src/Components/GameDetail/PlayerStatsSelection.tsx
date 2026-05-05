import React from "react";
import { BoxscoreSkater, BoxscoreGoalie, BoxscoreTeamStats } from "../../Data/Models/GameDetail";
import { getTeamPrimaryColor } from "../../Data/Helpers/TeamColor";
import shared from "../../style/shared.module.css";
import styles from "../../style/GameDetailPage.module.css";

interface Props {
  homeTeam: BoxscoreTeamStats;
  awayTeam: BoxscoreTeamStats;
  homeAbbrev: string;
  awayAbbrev: string;
}

function toSeconds(toi: string): number {
  const [m, s] = toi.split(":").map(Number);
  return m * 60 + (s || 0);
}

function formatSvPct(pct?: number): string {
  if (pct == null) return "—";
  return (pct * 100).toFixed(1) + "%";
}

function SkaterTable({ skaters }: { skaters: BoxscoreSkater[] }) {
  const sorted = [...skaters].sort((a, b) => toSeconds(b.toi) - toSeconds(a.toi));
  return (
    <div className={`${styles["player-box-table-wrapper"]} ${shared.surface} ${shared.surfaceScroll}`}>
      <table className={styles["player-box-table"]}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles["player-box-table__name-col"]}>Name</th>
            <th>Pos</th>
            <th>G</th>
            <th>A</th>
            <th>P</th>
            <th>+/-</th>
            <th>PIM</th>
            <th>Hits</th>
            <th>Blk</th>
            <th>SOG</th>
            <th>TOI</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.playerId}>
              <td className={styles["player-box-table__muted"]}>{p.sweaterNumber}</td>
              <td className={styles["player-box-table__name-col"]}>{p.name.default}</td>
              <td className={styles["player-box-table__muted"]}>{p.position}</td>
              <td>{p.goals}</td>
              <td>{p.assists}</td>
              <td className={p.points > 0 ? styles["player-box-table__highlight"] : ""}>{p.points}</td>
              <td
                className={
                  p.plusMinus > 0
                    ? styles["player-box-table__positive"]
                    : p.plusMinus < 0
                      ? styles["player-box-table__negative"]
                      : ""
                }
              >
                {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
              </td>
              <td>{p.pim}</td>
              <td>{p.hits}</td>
              <td>{p.blockedShots}</td>
              <td>{p.sog}</td>
              <td className={styles["player-box-table__muted"]}>{p.toi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GoalieTable({ goalies }: { goalies: BoxscoreGoalie[] }) {
  const played = goalies.filter((g) => toSeconds(g.toi) > 0);
  if (played.length === 0) return null;
  return (
    <div className={`${styles["player-box-table-wrapper"]} ${shared.surface} ${shared.surfaceScroll}`}>
      <table className={styles["player-box-table"]}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles["player-box-table__name-col"]}>Name</th>
            <th>Dec</th>
            <th>SV/SA</th>
            <th>SV%</th>
            <th>GA</th>
            <th>TOI</th>
          </tr>
        </thead>
        <tbody>
          {played.map((g) => (
            <tr key={g.playerId}>
              <td className={styles["player-box-table__muted"]}>{g.sweaterNumber}</td>
              <td className={styles["player-box-table__name-col"]}>{g.name.default}</td>
              <td
                className={
                  g.decision === "W"
                    ? styles["player-box-table__positive"]
                    : g.decision === "L"
                      ? styles["player-box-table__negative"]
                      : styles["player-box-table__muted"]
                }
              >
                {g.decision ?? "—"}
              </td>
              <td>{g.saveShotsAgainst ?? `${g.saves}/${g.shotsAgainst}`}</td>
              <td>{formatSvPct(g.savePctg)}</td>
              <td>{g.goalsAgainst}</td>
              <td className={styles["player-box-table__muted"]}>{g.toi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamPlayerStats({ team, abbrev }: { team: BoxscoreTeamStats; abbrev: string }) {
  const skaters = [...team.forwards, ...team.defense];
  const teamColor = getTeamPrimaryColor(abbrev);

  return (
    <div
      className={styles["player-stats-team-block"]}
      style={{ "--player-team-color": teamColor } as React.CSSProperties}
    >
      <h3 className={styles["player-stats-team-block__title"]}>{abbrev}</h3>
      <p className={styles["player-stats-team-block__subtitle"]}>Skaters</p>
      <SkaterTable skaters={skaters} />
      <p className={styles["player-stats-team-block__subtitle"]}>Goalies</p>
      <GoalieTable goalies={team.goalies} />
    </div>
  );
}

const PlayerStatsSelection = ({ homeTeam, awayTeam, homeAbbrev, awayAbbrev }: Props) => {
  return (
    <section className={`${styles["game-detail-section"]} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Player Stats</h2>
      <TeamPlayerStats team={awayTeam} abbrev={awayAbbrev} />
      <TeamPlayerStats team={homeTeam} abbrev={homeAbbrev} />
    </section>
  );
};

export default PlayerStatsSelection;
