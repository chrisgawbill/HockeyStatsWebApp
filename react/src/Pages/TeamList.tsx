import React, { useEffect, useState } from "react";
import { GetListOfTeams, GetTeamStatsById } from "../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Data/Helpers/TeamHelpers";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Team } from "../Data/Models/Team";
import { localTeamList } from "../Data/LocalData/TeamListData";

import "../style/TeamList/TeamList.css";
import PageHeader from "../Components/PageHeader";
import TeamListModal from "../Components/Modals/TeamListModal";
import { useListOfTeamsData } from "../Data/Context/ListOfTeamsContext";

export default function TeamList() {
  const {listOfTeamsData, loadingListOfTeamsData} = useListOfTeamsData();
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [modalTeam, setModalTeam] = useState<Team>(new Team(0, "", []));
  if(loadingListOfTeamsData){
    return(
      <p>Loading Data</p>
    );
  }else{
    return (
      <Container fluid>
        <PageHeader />
        <div className="teamList-row">
          {listOfTeamsData.map((team: Team) => (
            <Row key={team.id} className="teamList-block"  
              onClick={() => {
              setShowTeamModal(true);
              setModalTeam(team);
            }}>
              <Col>
                <p>{team.teamName}</p>
              </Col>
              <Col>
                <Link to="/TeamPage">
                  <Button>GO</Button>
                </Link>
              </Col>
            </Row>
          ))}
        </div>
        <TeamListModal
          showModal={showTeamModal}
          setShowModal={setShowTeamModal}
          team={modalTeam}
        />
      </Container>
    );
  }
}
