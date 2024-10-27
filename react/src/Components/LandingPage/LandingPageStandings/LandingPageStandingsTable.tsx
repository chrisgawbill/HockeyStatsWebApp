import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import { CompactTable } from "@table-library/react-table-library/compact";
import * as React from "react";
import { useSort } from "@table-library/react-table-library/sort";
import "../../../style/LandingPage/LandingPageStandings.css";

interface LandingPageStandingTableProps {
  standingsData: StandingsTeam[];
  standingFormat: String;
}
export default function LandingPageStandingsTable({
  standingsData,
  standingFormat,
}: LandingPageStandingTableProps) {
  const theme = useTheme(getTheme());
  const data = { nodes: standingsData };
  const CONFERENCE_STANDINGS_COLUMNS = [
    {
      label: "#",
      renderCell: (item: StandingsTeam) => item.conferenceStandingsPlace,
      sort: { sortKey: "PLACE" },
    },
    {
      label: "Team",
      renderCell: (item: StandingsTeam) => item.teamName,
      sort: { sortKey: "TEAM" },
    },
    {
      label: "Record",
      renderCell: (item: StandingsTeam) => item.record,
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
  ];
  const DIVISION_STANDINGS_COLUMNS = [
    {
      label: "#",
      renderCell: (item: StandingsTeam) => item.divisionStandingsPlace,
      sort: { sortKey: "PLACE" },
    },
    {
      label: "Team",
      renderCell: (item: StandingsTeam) => item.teamName,
      sort: { sortKey: "TEAM" },
    },
    {
      label: "Record",
      renderCell: (item: StandingsTeam) => item.record,
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
  ];
  const COLUMNS = React.useRef(CONFERENCE_STANDINGS_COLUMNS);
  if(standingFormat === "Division"){
    COLUMNS.current = DIVISION_STANDINGS_COLUMNS
  }else{
    COLUMNS.current = CONFERENCE_STANDINGS_COLUMNS;
  }
  const sort = useSort(
    data,
    {
      onChange: onSortChange,
    },
    {
      sortFns: {
        PLACE: (array) =>
          array.sort(
            (a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace
          ),
        TEAM: (array) =>
          array.sort((a, b) => a.teamName.localeCompare(b.teamName)),
        RECORD: (array) =>
          array.sort((a, b) => a.record.localeCompare(b.record)),
        POINTS: (array) => array.sort((a, b) => a.points - b.points),
        POINTSPERCENTAGE: (array) =>
          array.sort((a, b) => a.pointsPercentage - b.pointsPercentage),
      },
    }
  );
  function onSortChange(action: any, state: any) {
    console.log(action, state);
  }
  return (
    <div style={{ height: "380px", marginTop: "1%", marginBottom: "2%" }}>
      <CompactTable
        className="standings-table"
        columns={COLUMNS.current}
        data={data}
        theme={theme}
        layout={{ fixedHeader: true }}
        sort={sort}
      />
    </div>
  );
}
