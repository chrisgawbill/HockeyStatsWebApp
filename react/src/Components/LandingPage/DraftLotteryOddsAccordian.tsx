import React from "react";
import { StandingsTeam } from "../../Data/Models/StandingsTeam";

import "../../style/LandingPage/DraftLotteryOddsAccordian.css";
import { Accordion, Card, Col, Row} from "react-bootstrap";

interface DraftLotteryOddsAccordianProps {
  team: StandingsTeam;
  index: number;
}

export default function DraftLotteryOddsAccordian({
  team,
  index,
}: DraftLotteryOddsAccordianProps) {
  return (
    <Card key={index} className="draft-lottery-odds-accordion-card">
      <Accordion.Item
        eventKey={team.id.toString()}
        className="draft-lottery-odds-accordian-item"
      >
        <Accordion.Header
          key={team.id}
          className="draft-lottery-odds-accordian-header"
        >
          <Col className="draft-lottery-odds-accordion-team-logo">
            <img src={team.teamLogo} alt="team_logo" />
          </Col>
          <Col>
            <span>{team.teamName}</span>
          </Col>
          <Col className="draft-lottery-odds-accordion-odds">
            <span>{team.draftLotteryOdds}%</span>
          </Col>
        </Accordion.Header>
        <Accordion.Body>
            <Row>
                <Col className="draft-lottery-odds-accordion-record">
                    <span>{team.wins}-{team.losses}-{team.otLosses} ({team.points} pts)</span>
                </Col>
            </Row>

        </Accordion.Body>
      </Accordion.Item>
    </Card>
  );
}
