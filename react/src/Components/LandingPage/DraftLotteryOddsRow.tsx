import { Accordion, Col, Row } from "react-bootstrap";
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
    let draftLotteryOddsDataOne: StandingsTeam[] = [];
    let draftLotteryOddsDataTwo: StandingsTeam[] = [];
    for (let i = 0; i < 8; i++) {
      draftLotteryOddsDataOne.push(data[i]);
    }
    for (let i = 8; i < 16; i++) {
      draftLotteryOddsDataTwo.push(data[i]);
    }
    return (
      <div className="section-container">
        <Row>
          <Col className="landing-header">
            <h2>{title}</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <Accordion>
              {data.slice(0,8).map((team, index) => (
                <DraftLotteryOddsAccordian
                  key={index}
                  team={team}
                  index={index}
                /> 
              ))}
            </Accordion>
          </Col>
          <Col>
            <Accordion>
              {data.slice(8).map((team, index) => (
                <DraftLotteryOddsAccordian
                  key={index}
                  team={team}
                  index={index}
                />
              ))}
            </Accordion>
          </Col>
        </Row>
      </div>
    );
  }
  return <></>;
}
