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

  useEffect(() => {
    GetDraftLotteryOdds(setDraftLotteryOddsData);
    GetSkaterLeaders(
      setGoalLeaderData,
      setAssistLeaderData,
      setPointsLeaderData
    );
    GetGoalieLeaders(
      setWinsLeaderData,
      setSavePercentageLeaderData,
      setGaaLeaderData,
      setShutoutLeaderData
    );
  }, []);
  useEffect(() => {
    if (
      goalLeaderData[0] !== undefined &&
      assistLeaderData[0] !== undefined &&
      pointsLeaderData[0] !== undefined
    ) {
      const goalLeader: PlayerStatLeader = goalLeaderData[0];
      const assistLeader: PlayerStatLeader = assistLeaderData[0];
      const pointsLeader: PlayerStatLeader = pointsLeaderData[0];

      const topGoalLeader: TopStatLeader = new TopStatLeader(
        "Goals",
        goalLeader
      );
      const topAssistLeader: TopStatLeader = new TopStatLeader(
        "Assists",
        assistLeader
      );
      const topPointsLeadr: TopStatLeader = new TopStatLeader(
        "Points",
        pointsLeader
      );

      const topPlayerLeaders: TopStatLeader[] = [
        topGoalLeader,
        topAssistLeader,
        topPointsLeadr,
      ];

      setTopPlayerLeaderData(topPlayerLeaders);
    }
  }, [goalLeaderData, assistLeaderData, pointsLeaderData]);
  useEffect(() => {
    console.log(savePercentageLeaderData)
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

      const topWinLeader: TopStatLeader = new TopStatLeader("Wins", winsLeader);
      const topSavePercentageLeader: TopStatLeader = new TopStatLeader(
        "SV%",
        savePercentageLeader
      );
      const topGaaLeader: TopStatLeader = new TopStatLeader(
        "GAA",
        gaaLeader
      );
      const topShutoutLeader: TopStatLeader = new TopStatLeader(
        "Shutouts",
        shutoutLeader
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
      <Row>
        <Col md={7}>
          <QuickLinks></QuickLinks>
          <PlayerStatLeaderRow
            title={"Skater Stat Leaders"}
            topStatLeaders={topPlayerLeaderData}
            setShowStatModal={setShowStatLeaderModal}
          ></PlayerStatLeaderRow>
          <PlayerStatLeaderRow
            title="Goalie Stat Leaders"
            topStatLeaders={topGoalieLeaderData}
            setShowStatModal={setShowStatLeaderModal}
          ></PlayerStatLeaderRow>
          <LandingPageRow
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
function GetDraftLotteryOdds(setDraftLotteryOddsData: Function) {
  GetCurrentStandings()
    .then((response) => {
      const responseData = response.data.standings;
      const draftLotteryOddsArray: DraftLotteryTeam[] =
        CreateDraftLotteryOddsArray(responseData);
      setDraftLotteryOddsData(draftLotteryOddsArray);
    })
    .catch((error) => console.log(error));
}
function GetSkaterLeaders(
  setGoalLeaderData: Function,
  setAssistLeaderData: Function,
  setPointsLeaderData: Function
) {
  GetSkaterStatLeaders("goals")
    .then((response) => {
      const responseData = response.data;
      const goalStatLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "goals"
      );
      setGoalLeaderData(goalStatLeaders);
    })
    .catch((error) => console.log(error));
  GetSkaterStatLeaders("assists")
    .then((response) => {
      const responseData = response.data;
      const assistLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "assists"
      );
      setAssistLeaderData(assistLeaderData);
    })
    .catch((error) => console.log(error));
  GetSkaterStatLeaders("points")
    .then((response) => {
      const responseData = response.data;
      const pointsLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "points"
      );
      setPointsLeaderData(pointsLeaderData);
    })
    .catch((error) => console.log(error));
}
function GetGoalieLeaders(
  setWinsLeaderData: Function,
  setSavePercentageLeaderData: Function,
  setGaaLeaderData: Function,
  setShutoutLeaderData: Function
) {
  GetGoalieStatLeaders("wins")
    .then((response) => {
      const responseData = response.data;
      const winsLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "wins"
      );
      setWinsLeaderData(winsLeaderData);
    })
    .catch((error) => console.log(error));
  GetGoalieStatLeaders("savePctg")
    .then((response) => {
      const responseData = response.data;
      const savePercentageLederData: PlayerStatLeader[] =
        PlayerStatLeaderConverter(responseData, "savePctg");
      setSavePercentageLeaderData(savePercentageLederData);
    })
    .catch((error) => console.log(error));
  GetGoalieStatLeaders("goalsAgainstAverage")
    .then((response) => {
      const responseData = response.data;
      const gaaLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "goalsAgainstAverage"
      );
      setGaaLeaderData(gaaLeaderData);
    })
    .catch((error) => console.log(error));
  GetGoalieStatLeaders("shutouts")
    .then((response) => {
      const responseData = response.data;
      const shutoutLeaderData: PlayerStatLeader[] = PlayerStatLeaderConverter(
        responseData,
        "shutouts"
      );
      setShutoutLeaderData(shutoutLeaderData);
    })
    .catch((error) => console.log(error));
}
