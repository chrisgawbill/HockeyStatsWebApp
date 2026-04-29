import React, { useState } from "react";
import { TopStatLeader } from "../../Data/Models/TopStatLeader";
import StatsLeaderModal from "../Modals/StatsLeaderModal";

interface StatLeaderCardProps {
  topStatLeader: TopStatLeader;
}

export default function StatLeaderCard({ topStatLeader }: StatLeaderCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="stat-leader-block" onClick={() => setShowModal(true)}>
        <div className="stat-leader-block-picture">
          <img src={topStatLeader.player.playerImage} alt="" />
        </div>
        <div className="stat-leader-block-info">
          <h4 className="block-info-indicator">{topStatLeader.statIndicator}</h4>
          <span className="block-info-name">
            {topStatLeader.player.firstName + " " + topStatLeader.player.lastName}
          </span>
        </div>
        <div className="stat-leader-value-block">
          <p>{topStatLeader.player.statLeaderValue}</p>
        </div>
      </div>
      <StatsLeaderModal
        showModal={showModal}
        setShowStatsModal={setShowModal}
        statsLeaderData={topStatLeader.statLeadersList}
        modalTitle={topStatLeader.statIndicator}
      />
    </>
  );
}
