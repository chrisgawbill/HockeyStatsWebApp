import {Col, Container, Row} from "react-bootstrap";
import React from 'react';
import '../../style/LandingPage/LandingPageStandings.css';
import LandingPageStandingsTitleRow from "./LandingPageStandingsTitleRow";
const LandingPageStandings = (props) => {
    return(
        <div>
            <Row>
                <Col>
                    <h2>{props.title}</h2>
                </Col>
            </Row>
            <Row className="standings-row">
                <LandingPageStandingsTitleRow></LandingPageStandingsTitleRow>
            </Row>
        </div>
    );
}
export default LandingPageStandings;