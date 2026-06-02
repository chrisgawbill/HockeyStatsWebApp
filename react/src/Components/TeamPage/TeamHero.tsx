import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MockTeam } from "../../Data/LocalData/TeamPageMockData";
import { localTeamList } from "../../Data/LocalData/TeamListData";
import SeasonSelector from "../SeasonSelector";
import styles from "../../style/TeamPage/TeamPage.module.css";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

interface TeamHeroProps {
  team: MockTeam;
}

/**
 * Team page header: a colored hero with a back breadcrumb, season selector, team
 * logo, record, and standings badges. The breadcrumb's target and label come from
 * the route state's `sourcePath` (where the user navigated from), defaulting to
 * the team list. The background gradient is derived from the team's primary color.
 */
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
    <div className={styles["team-hero"]}
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor} 20%, color-mix(in srgb, ${primaryColor} 30%, #000) 100%)`,
      }}
    >
      <div className={styles["team-hero__top-row"]}>
        <nav className={styles["team-hero__breadcrumb"]}>
          <Link to={sourcePath} className={styles["team-hero__breadcrumb-back"]}>
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
          <span className={styles["team-hero__breadcrumb-sep"]}>/</span>
          <span className={styles["team-hero__breadcrumb-current"]}>{team.name}</span>
        </nav>
        <SeasonSelector className={styles["team-hero__season"]} />
      </div>
      <div className={styles["team-hero__body"]}>
        <img className={styles["team-hero__logo"]} src={logoUrl} alt={team.name} />
        <div className={styles["team-hero__info"]}>
          <h1 className={styles["team-hero__name"]}>{team.name}</h1>
          <p className={styles["team-hero__record"]}>
            {team.wins}-{team.losses}-{team.otLosses}&nbsp;·&nbsp;{team.points}{" "}
            PTS
          </p>
          <div className={styles["team-hero__badges"]}>
            <span className={styles["team-hero__badge"]}>
              #{team.conferenceRank} {team.conference} Conference
            </span>
            <span className={styles["team-hero__badge"]}>
              #{team.divisionRank} {team.division}
            </span>
            <span
              className={cx(
                styles["team-hero__badge"],
                styles["team-hero__badge--playoff"],
                team.playoffLineDelta >= 0 ? styles.above : styles.below,
              )}
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
