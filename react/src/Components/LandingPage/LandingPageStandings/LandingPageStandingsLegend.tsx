import React from "react";
import { Col} from "react-bootstrap";
import { leagueLeaderColor } from "../../../style/LandingPage/colors";
export default function LeaguePageStandingsLegend(){
    return(
        <div style={{display:"inline-block"}}>
            <Col>
                <span>
                    <div style={{width:"5px", height:"5px", color:leagueLeaderColor}}/>
                    <p style={{fontWeight:"bold"}}>League Leader</p>
                </span>
            </Col>
        </div>
    )
}