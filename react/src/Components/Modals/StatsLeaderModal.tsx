import React from "react";
import { PlayerStatLeader } from "../../Data/Models/PlayerStatLeader";
import { Modal, Button } from "react-bootstrap";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

import styles from "../../style/Modals/StatLeaderModal.module.css";

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
  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: minmax(7rem, 1.4fr) 4rem 4rem 4rem;
        background: var(--color-surface);
        color: var(--color-text);
      `,
      HeaderRow: `
        & > .th {
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
          color: var(--color-text);
          border-bottom: 1px solid var(--color-divider);
          font-weight: 700;
        }
      `,
      BaseCell: `
        padding: 12px 10px;
      `,
      HeaderCell: `
        padding: 12px 10px;
      `,
      Row: `
        color: var(--color-text);
        & > .td {
          background: var(--color-surface);
          color: var(--color-text);
          border-bottom: 1px solid var(--color-divider);
        }
        &:nth-child(even) > .td {
          background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
        }
      `,
    },
  ]);
  const data = { nodes: statsLeaderData };
  const COLUMNS = [
    {
      label: "Name",
      renderCell: (item: PlayerStatLeader) =>
        item.firstName + " " + item.lastName,
    },
    {
      label: "Team",
      renderCell: (item: PlayerStatLeader) => (
        <span className={styles["stat-leader-modal__team-cell"]}>
          <img
            className={styles["stat-leader-modal__team-logo"]}
            src={item.teamLogo}
            alt={item.teamName}
          ></img>
          <p>{item.teamName}</p>
        </span>
      ),
    },
    {
      label: "Pos",
      renderCell: (item: PlayerStatLeader) => item.position,
    },
    {
      label: modalTitle,
      renderCell: (item: PlayerStatLeader) => item.statLeaderValue,
    },
  ];
  return (
    <div>
      <Modal
        show={showModal}
        onHide={handleModalClose}
        dialogClassName={styles["stat-leader-modal"]}
        contentClassName={styles["stat-leader-modal__content"]}
        centered
      >
        <Modal.Header className={styles["stat-leader-modal__header"]}>
          <Modal.Title>{modalTitle + " Leaders"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles["stat-leader-modal__body"]}>
          <div className={styles["stat-leader-modal__table"]}>
            <CompactTable
              columns={COLUMNS}
              data={data}
              theme={theme}
              layout={{ fixedHeader: true }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className={styles["stat-leader-modal__footer"]}>
          <Button className={styles["stat-leader-modal__close"]} variant="outline-danger" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  function handleModalClose() {
    setShowStatsModal(false);
  }
}
