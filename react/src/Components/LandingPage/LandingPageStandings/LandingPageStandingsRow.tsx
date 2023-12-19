import { Col, Row } from "react-bootstrap";
import React from "react";
import { useEffect, useState } from "react";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";

interface LandingPageStandingsRowProps{
  team:StandingsTeam
}
export default function LandingPageStandingsRow({team}:LandingPageStandingsRowProps){
    const [bottomBorder, setBottomBorder] = useState("none");
    useEffect(() => {
        if(team.conferenceStandingsPlace === 8){
            setBottomBorder("dashed")
        }
    },[])
  return (
    <div>
      <Row className="standings-info-row" style={{borderBottom:bottomBorder, borderColor:"grey"}}>
        <Col md={1} className="standings-info-column">
          <span>{team.conferenceStandingsPlace}</span>
        </Col>
        <Col md={3} className="standings-info-column">
          <span>{team.teamName}</span>
        </Col>
        <Col md={1} className="standings-info-column">
          <span>{team.wins}</span>
        </Col>
        <Col md={1} className="standings-info-column">
          <span>{team.losses}</span>
        </Col>
        <Col md={1} className="standings-info-column">
          <span>{team.otLosses}</span>
        </Col>
        <Col md={2} className="standings-info-column">
          <span>{team.record}</span>
        </Col>
        <Col md={1} className="standings-info-column">
          <span>{team.points}</span>
        </Col>
        <Col md={1} className="standings-info-column">
          <span>{team.pointsPercentage}%</span>
        </Col>
      </Row>
    </div>
  );
};
