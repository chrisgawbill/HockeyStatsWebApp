import { Team } from '@/features/teams/types/team';
import { useId } from 'react';
import AppDialog from '@/components/AppDialog';
import styles from '@/features/teams/components/TeamListModal.module.css';
interface TeamListModalProps {
  showModal: boolean;
  setShowModal: Function;
  team: Team;
}
export default function TeamListModal({
  showModal,
  setShowModal,
  team,
}: TeamListModalProps) {
  const titleId = useId();
  return (
    <AppDialog open={showModal} onClose={handleModalClose} labelledBy={titleId}>
      <header className={styles.header}>
        <h2 id={titleId}>{team.teamName}</h2>
      </header>
      <div className={styles.body} />
      <footer className={styles.footer}>
        <button type="button" className={`ds-button ${styles.close}`} onClick={handleModalClose}>
          Close
        </button>
      </footer>
    </AppDialog>
  );
  function handleModalClose() {
    setShowModal(false);
  }
}
