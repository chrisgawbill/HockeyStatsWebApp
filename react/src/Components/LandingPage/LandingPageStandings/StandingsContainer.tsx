import { Col, Row } from "react-bootstrap";
import "../../../style/LandingPage/LandingPageStandings.css";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import React from "react";
import LandingPageStandingsTable from "./LandingPageStandingsTable";

interface StandingsContainerProps {
  standingsName: string;
  standingsData: StandingsTeam[];
}

export default function StandingsContainer({
  standingsName,
  standingsData,
}: StandingsContainerProps) {
  if (standingsData.length > 1) {
    return (
      <div>
        <Row>
          <Col className="standings-header">
            <Row>
              <h2>{standingsName}</h2>
            </Row>
          </Col>
        </Row>
        <Row>
          <LandingPageStandingsTable standingsData={standingsData} />
        </Row>
      </div>
    );
  }else{
    return(
      <></>
    );
  }
}
