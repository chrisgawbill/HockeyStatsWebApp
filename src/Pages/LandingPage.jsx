import {Col, Container, Row} from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import LandingPageRow from "../Components/LandingPage/LandingPageRow";
const individualLeadersData = [
    { id: 1, name: "Claude Giroux", info: "Assist Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23" },
    { id: 2, name: "Sidney Crosby", info: "Scoring Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23"},
    { id: 3, name: "Connor McDavid", info: "Points Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23" },
    { id: 4, name: "Claude Giroux", info: "Assist Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23" },
    { id: 5, name: "Sidney Crosby", info: "Scoring Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23"},
    { id: 6, name: "Connor McDavid", info: "Points Leader", image:"https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg", typeOfData:"player", dataId:"23" },
  ];
  const draftLotteryOddsData = [
    { id: 1, name: "Philadlephia Flyers", info: "13.00% (UP)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23" },
    { id: 2, name: "Columbus Blue Jackets", info: "12.00% (DOWN)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23"},
    { id: 3, name: "Anaheim Ducks", info: "10.00% (UP)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23" },
    { id: 4, name: "Philadelphia Flyers", info: "13.00% (UP)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23" },
    { id: 5, name: "Columbus Blue Jackets", info: "12.00% (DOWN)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23"},
    { id: 6, name: "Anaheim Ducks", info: "10.00% (UP)", image:"https://assets-sports.thescore.com/hockey/team/9/logo.png", typeOfData:"team", dataId:"23" },
  ];
const LandingPage = () => {
    return (
        <Container fluid>
            <Row>
                <Col md={7}>
                    <QuickLinks></QuickLinks>
                    <LandingPageRow title={"Individual Leaders"} data={individualLeadersData}></LandingPageRow>
                    <LandingPageRow title={"Draft Lottery Odds"} data={draftLotteryOddsData}></LandingPageRow>
                    <LandingPageRow title={"NHL Awards"} data={draftLotteryOddsData}></LandingPageRow>
                </Col>
                <Col md={5}></Col>
            </Row>
        </Container>
    );
}
export default LandingPage;
