import React from "react";
import { PlayerStatLeader } from "../../../Data/Models/PlayerStatLeader";
import { Modal, Button } from "react-bootstrap";
import {
    CompactTable,
  } from "@table-library/react-table-library/compact"
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

interface StatsLeaderModalProps{
    showModal:boolean,
    setShowStatsModal:Function,
    statsLeaderData:PlayerStatLeader[],
    modalTitle:string,
}
export default function StatsLeaderModal({showModal, setShowStatsModal, statsLeaderData, modalTitle}:StatsLeaderModalProps){
    const theme = useTheme(getTheme());
    const data = {nodes:statsLeaderData}
    const COLUMNS= [
        {label: 'Name', renderCell:(item:PlayerStatLeader)=>item.firstName + " " + item.lastName},
        {label: 'Team', renderCell:(item:PlayerStatLeader)=>item.teamName},
        {label: 'Position', renderCell:(item:PlayerStatLeader)=>item.position},
        {label: '#', renderCell:(item:PlayerStatLeader)=>item.value},
    ];
    return(
        <div>
        <Modal show={showModal} onHide={handleModalClose}>
            <Modal.Header>{modalTitle + " " + "Leaders"}</Modal.Header>
            <Modal.Body>
                <CompactTable columns={COLUMNS} data={data} theme={theme} layout={{fixedHeader:true}}/>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-danger" onClick={handleModalClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    </div>
    );
    function handleModalClose(){
        setShowStatsModal(false)
    }
}
