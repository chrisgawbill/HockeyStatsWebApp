import React from "react";
import { Team } from "../../Data/Models/team";
import { Button, Modal } from "react-bootstrap";
interface TeamListModalProps{
    showModal:boolean,
    setShowModal:Function,
    team:Team
}
export default function TeamListModal({showModal, setShowModal, team}: TeamListModalProps){
    return(
        <Modal show={showModal} onHide={handleModalClose}>
            <Modal.Header>{team.teamName}</Modal.Header>
            <Modal.Body>
                
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-danger" onClick={handleModalClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
    function handleModalClose(){
        setShowModal(false)
    }
}