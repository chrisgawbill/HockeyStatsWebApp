import { getTheme } from "@table-library/react-table-library/baseline";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useSort } from "@table-library/react-table-library/sort";
import { useTheme } from "@table-library/react-table-library/theme";
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import "../../../style/LandingPage/LandingPageStandings.css";
import { CLINCH_STATUS_META, ClinchStatus } from "./ClinchStatus";

interface LandingPageStandingTableProps {
  standingsData: StandingsTeam[];
  standingFormat: string;
}

export default function LandingPageStandingsTable({
  standingsData,
  standingFormat,
}: LandingPageStandingTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const standingsSourcePath = location.pathname === "/" ? "/" : "/standings";
  const goToTeam = (team: StandingsTeam) => {
    navigate(`/team/${team.id}`, {
      state: {
        sourcePath: standingsSourcePath,
        fallbackPath: standingsSourcePath,
      },
    });
  };

  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: 0.25fr 2fr 1fr 0.5fr 0.7fr;
        border: none;
    `,
      HeaderRow: `
        & > .th {
          background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-divider);
          font-weight: 700;
          letter-spacing: 0;
        }
    `,
      BaseCell: `
        padding: 8px 6px;
    `,
      HeaderCell: `
        padding: 10px 6px;
        border-bottom: 1px solid var(--color-divider);
    `,
      Row: `
        color: var(--color-text);
        cursor: pointer;
        &:hover { color: var(--color-text); }
        &:focus-visible > .td {
          outline: 2px solid var(--color-primary);
          outline-offset: -2px;
        }
        & > .td {
          background: var(--color-surface);
          color: var(--color-text);
        }
        &:not(:last-of-type) > .td { border-bottom: 1px solid var(--color-divider); }
        &:nth-child(even) > .td { background: var(--color-chip-bg); }

        & > .td:first-child { border-left: 3px solid transparent; transition: border-left-color 0.15s ease; }
        &:hover > .td:first-child { border-left-color: var(--color-blue-accent); }
    `,
    },
  ]);

  const isDivision = standingFormat === "Division";
  const data = { nodes: standingsData };

  const getClinchStatus = (item: StandingsTeam): ClinchStatus | null => {
    const indicator = item.clinchingIndicator?.toString().trim().toLowerCase();

    if (indicator === "p") return "presidents";
    if (indicator === "z") return "conference";
    if (indicator === "y") return "division";
    if (
      indicator === "w" ||
      (indicator === "x" && item.wildCardRank > 0 && item.wildCardRank <= 2)
    ) {
      return "wildcard";
    }
    if (indicator === "x") return "playoffs";

    return null;
  };

  const renderClinchBadge = (status: ClinchStatus | null) => {
    if (!status) return null;

    const statusMeta = CLINCH_STATUS_META[status];

    return (
      <span
        className={`standings-clinch-badge ${statusMeta.className}`}
        aria-label={statusMeta.label}
        title={statusMeta.label}
      >
        {statusMeta.badge}
      </span>
    );
  };

  const getStatusCellProps = (item: StandingsTeam, isFirstCell = false) => {
    const status = getClinchStatus(item);
    if (!status) return {};

    return {
      className: `standings-status-cell ${isFirstCell ? "standings-status-cell--first" : ""} ${
        CLINCH_STATUS_META[status].className
      }`,
    };
  };

  const COLUMNS = [
    {
      label: "#",
      renderCell: (item: any) =>
        isDivision
          ? (item as StandingsTeam).divisionStandingsPlace
          : (item as StandingsTeam).conferenceStandingsPlace,
      cellProps: (item: any) => getStatusCellProps(item as StandingsTeam, true),
      sort: { sortKey: "PLACE" },
    },
    {
      label: "Team",
      renderCell: (item: any) => {
        const team = item as StandingsTeam;
        return (
          <span className="standings-table-teamName-col">
            <img
              className="standings-table-team-logo"
              src={team.teamLogo}
              alt="team logo"
            />
            <p>{team.teamName}</p>
            {renderClinchBadge(getClinchStatus(team))}
          </span>
        );
      },
      cellProps: (item: any) => getStatusCellProps(item as StandingsTeam),
      sort: { sortKey: "TEAM" },
    },
    {
      label: "Record",
      renderCell: (item: any) =>
        `${(item as StandingsTeam).wins}-${(item as StandingsTeam).losses}-${
          (item as StandingsTeam).otLosses
        }`,
      cellProps: (item: any) => getStatusCellProps(item as StandingsTeam),
      sort: { sortKey: "RECORD" },
    },
    {
      label: "P",
      renderCell: (item: any) => (item as StandingsTeam).points,
      cellProps: (item: any) => getStatusCellProps(item as StandingsTeam),
      sort: { sortKey: "POINTS" },
    },
    {
      label: "P%",
      renderCell: (item: any) => (item as StandingsTeam).pointsPercentage,
      cellProps: (item: any) => getStatusCellProps(item as StandingsTeam),
      sort: { sortKey: "POINTSPERCENTAGE" },
    },
  ];

  const HEIGHT = isDivision ? "20rem" : "38.75rem";

  const sort = useSort(
    data,
    {},
    {
      sortFns: {
        PLACE: (array) =>
          array.sort(
            (a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace,
          ),
        TEAM: (array) =>
          array.sort((a, b) => a.teamName.localeCompare(b.teamName)),
        RECORD: (array) => array.sort((a, b) => a.wins - b.wins),
        POINTS: (array) => array.sort((a, b) => a.points - b.points),
        POINTSPERCENTAGE: (array) =>
          array.sort((a, b) => a.pointsPercentage - b.pointsPercentage),
      },
    },
  );

  return (
    <div style={{ height: HEIGHT, marginTop: "1%", marginBottom: "2%" }}>
      <CompactTable
        className="standings-table"
        columns={COLUMNS}
        data={data}
        theme={theme}
        layout={{ fixedHeader: true, custom: true }}
        sort={sort}
        rowProps={{
          onClick: (team: StandingsTeam) => goToTeam(team),
          onKeyDown: (event: React.KeyboardEvent, team: StandingsTeam) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              goToTeam(team);
            }
          },
          tabIndex: 0,
          role: "button",
          "aria-label": (team: StandingsTeam) => `View ${team.teamName}`,
        }}
      />
    </div>
  );
}
