import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import "../../style/LandingPage/LandingPageBlock.css";
import React from "react";
import { StandingsTeam } from "../../Data/Models/StandingsTeam";
import DraftLotteryOddsAccordian from "./DraftLotteryOddsAccordian";

interface LandingPageRowProps {
  title: string;
  data: StandingsTeam[];
}

export default function LandingPageRow({ title, data }: LandingPageRowProps) {
  if (data.length > 1) {
    const maxOdds = Math.max(...data.map((t) => t.draftLotteryOdds));
    return (
      <div className="section-container">
        <Row>
          <Col className="landing-header">
            <h2>{title}</h2>
          </Col>
        </Row>
        <Row>
          <Col xs={6}>
            {data.slice(0, 8).map((team, index) => (
              <DraftLotteryOddsAccordian
                key={team.id}
                team={team}
                index={index}
                maxOdds={maxOdds}
              />
            ))}
          </Col>
          <Col xs={6}>
            {data.slice(8).map((team, index) => (
              <DraftLotteryOddsAccordian
                key={team.id}
                team={team}
                index={index + 8}
                maxOdds={maxOdds}
              />
            ))}
          </Col>
        </Row>
      </div>
    );
  }
  return <></>;
}
