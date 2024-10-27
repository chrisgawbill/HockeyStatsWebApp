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
      renderCell: (item: StandingsTeam) => <span className="standings-table-teamName-col"><img className="standings-table-team-logo" src={item.teamLogo} alt="team logo"/><p>{item.teamName}</p></span>,
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
      renderCell: (item: StandingsTeam) => <span className="standings-table-teamName-col"><img className="standings-table-team-logo" src={item.teamLogo} alt="team logo"/><p>{item.teamName}</p></span>,
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
  const HEIGHT = React.useRef("380px");

  if(standingFormat === "Division"){
    COLUMNS.current = DIVISION_STANDINGS_COLUMNS
    HEIGHT.current = "210px";
  }else{
    COLUMNS.current = CONFERENCE_STANDINGS_COLUMNS;
    HEIGHT.current = "380px";
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
    <div style={{ height: HEIGHT.current, marginTop: "1%", marginBottom: "2%" }}>
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
