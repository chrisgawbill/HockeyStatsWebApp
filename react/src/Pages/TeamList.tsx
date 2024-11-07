import React, { useEffect, useState } from "react";
import { GetListOfTeams, GetTeamStatsById } from "../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Data/Helpers/TeamHelpers";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Team } from "../Data/Models/Team";

import "../style/TeamList/TeamList.css";
import PageHeader from "../Components/PageHeader";

export default function TeamList() {
  const teamListData = React.useRef<any[]>([]);
  const [teamList, setTeamList] = useState<Team[]>([]);

  useEffect(() => {
    GetListOfTeams().then((response) => {
      let rawData: any[] = response.data.data;
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i].rawTricode === "NHL") {
          rawData = rawData.splice((i + 1), (rawData.length)-4);
          rawData = rawData.filter((team) => team.rawTricode !== "TBD")
          rawData.sort((a, b) => {
            return b.fullName - a.fullName;
          })
          teamListData.current = rawData;
          break;
        }
      }
    });
    GetTeamStatsById("").then((response) => {
      const rawData: any[] = response.data.data;
      const finalTeamData = ConvertToListOfTeams(teamListData.current, rawData);
      setTeamList(finalTeamData);
    });
  },[teamListData]);
  return (
    <Container>
      <PageHeader pageTitle="Team List"/>
      <div>
        {
            teamList.map((team)=>{
                return(
                    <Row className="teamList-row">
                        <div className="teamList-block">
                            <p>{team.teamName}</p>
                        </div>
                    </Row>
                )
            })
        }
      </div>
    </Container>
  );
}
