import { Col, Row } from "react-bootstrap";
import styles from "../../style/LandingPage/LandingPageRow.module.css";
import React from "react";
import { TopStatLeader } from "../../Data/Models/TopStatLeader";
import StatLeaderCard from "./StatLeaderCard";

interface PlayerStatLeaderProps {
  title: string;
  topStatLeaders: Array<TopStatLeader | undefined>;
}

export default function PlayerStatLeaderRow({ title, topStatLeaders }: PlayerStatLeaderProps) {
  const availableLeaders = topStatLeaders.filter((leader): leader is TopStatLeader => Boolean(leader));

  if (availableLeaders.length < 1) return <></>;

  return (
    <div>
      <Row>
        <Col className={styles["landing-header"]}>
          <h2>{title}</h2>
        </Col>
      </Row>
      <div className={styles["row-scroller-wrapper"]}>
        <Row className={styles["row-scroller"]}>
          {availableLeaders.map((topStatLeader: TopStatLeader) => (
            <Col sm md={5} lg={4} className={styles["row-scroller-column"]} key={topStatLeader.statIndicator}>
              <StatLeaderCard topStatLeader={topStatLeader} />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
