import React, { useState } from "react";
import { useListOfGames } from "../Data/Context/ScheduleContext";
import PageHeader from "../Components/PageHeader";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { ScheduledGame } from "../Data/Models/ScheduledGame";
import { GetGameFromDay } from "../Data/Helpers/LocalDB/ScheduleDBHelpers";

function SchedulePage() {
  const { listOfGamesData, loadingListOfGamesData } = useListOfGames();
  const [todaysGames, setTodaysGames] = useState<ScheduledGame[]>([]);

  if (loadingListOfGamesData) {
    return <div>Loading...</div>;
  } else {
    return (
      <Container>
        <PageHeader pageTitle="Schedule" />
        {listOfGamesData[0].map((game: ScheduledGame) => (
          <div style={{marginTop:'10px', marginBottom:'5px'}}>
            <Row key={game.gameId}>
                <Col style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                    <img style={{height:'50px', width:'50px', marginRight:'10px'}} src={game.homeLogo} alt="home_logo"/>
                    <h3>{game.homeTeam}</h3>
                    {game.homeScore !== null ? <h3 style={{marginLeft:'10px'}}>({game.homeScore})</h3> : <></>}
                </Col>
                <Col>
                    <h3>VS</h3>
                    <p>{convertUTCToEST(game.gameTime)} EST</p>
                </Col>
                <Col style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                    {game.awayScore !== null ? <h3 style={{marginRight:'10px'}}>({game.awayScore})</h3> : <></>}
                    <h3>{game.awayTeam}</h3>
                    <img style={{height:'50px', width:'50px', marginLeft:'10px'}} src={game.awayLogo} alt="away_logo"/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <p>Venue: {game.venue}</p>
                </Col>
                <Col>
                    <ButtonGroup>
                        {game.ticketLink !== "" ? <Button>Tickets</Button> : <></>}  
                        <Button>Game Center</Button>
                    </ButtonGroup>
                </Col>
                <Col>
                    <p>Broadcasts: {game.broadcasts.map((broadcast) => (
                        `${broadcast.broadcasterName} (${broadcast.broadcastCountry}) `
                    )
                    ).join(',')}</p> 
                </Col>
            </Row>
          </div>
        ))}
      </Container>
    );
  }
}
function convertUTCToEST(utcString:string) {
    // Create a new Date object from the UTC string
    const utcDate = new Date(utcString);

    // Get the time in milliseconds
    const utcTime = utcDate.getTime();

    // Calculate the offset for EST in milliseconds (-5 hours from UTC)
    const offsetEST = -5 * 60 * 60 * 1000;

    // Create a new Date object for EST
    const estDate = new Date(utcTime + offsetEST);

    // Format the EST date as a string
    return estDate.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour:'numeric', minute:'numeric', hour12:true });
}

export default SchedulePage;
