import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import React from "react";
import { TopStatLeader } from "../../Data/Models/TopStatLeader";
import StatLeaderCard from "./StatLeaderCard";

interface PlayerStatLeaderProps {
  title: string;
  topStatLeaders: TopStatLeader[];
}

export default function PlayerStatLeaderRow({ title, topStatLeaders }: PlayerStatLeaderProps) {
  if (topStatLeaders.length < 1) return <></>;

  return (
    <div>
      <Row>
        <Col className="landing-header">
          <h2>{title}</h2>
        </Col>
      </Row>
      <div className="row-scroller-wrapper">
        <Row className="row-scroller">
          {topStatLeaders.map((topStatLeader: TopStatLeader) => (
            <Col sm md={5} lg={4} className="row-scroller-column" key={topStatLeader.player.id}>
              <StatLeaderCard topStatLeader={topStatLeader} />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
