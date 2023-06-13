import {Col, Container, Row} from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
import LandingPageStandings from "../Components/LandingPage/LandingPageStandings";
import { individualLeadersData, draftLotteryOddsData, playerAwards, teamAwards, easternStandings, westernStandings } from "../Data/LocalData/LandingPageLocalData";
const LandingPage = () => {
    return (
        <Container fluid>
            <Row>
                <Col md={7}>
                    <QuickLinks></QuickLinks>
                    <LandingPageRow title={"Individual Leaders"} data={individualLeadersData}></LandingPageRow>
                    <LandingPageRow title={"Draft Lottery Odds"} data={draftLotteryOddsData}></LandingPageRow>
                    <LandingPageRow title={"Player Awards (2022)"} data={playerAwards}></LandingPageRow>
                    <LandingPageRow title={"Team Awards (2022)"} data={teamAwards}></LandingPageRow>
                </Col>
                <Col md={5}>
                  <LandingPageStandings title={"Eastern Conference"} data={easternStandings}></LandingPageStandings>
                  <LandingPageStandings title={"Western Conference"} data={westernStandings}></LandingPageStandings>
                </Col>
            </Row>
        </Container>
    );
}
export default LandingPage;
