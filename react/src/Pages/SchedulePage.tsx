import React, { useEffect, useState } from "react";
import { useListOfGames } from "../Data/Context/ScheduleContext";
import PageHeader from "../Components/PageHeader";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { ScheduledGame } from "../Data/Models/ScheduledGame";

function SchedulePage() {
  const {
    listOfGamesData,
    loadingListOfGamesData,
    selectedDateGames,
    fetchGamesByDate,
  } = useListOfGames();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPrevButtonDisbaled, setIsPrevButtonDisabled] =
    useState<boolean>(false);
  const [isNextButtonDisbaled, setIsNextButtonDisabled] =
    useState<boolean>(false);

  if (loadingListOfGamesData) {
    return <div>Loading...</div>;
  }
  if (!listOfGamesData || listOfGamesData.length === 0) {
    return <div>No games scheduled</div>;
  }
  listOfGamesData.sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const lowerBound: Date = new Date(listOfGamesData[0].date);
  const upperBound: Date = new Date(
    listOfGamesData[listOfGamesData.length - 1].date
  );
  return (
    <Container>
      <PageHeader pageTitle="Schedule" />
      <Row style={{ marginTop: "10px", marginBottom: "5px" }}>
        <ButtonGroup>
          <Button
            style={{ marginRight: "5px", width: "20px" }}
            onClick={() =>
              getCorrectDate(
                selectedDate,
                lowerBound,
                upperBound,
                "minus",
                setSelectedDate,
                setIsPrevButtonDisabled,
                setIsNextButtonDisabled,
                fetchGamesByDate
              )
            }
            disabled={isPrevButtonDisbaled}
          >
            Prev
          </Button>
          <p>{selectedDate.toISOString().split("T")[0]}</p>
          <Button
            style={{ marginLeft: "5px", width: "20px" }}
            onClick={() =>
              getCorrectDate(
                selectedDate,
                lowerBound,
                upperBound,
                "add",
                setSelectedDate,
                setIsPrevButtonDisabled,
                setIsNextButtonDisabled,
                fetchGamesByDate
              )
            }
            disabled={isNextButtonDisbaled}
          >
            Next
          </Button>
        </ButtonGroup>
      </Row>
      {selectedDateGames.map((game: ScheduledGame) => (
        <div style={{ marginTop: "10px", marginBottom: "5px" }}>
          <Row key={game.gameId}>
            <Col
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <img
                style={{ height: "50px", width: "50px", marginRight: "10px" }}
                src={game.homeLogo}
                alt="home_logo"
              />
              <h3>{game.homeTeam}</h3>
              {game.homeScore !== null ? (
                <h3 style={{ marginLeft: "10px" }}>({game.homeScore})</h3>
              ) : (
                <></>
              )}
            </Col>
            <Col>
              <h3>VS</h3>
              <p>{convertUTCToLocal(game.gameTime)} EST</p>
            </Col>
            <Col
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {game.awayScore !== null ? (
                <h3 style={{ marginRight: "10px" }}>({game.awayScore})</h3>
              ) : (
                <></>
              )}
              <h3>{game.awayTeam}</h3>
              <img
                style={{ height: "50px", width: "50px", marginLeft: "10px" }}
                src={game.awayLogo}
                alt="away_logo"
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <p>Venue: {game.venue}</p>
            </Col>
            <Col>
              <ButtonGroup>
                {game.ticketLink !== "" ? <Button onClick={() => handleTicketClick(game.ticketLink)}>Tickets</Button> : <></>}
                <Button onClick={() => handleGameCenterClick(game.gameCenter)}>Game Center</Button>
              </ButtonGroup>
            </Col>
            <Col>
              <p>
                Broadcasts:{" "}
                {game.broadcasts
                  .map(
                    (broadcast) =>
                      `${broadcast.broadcasterName} (${broadcast.broadcastCountry}) `
                  )
                  .join(",")}
              </p>
            </Col>
          </Row>
        </div>
      ))}
    </Container>
  );
}
function convertUTCToLocal(utcString: string) {
   const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Create a new Date object from the UTC string
  const utcDate = new Date(utcString);

  // Format the EST date as a string
  const localizedDate = utcDate.toLocaleTimeString("en-US", {
    timeZone: timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return localizedDate;
}
function getCorrectDate(
  date: Date,
  lowerBound: Date,
  upperBound: Date,
  dayAddOrMinus: string,
  setDateState: Function,
  prevDisabled: Function,
  nextDisabled: Function,
  fetchGamesByDate: Function
) {
  if (dayAddOrMinus === "add") {
    date.setDate(date.getDate() + 1);
  } else {
    date.setDate(date.getDate() - 1);
  }
  if (
    date.getTime() >= lowerBound.getTime() &&
    date.getTime() <= upperBound.getTime()
  ) {
    setDateState(date);
    fetchGamesByDate(date);
  }
  if (date.getTime() >= lowerBound.getTime()) {
    prevDisabled(false);
  } else {
    prevDisabled(true);
  }
  if (date.getTime() <= upperBound.getTime()) {
    nextDisabled(false);
  } else {
    nextDisabled(true);
  }
}
function handleTicketClick(ticketLink:string){
    window.open(ticketLink, "_blank");
}
function handleGameCenterClick(gameCenterLink:string){
    const url:string = `https://www.nhl.com${gameCenterLink}`;
    window.open(url, "_blank");
}

export default SchedulePage;
