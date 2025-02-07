import { StandingsTeam } from "../../Data/Models/StandingsTeam";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import React from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import TREND_UP from "../../style/icons/green_arrow_up.png";
import TREND_DOWN from "../../style/icons/red_arrow_down.png";
import TREND_SAME from "../../style/icons/yellow_line.png";

interface DraftLotteryOddsTableProps{
    draftLotteryOddsData:StandingsTeam[];
}
interface RowData{
    teamName:string,
    draftLotteryOdds:number,
    draftLotteryOddsTrend:string
}

export default function DraftLotteryOddsTable({
    draftLotteryOddsData
}:DraftLotteryOddsTableProps){
    const theme = useTheme(getTheme());
    const data = {nodes:draftLotteryOddsData};
    const DRAFT_LOTTERY_COLUMNS = [
        {
            label: 'Team',
            renderCell:(item:StandingsTeam) => <span className="standings-table-teamName-col"><img className="standings-table-team-logo" src={item.teamLogo} alt="team logo"/><p>{item.teamName}</p></span>
        },
        {
            label: 'Odds',
            renderCell:(item:StandingsTeam) => item.draftLotteryOdds
        },
        {
            label:'Trend',
            renderCell:(item:StandingsTeam) => {
                const trend = item.draftLotteryOddsTrend;
                if(trend === "UP"){
                    return (<img src={TREND_UP} alt="trend_up" style={{height:"4rem", width:"4rem", verticalAlign:"middle"}}/>);
                }else if(trend === "DOWN"){
                    return (<img src={TREND_DOWN} alt="trend_down" style={{height:"4rem", width:"4rem", verticalAlign:"middle"}}/>);
                }else{
                    return (<img src={TREND_SAME} alt="trend_same" style={{height:"4rem", width:"4rem", verticalAlign:"middle"}}/>);
                }
            }
        }
    ];
    const getRowStyle = (row:RowData): React.CSSProperties => {
        console.log("ROW DATA:" + row);
        if(row.draftLotteryOddsTrend === "UP"){
            return {backgroundColor:"lightgreen"}
        }else if(row.draftLotteryOddsTrend ==="DOWN"){
            return {backgroundColor:"#ff6666"}
        }else{
            return {backgroundColor:"#ff9900"}
        }
    }
      const HEIGHT = React.useRef("380px");
    return(
        <div style={{ height: HEIGHT.current, marginTop: "1%", marginBottom: "2%" }}>
            <CompactTable 
                columns={DRAFT_LOTTERY_COLUMNS}
                data={data}
                theme={theme}
                layout={{ fixedHeader:true }}
                rowProps={(row:RowData)=>({
                    style: getRowStyle(row),
                })}
            />
        </div>
    )
}