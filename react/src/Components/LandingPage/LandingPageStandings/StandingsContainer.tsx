import { Col, Row } from "react-bootstrap";
import LandingPageStandingsTitleRow from "./LandingPageStandingsTitleRow";
import LandingPageStandingsRow from "./LandingPageStandingsRow";
import "../../../style/LandingPage/LandingPageStandings.css";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import React from "react";

interface StandingsContainerProps{
  standingsName:string,
  standingsData:StandingsTeam[],
}

export default function StandingsContainer({standingsName, standingsData}:StandingsContainerProps){
  return (
    <div>
      <Row>
        <Col className="standings-header">
          <h2>{standingsName}</h2>
        </Col>
      </Row>
      <Row className="standings-table">
        <LandingPageStandingsTitleRow></LandingPageStandingsTitleRow>
        {standingsData.map((standingsTeam:StandingsTeam) => (
          <LandingPageStandingsRow
            key={standingsTeam.id}
            team={standingsTeam}
          ></LandingPageStandingsRow>
        ))}
      </Row>
    </div>
  );
};