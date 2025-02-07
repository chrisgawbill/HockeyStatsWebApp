import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import "../../style/LandingPage/LandingPageBlock.css";
import React from "react";
import { StandingsTeam } from "../../Data/Models/StandingsTeam";
import DraftLotteryOddsTable from "./DraftLotteryOddsTable";

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
            <DraftLotteryOddsTable
              draftLotteryOddsData={draftLotteryOddsDataOne}
            />
          </Col>
          <Col>
            <DraftLotteryOddsTable
              draftLotteryOddsData={draftLotteryOddsDataTwo}
            />
          </Col>
        </Row>
      </div>
    );
  }
  return <></>;
}
