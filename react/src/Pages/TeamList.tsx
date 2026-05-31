import React, { useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { Team } from "../Data/Models/Team";
import { TeamStats } from "../Data/Models/TeamStats";
import { localTeamList } from "../Data/LocalData/TeamListData";
import styles from "../style/TeamList/TeamList.module.css";
import PageHeader from "../Components/PageHeader";
import { useListOfTeamsData } from "../Data/Context/ListOfTeamsContext";
import { useNavigate } from "react-router-dom";
import { useStandingsData } from "../Data/Context/StandingsContext";
import { StandingsTeam } from "../Data/Models/StandingsTeam";

const triCodeLookup: Record<string, string> = Object.fromEntries(
  (localTeamList as any[]).map((t) => [t.fullName, t.triCode]),
);

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function getCurrentStats(team: Team): TeamStats | null {
  if (!team.seasonStats || team.seasonStats.length === 0) return null;
  return team.seasonStats.reduce((latest, stat) =>
    !latest || stat.seasonId > latest.seasonId ? stat : latest,
  );
}

type TeamFilter = "all" | "playoff" | "lottery";
type TeamSort = "name" | "points" | "winPct" | "goals" | "draftOdds";

interface TeamCardData {
  team: Team;
  stats: TeamStats | null;
  standings?: StandingsTeam;
  triCode: string;
}

function getWinPct(stats: TeamStats | null) {
  if (!stats) return 0;
  const gamesPlayed = stats.wins + stats.losses + stats.otLosses;
  return gamesPlayed > 0 ? stats.wins / gamesPlayed : 0;
}

function formatNumber(value: number | undefined, digits: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "—";
}

function getStatusLabel(team: TeamCardData, filter: TeamFilter) {
  if (filter === "playoff" && team.standings?.conferenceStandingsPlace) {
    return `#${team.standings.conferenceStandingsPlace} ${team.standings.conferenceName}`;
  }

  if (filter === "lottery" && (team.standings?.draftLotteryOdds ?? 0) > 0) {
    return `${team.standings?.draftLotteryOdds}% Lottery`;
  }

  return null;
}

export default function TeamList() {
  const { listOfTeamsData, loadingListOfTeamsData } = useListOfTeamsData();
  const { easternStandingsData, westernStandingsData, loadingStandingsData } =
    useStandingsData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [conference, setConference] = useState("All");
  const [division, setDivision] = useState("All");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const [sortBy, setSortBy] = useState<TeamSort>("name");

  const resetFilters = () => {
    setSearch("");
    setConference("All");
    setDivision("All");
    setFilter("all");
    setSortBy("name");
  };

  const standingsByTeam = useMemo(() => {
    const allStandings = [...easternStandingsData, ...westernStandingsData];
    const standingsMap = new Map<string, StandingsTeam>();

    for (const team of allStandings) {
      standingsMap.set(team.id, team);
      standingsMap.set(team.teamName, team);
      standingsMap.set(normalizeKey(team.teamName), team);
    }

    return standingsMap;
  }, [easternStandingsData, westernStandingsData]);

  const teams = useMemo<TeamCardData[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return listOfTeamsData
      .map((team: Team) => {
        const triCode = triCodeLookup[team.teamName] ?? "";
        const standings =
          standingsByTeam.get(triCode) ??
          standingsByTeam.get(team.teamName) ??
          standingsByTeam.get(normalizeKey(team.teamName));
        return {
          team,
          standings,
          stats: getCurrentStats(team),
          triCode,
        };
      })
      .filter(({ team, standings, triCode }: TeamCardData) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          team.teamName.toLowerCase().includes(normalizedSearch) ||
          triCode.toLowerCase().includes(normalizedSearch);
        const matchesConference =
          conference === "All" || standings?.conferenceName === conference;
        const matchesDivision =
          division === "All" || standings?.divisionName === division;
        const isLottery = (standings?.draftLotteryOdds ?? 0) > 0;
        const isPlayoff =
          standings?.conferenceStandingsPlace != null &&
          standings.conferenceStandingsPlace <= 8;
        const matchesFilter =
          filter === "all" ||
          (filter === "playoff" && isPlayoff) ||
          (filter === "lottery" && isLottery);

        return (
          matchesSearch && matchesConference && matchesDivision && matchesFilter
        );
      })
      .sort((a: TeamCardData, b: TeamCardData) => {
        if (sortBy === "points")
          return (b.stats?.points ?? 0) - (a.stats?.points ?? 0);
        if (sortBy === "winPct") return getWinPct(b.stats) - getWinPct(a.stats);
        if (sortBy === "goals") {
          return (b.stats?.goalsPerGame ?? 0) - (a.stats?.goalsPerGame ?? 0);
        }
        if (sortBy === "draftOdds") {
          return (
            (b.standings?.draftLotteryOdds ?? 0) -
            (a.standings?.draftLotteryOdds ?? 0)
          );
        }
        return a.team.teamName.localeCompare(b.team.teamName);
      });
  }, [
    conference,
    division,
    filter,
    listOfTeamsData,
    search,
    sortBy,
    standingsByTeam,
  ]);

  if (loadingListOfTeamsData || loadingStandingsData) {
    return <p>Loading Data</p>;
  }

  return (
    <Container fluid className={styles["team-list-page"]}>
      <PageHeader />
      <section className={styles["team-list-toolbar"]}>
        <div className={styles["team-list-toolbar__header"]}>
          <h1>Team List</h1>
          <p>{teams.length} teams</p>
        </div>
        <div className={styles["team-list-controls"]}>
          <label className={styles["team-list-search"]}>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Team or abbreviation"
            />
          </label>
          <label>
            <span>Conference</span>
            <select
              value={conference}
              onChange={(event) => setConference(event.target.value)}
            >
              <option>All</option>
              <option>Eastern</option>
              <option>Western</option>
            </select>
          </label>
          <label>
            <span>Division</span>
            <select
              value={division}
              onChange={(event) => setDivision(event.target.value)}
            >
              <option>All</option>
              <option>Atlantic</option>
              <option>Metropolitan</option>
              <option>Central</option>
              <option>Pacific</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as TeamSort)}
            >
              <option value="name">Name</option>
              <option value="points">Points</option>
              <option value="winPct">Win %</option>
              <option value="goals">Goals / GP</option>
              <option value="draftOdds">Draft Odds</option>
            </select>
          </label>
        </div>
        <div className={styles["team-list-filter-chips"]} aria-label="Team filters">
          {[
            ["all", "All Teams"],
            ["playoff", "Playoff"],
            ["lottery", "Lottery"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? styles["active"] : ""}
              onClick={() => setFilter(value as TeamFilter)}
            >
              {label}
            </button>
          ))}
          <button className={styles["team-list-reset-btn"]} onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>
      <div className={styles["team-card-grid"]}>
        {teams.map(({ team, stats, standings, triCode }) => {
          const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${triCode}_light.svg`;
          const winPct = getWinPct(stats);
          const statusLabel = getStatusLabel(
            {
              team,
              stats,
              standings,
              triCode,
            },
            filter,
          );
          return (
            <div
              key={team.teamName}
              className={styles["team-card"]}
              onClick={() => {
                navigate(`/team/${triCode}`, {
                  state: {
                    sourcePath: "/teamList",
                    fallbackPath: "/teamList",
                  },
                });
              }}
            >
              <div className={styles["team-card__top"]}>
                <img
                  className={styles["team-card__logo"]}
                  src={logoUrl}
                  alt={team.teamName}
                />
                {statusLabel && (
                  <span className={styles["team-card__status"]}>{statusLabel}</span>
                )}
              </div>
              <p className={styles["team-card__name"]}>{team.teamName}</p>
              <p className={styles["team-card__meta"]}>
                {standings?.divisionName ?? "NHL"} · {triCode}
              </p>
              {stats ? (
                <>
                  <p className={styles["team-card__record"]}>
                    {stats.wins}-{stats.losses}-{stats.otLosses}
                  </p>
                  <div className={styles["team-card__metrics"]}>
                    <span>
                      <strong className={styles["team-card__metrics-value"]}>
                        {stats.points}
                      </strong>
                      <span className={styles["team-card__metrics-label"]}>PTS</span>
                    </span>
                    <span>
                      <strong className={styles["team-card__metrics-value"]}>
                        {(winPct * 100).toFixed(1)}
                      </strong>
                      <span className={styles["team-card__metrics-label"]}>WIN%</span>
                    </span>
                    <span>
                      <strong className={styles["team-card__metrics-value"]}>
                        {formatNumber(stats.goalsPerGame, 2)}
                      </strong>
                      <span className={styles["team-card__metrics-label"]}>GF/GP</span>
                    </span>
                  </div>
                </>
              ) : (
                <p className={styles["team-card__record"]}>—</p>
              )}
            </div>
          );
        })}
      </div>
      {teams.length === 0 && (
        <p className={styles["team-list-empty"]}>No teams match the current filters.</p>
      )}
    </Container>
  );
}
