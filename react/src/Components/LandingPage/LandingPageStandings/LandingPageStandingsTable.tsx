import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import { CompactTable } from "@table-library/react-table-library/compact";
import * as React from "react";
import { useSort } from "@table-library/react-table-library/sort";
import "../../../style/LandingPage/LandingPageStandings.css";

interface LandingPageStandingTableProps {
  standingsData: StandingsTeam[];
  standingFormat: string;
}
export default function LandingPageStandingsTable({
  standingsData,
  standingFormat,
}: LandingPageStandingTableProps) {
  const theme = useTheme([getTheme(), {
    Table: `
        --data-table-library_grid-template-columns: 0.25fr 2fr 1fr 0.5fr 0.7fr;
        border: none;
    `,
    BaseCell: `
        padding: 6px 4px;
        border: none;
        border-bottom: 1px solid rgba(0,0,0,0.08);
    `,
    HeaderCell: `
        background-color: #fff;
        border-bottom: 2px solid rgba(0,0,0,0.15);
    `,
    Row: `
        &:nth-child(even) > .td { background-color: rgba(0,0,0,0.06); }
        & > .td:first-child { border-left: 3px solid transparent; transition: border-left-color 0.15s ease; }
        &:hover > .td:first-child { border-left-color: rgb(0, 100, 200); }
    `,
  }]);

  const isDivision = standingFormat === "Division";
  const data = { nodes: standingsData };

  const COLUMNS = React.useRef([
    {
      label: "#",
      renderCell: (item: StandingsTeam) =>
        isDivision ? item.divisionStandingsPlace : item.conferenceStandingsPlace,
      sort: { sortKey: "PLACE" },
    },
    {
      label: "Team",
      renderCell: (item: StandingsTeam) => (
        <span className="standings-table-teamName-col">
          <img className="standings-table-team-logo" src={item.teamLogo} alt="team logo" />
          <p>{item.teamName}</p>
        </span>
      ),
      sort: { sortKey: "TEAM" },
    },
    {
      label: "Record",
      renderCell: (item: StandingsTeam) => `${item.wins}-${item.losses}-${item.otLosses}`,
      sort: { sortKey: "RECORD" },
    },
    {
      label: "P",
      renderCell: (item: StandingsTeam) => item.points,
      sort: { sortKey: "POINTS" },
    },
    {
      label: "P%",
      renderCell: (item: StandingsTeam) => item.pointsPercentage,
      sort: { sortKey: "POINTSPERCENTAGE" },
    },
  ]);

  const HEIGHT = React.useRef(isDivision ? "20rem" : "38.75rem");
  HEIGHT.current = isDivision ? "20rem" : "38.75rem";

  const sort = useSort(
    data,
    {},
    {
      sortFns: {
        PLACE: (array) =>
          array.sort((a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace),
        TEAM: (array) =>
          array.sort((a, b) => a.teamName.localeCompare(b.teamName)),
        RECORD: (array) =>
          array.sort((a, b) => a.wins.localeCompare(b.wins)),
        POINTS: (array) => array.sort((a, b) => a.points - b.points),
        POINTSPERCENTAGE: (array) =>
          array.sort((a, b) => a.pointsPercentage - b.pointsPercentage),
      },
    }
  );

  return (
    <div style={{ height: HEIGHT.current, marginTop: "1%", marginBottom: "2%" }}>
      <CompactTable
        className="standings-table"
        columns={COLUMNS.current}
        data={data}
        theme={theme}
        layout={{ fixedHeader: true, custom: true }}
        sort={sort}
      />
    </div>
  );
}
