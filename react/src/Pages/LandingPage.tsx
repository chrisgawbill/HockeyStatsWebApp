import { Col, Container, Row } from "react-bootstrap";
import LandingPageRow from "../Components/LandingPage/DraftLotteryOddsRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings/LandingPageStandings";
import { useEffect, useState } from "react";
import React from "react";
import PlayerStatLeaderRow from "../Components/LandingPage/PlayerStatLeaderRow";
import PageHeader from "../Components/PageHeader";

import "../style/LandingPage/LandingPageStyle.css";
import { InterfaceWithChatBot } from "../Services/GenAIHandler";
import { useSkaterLeaderData } from "../Data/Context/SkaterStatLeadersContext";
import { useGoalieLeaderData } from "../Data/Context/GoalieStatLeadersContext";
import {useDraftLotteryOddsData } from "../Data/Context/StandingsContext";
import DraftLotteryOddsRow from "../Components/LandingPage/DraftLotteryOddsRow";

export default function LandingPage() {
  const {goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData, loadingSkaterLeaderData} = useSkaterLeaderData();
  const {winsLeaderData, savePercentageLeaderData, gaaLeaderData, shutoutLeaderData, loadingGoalieLeaderData} = useGoalieLeaderData();

  const draftLotteryOddsData = useDraftLotteryOddsData();

  const [chatInfo, setChatInfo] = useState(null);
  useEffect(() => {
    GetChatInfo(setChatInfo)
  }, [])
  useEffect(() => {
    if(chatInfo !== null){
      console.log(chatInfo)
    }
  },[chatInfo])

  if(loadingSkaterLeaderData === true || loadingGoalieLeaderData === true || !draftLotteryOddsData){
    return(
      <p>Loading Data</p>
    );
  }else{
    return (
      <Container fluid>
        <PageHeader pageTitle="Home"/>
        <Row id="landingPage-content">
          <Col lg={7}>
            <PlayerStatLeaderRow
              key={"skaterStatLeaders"}
              title={"Skater Stat Leaders"}
              topStatLeaders={[goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData]}
            ></PlayerStatLeaderRow>
            <PlayerStatLeaderRow
              key={"goalieStatLeaders"}
              title="Goalie Stat Leaders"
              topStatLeaders={[winsLeaderData, savePercentageLeaderData, gaaLeaderData, shutoutLeaderData]}
            ></PlayerStatLeaderRow>
            <DraftLotteryOddsRow
              key={"draftLottteryOdds"}
              title={"Draft Lottery Odds"}
              data={draftLotteryOddsData}
            ></DraftLotteryOddsRow>
          </Col>
          <Col lg={5}>
            <LandingPageStandings></LandingPageStandings>
          </Col>
        </Row>
      </Container>
    );
  }
}
async function GetChatInfo(setChatInfo:Function){
  try{
    const message = {content: 'What is the history of the Philadelphia Flyers, break the history up into 5 segments with each segment being 200-300 words, give me the data in JSON format, call the name of the array containing the data "History"'}
    const data =  await InterfaceWithChatBot(message);
    setChatInfo(data)
  }catch(error){
    console.error("An erorr has occured in the component: ", error);
    throw error;
  }
}
