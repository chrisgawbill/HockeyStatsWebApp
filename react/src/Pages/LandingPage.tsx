import { Col, Container, Row } from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings/LandingPageStandings";
import { useEffect, useState } from "react";
import { CreateDraftLotteryOddsArray } from "../Data/Helpers/DraftLotteryOddsHelper";
import React from "react";
import {
  GetCurrentStandings,
  GetGoalieStatLeaders,
  GetSkaterStatLeaders,
} from "../Services/ApiHandler";
import { DraftLotteryTeam } from "../Data/Models/DraftLotteryTeam";
import { PlayerStatLeader } from "../Data/Models/PlayerStatLeader";
import PlayerStatLeaderConverter from "../Data/Helpers/PlayerStatLeaderConverter";
import PlayerStatLeaderRow from "../Components/LandingPage/PlayerStatLeaderRow";
import { TopStatLeader } from "../Data/Models/TopStatLeader";
import StatsLeaderModal from "../Components/LandingPage/Modals/StatsLeaderModal";
import PageHeader from "../Components/PageHeader";

import "../style/LandingPage/LandingPageStyle.css";
import { InterfaceWithChatBot } from "../Services/GenAIHandler";
import { error } from "console";

export default function LandingPage() {
  //use States that will set with data that will be passed to components in landingPage
  const [draftLotteryOddsData, setDraftLotteryOddsData] = useState<
    DraftLotteryTeam[]
  >([]);
  //All use states for stat leader data pertaining to skaters
  const [goalLeaderData, setGoalLeaderData] = useState<PlayerStatLeader[]>([]);
  const [assistLeaderData, setAssistLeaderData] = useState<PlayerStatLeader[]>(
    []
  );
  const [pointsLeaderData, setPointsLeaderData] = useState<PlayerStatLeader[]>(
    []
  );
  const [faceoffLeadersData, setFaceoffLeadersData] = useState<PlayerStatLeader[]>([]);
  const [topPlayerLeaderData, setTopPlayerLeaderData] = useState<
    TopStatLeader[]
  >([]);
  //All use states for stat leader data pertaining to the goaltenders
  const [winsLeaderData, setWinsLeaderData] = useState<PlayerStatLeader[]>([]);
  const [savePercentageLeaderData, setSavePercentageLeaderData] = useState<
    PlayerStatLeader[]
  >([]);
  const [gaaLeaderData, setGaaLeaderData] = useState<PlayerStatLeader[]>([]);
  const [shutoutLeaderData, setShutoutLeaderData] = useState<
    PlayerStatLeader[]
  >([]);
  const [topGoalieLeaderData, setTopGoalieLeaderData] = useState<
    TopStatLeader[]
  >([]);
  //UseState for showing the modal when player leader is clicked
  const [showStatLeaderModal, setShowStatLeaderModal] =
    useState<boolean>(false);
  const [chatInfo, setChatInfo] = useState(null);
  useEffect(() => {
    GetChatInfo(setChatInfo)
  }, [])
  useEffect(() => {
    GetDraftLotteryOdds(setDraftLotteryOddsData);
    GetSkaterLeaders(
      setGoalLeaderData,
      setAssistLeaderData,
      setPointsLeaderData,
      setFaceoffLeadersData
    );
    GetGoalieLeaders(
      setWinsLeaderData,
      setSavePercentageLeaderData,
      setGaaLeaderData,
      setShutoutLeaderData
    );
  }, []);
  useEffect(() => {
    if(chatInfo !== null){
      console.log(chatInfo)
    }
  },[chatInfo])
  useEffect(() => {
    if (
      goalLeaderData[0] !== undefined &&
      assistLeaderData[0] !== undefined &&
      pointsLeaderData[0] !== undefined &&
      faceoffLeadersData[0] !== undefined
    ) {
      const goalLeader: PlayerStatLeader = goalLeaderData[0];
      const assistLeader: PlayerStatLeader = assistLeaderData[0];
      const pointsLeader: PlayerStatLeader = pointsLeaderData[0];
      const faceoffLeader:PlayerStatLeader = faceoffLeadersData[0];

      const topGoalLeader: TopStatLeader = new TopStatLeader(
        "Goals",
        goalLeader,
        goalLeaderData
      );
      const topAssistLeader: TopStatLeader = new TopStatLeader(
        "Assists",
        assistLeader,
        assistLeaderData
      );
      const topPointsLeader: TopStatLeader = new TopStatLeader(
        "Points",
        pointsLeader,
        pointsLeaderData
      );
      const topFaceoffLeader: TopStatLeader = new TopStatLeader(
        "Faceoffs",
        faceoffLeader,
        faceoffLeadersData
      );

      const topPlayerLeaders: TopStatLeader[] = [
        topGoalLeader,
        topAssistLeader,
        topPointsLeader,
        topFaceoffLeader,
      ];

      setTopPlayerLeaderData(topPlayerLeaders);
    }
  }, [goalLeaderData, assistLeaderData, pointsLeaderData, faceoffLeadersData]);
  useEffect(() => {
    if (
      winsLeaderData[0] !== undefined &&
      savePercentageLeaderData[0] !== undefined &&
      gaaLeaderData[0] !== undefined &&
      shutoutLeaderData[0] !== undefined
    ) {
      const winsLeader: PlayerStatLeader = winsLeaderData[0];
      const savePercentageLeader: PlayerStatLeader =
        savePercentageLeaderData[0];
      const gaaLeader: PlayerStatLeader = gaaLeaderData[0];
      const shutoutLeader: PlayerStatLeader = shutoutLeaderData[0];

      const topWinLeader: TopStatLeader = new TopStatLeader("Wins", winsLeader, winsLeaderData);
      const topSavePercentageLeader: TopStatLeader = new TopStatLeader(
        "SV%",
        savePercentageLeader,
        savePercentageLeaderData
      );
      const topGaaLeader: TopStatLeader = new TopStatLeader(
        "GAA",
        gaaLeader,
        gaaLeaderData
      );
      const topShutoutLeader: TopStatLeader = new TopStatLeader(
        "Shutouts",
        shutoutLeader,
        shutoutLeaderData
      );

      const topGoalieLeaders: TopStatLeader[] = [
        topWinLeader,
        topSavePercentageLeader,
        topGaaLeader,
        topShutoutLeader,
      ];

      setTopGoalieLeaderData(topGoalieLeaders);
    }
  }, [
    winsLeaderData,
    savePercentageLeaderData,
    gaaLeaderData,
    shutoutLeaderData,
  ]);
  return (
    <Container fluid>
      <PageHeader pageTitle="Home"/>
      <Row id="landingPage-content">
        <Col md={7}>
          <PlayerStatLeaderRow
            key={"skaterStatLeaders"}
            title={"Skater Stat Leaders"}
            topStatLeaders={topPlayerLeaderData}
            setShowStatModal={setShowStatLeaderModal}
          ></PlayerStatLeaderRow>
          <PlayerStatLeaderRow
            key={"goalieStatLeaders"}
            title="Goalie Stat Leaders"
            topStatLeaders={topGoalieLeaderData}
            setShowStatModal={setShowStatLeaderModal}
          ></PlayerStatLeaderRow>
          <LandingPageRow
            key={"draftLottteryOdds"}
            title={"Draft Lottery Odds"}
            data={draftLotteryOddsData}
          ></LandingPageRow>
        </Col>
        <Col md={5}>
          <LandingPageStandings></LandingPageStandings>
        </Col>
      </Row>
      {/* <StatsLeaderModal showModal={showStatLeaderModal} setShowStatsModal={setShowStatLeaderModal}></StatsLeaderModal> */}
    </Container>
  );
}
//Custom hook that parses and modifies the api data to create draftLotteryOddsArray (which is then set in the useState)
async function GetDraftLotteryOdds(setDraftLotteryOddsData: Function) {
  try{
    const data = await GetCurrentStandings();
    const draftLotteryOddsArray: DraftLotteryTeam[] =
      CreateDraftLotteryOddsArray(data.standings);
    setDraftLotteryOddsData(draftLotteryOddsArray);
  }catch(error){
    console.error("Error fetching standings: ", error);
  }
}
async function GetSkaterLeaders(
  setGoalLeaderData: Function,
  setAssistLeaderData: Function,
  setPointsLeaderData: Function,
  setFaceoffLeadersData:Function
) {
  try{
    const data = await GetSkaterStatLeaders("goals");
    const goalStatLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "goals"
    );
    setGoalLeaderData(goalStatLeaders);
  }catch(error){
    console.error("Error fetching goals: ", error);
  }
  try{
    const data = await GetSkaterStatLeaders("assists");
    const assistLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "assists"
    );
    setAssistLeaderData(assistLeaderData);
  }catch(error){
    console.error("Error fetching assists: ", error);
  }
  try{
    const data = await GetSkaterStatLeaders("points");
    const pointsLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "points"
    );
    setPointsLeaderData(pointsLeaderData);
  }catch(error){
    console.error("Error fetching points: ", error);
  }
  try{  
    const data = await GetSkaterStatLeaders("faceoffLeaders");
    const faceoffLeadersData:PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "faceoffLeaders"
    );
    setFaceoffLeadersData(faceoffLeadersData);
  }catch(error){
    console.error("Error fetching faceoff leaders: ", error);
  }
}
async function GetGoalieLeaders(
  setWinsLeaderData: Function,
  setSavePercentageLeaderData: Function,
  setGaaLeaderData: Function,
  setShutoutLeaderData: Function
) {
  try{
    const data = await GetGoalieStatLeaders("wins");
    const winsLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "wins"
    );
    setWinsLeaderData(winsLeaderData);
  }catch(error){
    console.error("Error fetching wins: ", error);
  }
  try{
    const data = await  GetGoalieStatLeaders("savePctg");
    const savePercentageLederData: PlayerStatLeader[] =
      PlayerStatLeaderConverter(data, "savePctg");
    setSavePercentageLeaderData(savePercentageLederData);
  }catch(error){
    console.error("Error fetching save percentage: ", error);
  }
  try{
    const data = await GetGoalieStatLeaders("goalsAgainstAverage");
    const gaaLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "goalsAgainstAverage"
    );
    setGaaLeaderData(gaaLeaderData);
  }catch(error){
    console.error("Error fetching goals against average: ", error);
  }
  try{
    const data = await GetGoalieStatLeaders("shutouts");
    const shutoutLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
      data,
      "shutouts"
    );
    setShutoutLeaderData(shutoutLeaderData);
  }catch(error){
    console.error("Error fetching shutouts: ", error);
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
