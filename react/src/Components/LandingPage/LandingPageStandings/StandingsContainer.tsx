import { Col, Row } from "react-bootstrap";
import "../../../style/LandingPage/LandingPageStandings.css";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import React from "react";
import LandingPageStandingsTable from "./LandingPageStandingsTable";

interface StandingsContainerProps {
  standingsName: string;
  standingsData: StandingsTeam[];
  standingFormat:String;
}

export default function StandingsContainer({
  standingsName,
  standingsData,
  standingFormat,
}: StandingsContainerProps) {
  if (standingsData.length > 1) {
    return (
      <div>
        <Row>
          <Col className="standings-header">
            <Row>
              <h3>{standingsName}</h3>
            </Row>
          </Col>
        </Row>
        <Row>
          <LandingPageStandingsTable standingsData={standingsData} standingFormat={standingFormat} />
        </Row>
      </div>
    );
  }else{
    return(
      <></>
    );
  }
}
