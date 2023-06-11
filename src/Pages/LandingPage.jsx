import {Col, Container, Row} from "react-bootstrap";
import QuickLinks from "../Components/LandingPage/QuickLinks";
import IndividualLeaders from "../Components/LandingPage/IndividualLeaders";
import "../style/LandingPageStyle.css";

const LandingPage = () => {
    return (
        <Container fluid>
            <Row>
                <Col md={7}>
                    <QuickLinks></QuickLinks>
                    <IndividualLeaders></IndividualLeaders>
                </Col>
                <Col md={5}></Col>
            </Row>
        </Container>
    );
}
export default LandingPage;
