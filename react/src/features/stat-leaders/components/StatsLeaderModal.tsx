import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import { useId } from 'react';
import AppDialog from '@/components/AppDialog';
import styles from '@/features/stat-leaders/components/StatLeaderModal.module.css';

interface StatsLeaderModalProps {
  showModal: boolean;
  setShowStatsModal: Function;
  statsLeaderData: PlayerStatLeader[];
  modalTitle: string;
}
export default function StatsLeaderModal({
  showModal,
  setShowStatsModal,
  statsLeaderData,
  modalTitle,
}: StatsLeaderModalProps) {
  const titleId = useId();
  return (
    <div>
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
                  <th scope="col">Pos</th>
                  <th scope="col" title={modalTitle}>
                    {modalTitle}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsLeaderData.map((item) => (
                  <tr
                    key={`${item.firstName}-${item.lastName}-${item.teamName}`}
                  >
                    <td title={`${item.firstName} ${item.lastName}`}>
                      {item.firstName} {item.lastName}
                    </td>
                    <td>
                      <span className={styles['stat-leader-modal__team-cell']}>
                        <img
                          className={styles['stat-leader-modal__team-logo']}
                          src={item.teamLogo}
                          alt={item.teamName}
                        />
                        <p>{item.teamName}</p>
                      </span>
                    </td>
                    <td>{item.position}</td>
                    <td>{item.statLeaderValue}</td>
                  </tr>
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
    </div>
  );
  function handleModalClose() {
    setShowStatsModal(false);
  }
}
