import {Col, Container, Row} from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings";
import {getDraft, getStandings, getStandingsbyConference} from "../Services/ApiHandler";
import {
    individualLeadersData,
    draftLotteryOddsData,
    playerAwards,
    teamAwards,
    easternStandings,
    westernStandings
} from "../Data/LocalData/LandingPageLocalData";
import {useState} from "react";
import { useEffect } from "react";
const LandingPage = () => {
    const [easternStandingsData, setEasternStandingsData] = useState([]);
    const [westernStandingsData, setWesternStandingsData] = useState([]);
    useEffect(() => {
        getStandingsData();
        getDraftData();
    },[])
    async function getDraftData(){
        getDraft().then((response) => {
            console.log(response.data)
        })
    }
    async function getStandingsData() {
        getStandingsbyConference().then((response) => {
            const initialEasternStandings = response.data.records[0];
            const initialWesternStandings = response.data.records[1];

            const fixedEasternStandings = createStandingsArray(initialEasternStandings.teamRecords);
            const fixedWesternStandings = createStandingsArray(initialWesternStandings.teamRecords);

            setEasternStandingsData(fixedEasternStandings);
            setWesternStandingsData(fixedWesternStandings);

        }).catch((error) => console.log(error));
    }
    function createStandingsArray(initialStandings) {
        const fixedStandings = Array();
        for (let i = 0; i < 10; i++) {
            const responseTeam = initialStandings[i]
            const fixedTeamRecord = responseTeam.leagueRecord.wins + "-" + responseTeam.leagueRecord.ot + "-" + responseTeam.leagueRecord.losses;
            const fixedTeam = {
                id: i,
                standingsPlace: responseTeam.conferenceRank,
                name: responseTeam.team.name,
                record: fixedTeamRecord,
                points: responseTeam.points
            }
            fixedStandings.push(fixedTeam);
        }
        return fixedStandings;
    }
    return (
        <Container fluid>
            <Row>
                <Col md={7}>
                    <QuickLinks></QuickLinks>
                    <LandingPageRow title={"Individual Leaders"}
                        data={individualLeadersData}></LandingPageRow>
                    <LandingPageRow title={"Draft Lottery Odds"}
                        data={draftLotteryOddsData}></LandingPageRow>
                    <LandingPageRow title={"Player Awards (2022)"}
                        data={playerAwards}></LandingPageRow>
                    <LandingPageRow title={"Team Awards (2022)"}
                        data={teamAwards}></LandingPageRow>
                </Col>
                <Col md={5}>
                    <LandingPageStandings title={"Eastern Conference"}
                        data={easternStandingsData}></LandingPageStandings>
                    <LandingPageStandings title={"Western Conference"}
                        data={westernStandingsData}></LandingPageStandings>
                </Col>
            </Row>
        </Container>
    );
}
export default LandingPage;
