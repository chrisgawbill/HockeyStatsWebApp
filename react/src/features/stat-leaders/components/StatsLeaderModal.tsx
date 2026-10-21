import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import { useId } from 'react';
import AppDialog from '@/components/AppDialog';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import { DEFAULT_HEADSHOT_URL } from '@/lib/playerHeadshot';
import styles from '@/features/stat-leaders/components/StatLeaderModal.module.css';

/** One leaderboard row: headshot with the favorite star, name, team, position and value. */
function LeaderboardRow({ leader }: { leader: PlayerStatLeader }) {
  const fullName = `${leader.firstName} ${leader.lastName}`;
  return (
    <tr>
      <td title={fullName}>
        <span className={styles['stat-leader-modal__player']}>
          <PlayerHeadshot
            playerId={leader.id}
            playerName={fullName}
            src={leader.playerImage || DEFAULT_HEADSHOT_URL}
            imgClassName={styles['stat-leader-modal__headshot']}
            starSize="sm"
            fallback={
              <img
                className={styles['stat-leader-modal__headshot']}
                src={DEFAULT_HEADSHOT_URL}
                alt=""
              />
            }
          />
          <span className={styles['stat-leader-modal__name']}>{fullName}</span>
        </span>
      </td>
      <td>
        <span className={styles['stat-leader-modal__team-cell']}>
          <img
            className={styles['stat-leader-modal__team-logo']}
            src={leader.teamLogo}
            alt={leader.teamName}
          />
          <p>{leader.teamName}</p>
        </span>
      </td>
      <td className={styles['stat-leader-modal__position']}>
        {leader.position}
      </td>
      <td>{leader.statLeaderValue}</td>
    </tr>
  );
}

interface StatsLeaderModalProps {
  showModal: boolean;
  setShowStatsModal: Function;
  statsLeaderData: PlayerStatLeader[];
  modalTitle: string;
}
/**
 * Dialog listing the leaders for one stat category. Each headshot carries the
 * favorite star; phones drop the Pos column so full names fit.
 */
export default function StatsLeaderModal({
  showModal,
  setShowStatsModal,
  statsLeaderData,
  modalTitle,
}: StatsLeaderModalProps) {
  const titleId = useId();
  return (
    <>
      <AppDialog
        open={showModal}
        onClose={handleModalClose}
        labelledBy={titleId}
        className={styles['stat-leader-modal']}
      >
        <header className={styles['stat-leader-modal__header']}>
          <h2 id={titleId}>{modalTitle + ' Leaders'}</h2>
        </header>
        <div className={styles['stat-leader-modal__body']}>
          <div
            className={`${styles['stat-leader-modal__table']} ds-table-wrap`}
          >
            <table className="ds-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Team</th>
                  <th
                    scope="col"
                    className={styles['stat-leader-modal__position']}
                  >
                    Pos
                  </th>
                  <th scope="col" title={modalTitle}>
                    {modalTitle}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsLeaderData.map((leader) => (
                  <LeaderboardRow key={leader.id} leader={leader} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <footer className={styles['stat-leader-modal__footer']}>
          <button
            type="button"
            className={`ds-button ${styles['stat-leader-modal__close']}`}
            onClick={handleModalClose}
          >
            Close
          </button>
        </footer>
      </AppDialog>
    </>
  );
  function handleModalClose() {
    setShowStatsModal(false);
  }
}
