import React, { useState } from "react";
import { useListOfGames } from "../Data/Context/ScheduleContext";
import PageHeader from "../Components/PageHeader";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { ScheduledGame } from "../Data/Models/ScheduledGame";
import "../style/SchedulePage.css";

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
  const lowerBound: Date = parseLocalDate(listOfGamesData[0].date);
  const upperBound: Date = parseLocalDate(listOfGamesData[listOfGamesData.length - 1].date);
  return (
    <Container fluid className="schedule-page">
      <PageHeader />
      <Row className="date-row">
        <ButtonGroup>
          <Button
            className="btn btn-primary"
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
          <p className="schedule-date-label">{selectedDate.toLocaleString('default', {month:'long'})} {selectedDate.getDate()}, {selectedDate.getFullYear()}</p>
          <Button
            className="btn btn-primary"
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
        <div key={game.gameId} className="game-card">
          <Row key={game.gameId} className="game-row">
            <Col className="team-info">
              <img src={game.homeLogo} alt="home_logo" />
              <h3>{game.homeTeam}</h3>
            </Col>
            <Col className="vs">
              {game.isPlayoff && (
                <div className="game-playoff-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" aria-hidden="true">
                    <path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z"/>
                  </svg>
                  <span>
                    {game.playoffRound != null ? `R${game.playoffRound}` : "Playoffs"}
                    {game.seriesWins != null ? ` · ${game.seriesWins}` : game.playoffRound != null ? " · Playoffs" : ""}
                  </span>
                </div>
              )}
              {game.homeScore !== undefined ? (
                <>
                  <p className="game-final-score">{game.homeScore} – {game.awayScore}</p>
                  <span className={`game-period-chip${game.periodType === "OT" || game.periodType === "SO" ? " overtime" : ""}`}>
                    {game.periodType === "OT" ? "F/OT" : game.periodType === "SO" ? "F/SO" : "FINAL"}
                  </span>
                </>
              ) : (
                <>
                  <h3>VS</h3>
                  <p className="game-time">{convertUTCToLocal(game.gameTime)}</p>
                </>
              )}
            </Col>
            <Col className="team-info">
              <h3>{game.awayTeam}</h3>
              <img src={game.awayLogo} alt="away_logo" />
            </Col>
          </Row>
          <Row className="game-details">
            <Col xs={12} sm={4}>
              <p>Venue: {game.venue}</p>
            </Col>
            <Col xs={12} sm={4} className="text-center">
              <ButtonGroup className="md3-btn-group">
                {game.ticketLink !== "" ? (<Button className="btn btn-primary" onClick={() => handleTicketClick(game.ticketLink)}>Tickets</Button>) : (<></>)}
                <Button className="btn btn-primary" onClick={() => handleGameCenterClick(game.gameCenter)}>Game Center</Button>
              </ButtonGroup>
            </Col>
            <Col xs={12} sm={4}>
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
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(d: Date): number {
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
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
  const newDate = new Date(date);
  if (dayAddOrMinus === "add") {
    newDate.setDate(newDate.getDate() + 1);
  } else {
    newDate.setDate(newDate.getDate() - 1);
  }
  const newKey = toDateKey(newDate);
  const lowerKey = toDateKey(lowerBound);
  const upperKey = toDateKey(upperBound);
  if (newKey >= lowerKey && newKey <= upperKey) {
    setDateState(newDate);
    fetchGamesByDate(newDate);
  }
  prevDisabled(newKey <= lowerKey);
  nextDisabled(newKey >= upperKey);
}
function handleTicketClick(ticketLink:string){
    window.open(ticketLink, "_blank");
}
function handleGameCenterClick(gameCenterLink:string){
    const url:string = `https://www.nhl.com${gameCenterLink}`;
    window.open(url, "_blank");
}

export default SchedulePage;
