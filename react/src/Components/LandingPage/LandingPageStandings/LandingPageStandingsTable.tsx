import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import {
  CompactTable,
} from "@table-library/react-table-library/compact";
import * as React from "react";
import { useSort } from "@table-library/react-table-library/sort";

interface LandingPageStandingTableProps {
  standingsData: StandingsTeam[];
}
export default function LandingPageStandingsTable({
  standingsData,
}: LandingPageStandingTableProps) {
  const theme = useTheme(getTheme());
  const data = {nodes:standingsData}
  const sort = useSort(
    data,
    {
        onChange:onSortChange,
    },
    {
        sortFns:{
            PLACE:(array)=>array.sort((a,b)=>a.conferenceStandingsPlace-b.conferenceStandingsPlace),
            TEAM:(array)=>array.sort((a,b)=>a.teamName.localeCompare(b.teamName)),
            WINS:(array)=>array.sort((a,b)=>a.wins-b.wins),
            LOSSES:(array)=>array.sort((a,b)=>a.losses-b.losses),
            OT:(array)=>array.sort((a,b)=>a.otLosses-b.otLosses),
            RECORD:(array)=>array.sort((a,b)=>a.record.localeCompare(b.record)),
            POINTS:(array)=>array.sort((a,b)=>a.points-b.points),
            POINTSPERCENTAGE:(array)=>array.sort((a,b)=>a.pointsPercentage-b.pointsPercentage),
        },
    }
  );
  function onSortChange(action:any,state:any){
    console.log(action, state);
  }
  const COLUMNS= [
      {label: '#', renderCell:(item:StandingsTeam)=>item.conferenceStandingsPlace,sort:{sortKey:"PLACE"}},
      {label: 'Team', renderCell:(item:StandingsTeam)=>item.teamName,sort:{sortKey:"TEAM"}},
      {label: 'W', renderCell:(item:StandingsTeam)=>item.wins,sort:{sortKey:"WINS"}},
      {label: 'L', renderCell:(item:StandingsTeam)=>item.losses,sort:{sortKey:"LOSSES"}},
      {label: 'OT', renderCell:(item:StandingsTeam)=> item.otLosses,sort:{sortKey:"OT"}},
      {label: 'Record', renderCell:(item:StandingsTeam)=>item.record,sort:{sortKey:"RECORD"}},
      {label:'P', renderCell:(item:StandingsTeam)=>item.points,sort:{sortKey:"POINTS"}},
      {label:'P%', renderCell:(item:StandingsTeam)=>item.pointsPercentage,sort:{sortKey:"POINTSPERCENTAGE"}},
  ];
  return (
    <div style={{height:"380px", marginTop:"1%", marginBottom:"2%"}}>
      <CompactTable columns={COLUMNS} data={data} theme={theme} layout={{fixedHeader:true}} sort={sort}/>
    </div>
  )
}
