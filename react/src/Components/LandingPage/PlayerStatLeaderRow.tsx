import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import React, { useState } from "react";
import { TopStatLeader } from "../../Data/Models/TopStatLeader";
import StatsLeaderModal from "../Modals/StatsLeaderModal";
import { PlayerStatLeader } from "../../Data/Models/PlayerStatLeader";

interface PlayerStatLeaderProps {
  title: string;
  topStatLeaders: TopStatLeader[];
}
export default function PlayerStatLeaderRow({
  title,
  topStatLeaders
}: PlayerStatLeaderProps) {

  const [showStatLeaderModal, setShowStatLeaderModal] =
    useState<boolean>(false);
  const [currentModalTitle, setCurrentModalTitle] = useState<string>("");
  const [currentModalStatList, setCurrentModalStatList] = useState<PlayerStatLeader[]>([]);

  if (topStatLeaders.length >= 1) {
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
            <Col
              sm
              md = {5}
              lg = {4}
              className="row-scroller-column"
              key={topStatLeader.player.id}
            >
              <div className="stat-leader-block" onClick={()=>{
                setShowStatLeaderModal(true);
                setCurrentModalTitle(topStatLeader.statIndicator);
                setCurrentModalStatList(topStatLeader.statLeadersList);
              }}>
                <div className="stat-leader-block-picture">
                  <img src={topStatLeader.player.playerImage} alt=""></img>
                </div>
                <div className="stat-leader-block-info">
                  <h4 className="block-info-indicator">
                    {topStatLeader.statIndicator}
                  </h4>
                  <span className="block-info-name">
                    {topStatLeader.player.firstName +
                      " " +
                      topStatLeader.player.lastName}
                  </span>
                </div>
                <div className="stat-leader-value-block">
                  <p>{topStatLeader.player.statLeaderValue}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
        </div>
        <StatsLeaderModal
          showModal={showStatLeaderModal}
          setShowStatsModal={setShowStatLeaderModal}
          statsLeaderData={currentModalStatList}
          modalTitle={currentModalTitle}
        ></StatsLeaderModal>
      </div>
    );
  }
  return <></>;
}
