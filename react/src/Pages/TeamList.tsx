import React, { useEffect, useState } from "react";
import { GetListOfTeams, GetTeamStatsById } from "../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Data/Helpers/TeamHelpers";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Team } from "../Data/Models/Team";
import { localTeamList } from "../Data/LocalData/TeamListData";

import "../style/TeamList/TeamList.css";
import PageHeader from "../Components/PageHeader";
import TeamListModal from "../Components/LandingPage/Modals/TeamListModal";

export default function TeamList() {
  const teamListData = React.useRef<any[]>([]);
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [modalTeam, setModalTeam] = useState<Team>(new Team(0, "", []));

  useEffect(() => {
    // GetListOfTeams().then((response) => {
    //   let rawData: any[] = response.data;
    //   for (let i = 0; i < rawData.length; i++) {
    //     if (rawData[i].rawTricode === "NHL") {
    //       rawData = rawData.splice((i + 1), (rawData.length)-4);
    //       rawData = rawData.filter((team) => team.rawTricode !== "TBD")
    //       rawData.sort((a, b) => {
    //         return b.fullName - a.fullName;
    //       })
    //       teamListData.current = rawData;
    //       break;
    //     }
    //   }
    // });
    // GetTeamStatsById("").then((response) => {
    //   const rawData: any[] = response.data.data;
    //   const finalTeamData = ConvertToListOfTeams(teamListData.current, rawData);
    //   setTeamList(finalTeamData);
    // });
    GetTeams(setTeamList);
  }, [teamListData]);
  return (
    <Container>
      <PageHeader pageTitle="Team List" />
      <div className="teamList-row">
        {teamList.map((team) => (
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
  async function GetTeams(setTeamList: Function) {
    let rawLocalList: any[] = localTeamList;
    rawLocalList.sort((a, b) => {
      return b.fullName - a.fullName;
    });
    teamListData.current = rawLocalList;
    try {
      const temStatsData = await GetTeamStatsById("");
      const rawData: any[] = temStatsData.data;
      const finalTeamData = ConvertToListOfTeams(teamListData.current, rawData);
      setTeamList(finalTeamData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }
}
