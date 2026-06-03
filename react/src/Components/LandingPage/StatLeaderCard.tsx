import React, { useState } from 'react';
import { TopStatLeader } from '../../Data/Models/topStatLeader';
import StatsLeaderModal from '../Modals/StatsLeaderModal';
import styles from '../../Style/LandingPage/StatLeaderCard.module.css';

interface StatLeaderCardProps {
  topStatLeader: TopStatLeader;
}

export default function StatLeaderCard({ topStatLeader }: StatLeaderCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={styles['stat-leader-block']}
        onClick={() => setShowModal(true)}
      >
        <div className={styles['stat-leader-block-picture']}>
          <img src={topStatLeader.player.playerImage} alt="" />
        </div>
        <div className={styles['stat-leader-block-info']}>
          <h4 className={styles['block-info-indicator']}>
            {topStatLeader.statIndicator}
          </h4>
          <span className={styles['block-info-name']}>
            {topStatLeader.player.firstName +
              ' ' +
              topStatLeader.player.lastName}
          </span>
        </div>
        <div className={styles['stat-leader-value-block']}>
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
