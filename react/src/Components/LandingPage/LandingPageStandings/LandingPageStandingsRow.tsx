import { Col, Row } from "react-bootstrap";
import React from "react";
import { useEffect, useState } from "react";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";
import { conferenceLeaderColor, defaultColor, divisionLeaderColor, divisionRankedColor, leagueLeaderColor, outOfPlayoffsColor, wildCardColor } from "../../../style/LandingPage/colors";

interface LandingPageStandingsRowProps{
  team:StandingsTeam,
}
export default function LandingPageStandingsRow({team}:LandingPageStandingsRowProps){
    const [bottomBorder, setBottomBorder] = useState("none");
    const [rowColor, setRowColor] = useState<string>(defaultColor);

    useEffect(() => {
        if(team.conferenceStandingsPlace === 8){
            setBottomBorder("dashed")
        }
        if(team.leagueStanding === 1){
          setRowColor(leagueLeaderColor)
        }else if(team.conferenceStandingsPlace === 1){
          setRowColor(conferenceLeaderColor)
        }else if(team.divisionStandingsPlace === 1){
          setRowColor(divisionLeaderColor)
        }else if(team.divisionStandingsPlace <= 3){
          setRowColor(divisionRankedColor)
        }else if(team.wildCardRank === 1 || team.wildCardRank === 2){
          setRowColor(wildCardColor)
        }else{
          setRowColor(outOfPlayoffsColor)
        }
    },[team, team.leagueStanding, team.conferenceStandingsPlace, team.divisionStandingsPlace, team.wildCardRank])
  return (
    <div>
      <Row className="standings-info-row" style={{borderBottom:bottomBorder, borderColor:"grey", backgroundColor:rowColor}}>
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
