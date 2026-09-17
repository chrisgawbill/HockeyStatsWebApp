import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import StatsLeaderModal from '@/features/stat-leaders/components/StatsLeaderModal';
import styles from '@/features/stat-leaders/components/StatLeaderCard.module.css';
import { useState } from 'react';

interface StatLeaderCardProps {
  topStatLeader: TopStatLeader;
}

export default function StatLeaderCard({ topStatLeader }: StatLeaderCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles['stat-leader-block']}
        onClick={() => setShowModal(true)}
      >
        <div className={styles['stat-leader-block-picture']}>
          <img src={topStatLeader.player.playerImage} alt="" />
        </div>
        <div className={styles['stat-leader-block-info']}>
          <span className={styles['block-info-indicator']}>
            {topStatLeader.statIndicator}
          </span>
          <span className={styles['block-info-name']}>
            {topStatLeader.player.firstName +
              ' ' +
              topStatLeader.player.lastName}
          </span>
        </div>
        <div className={styles['stat-leader-value-block']}>
          <span>{topStatLeader.player.statLeaderValue}</span>
        </div>
      </button>
      <StatsLeaderModal
        showModal={showModal}
        setShowStatsModal={setShowModal}
        statsLeaderData={topStatLeader.statLeadersList}
        modalTitle={topStatLeader.statIndicator}
      />
    </>
  );
}
