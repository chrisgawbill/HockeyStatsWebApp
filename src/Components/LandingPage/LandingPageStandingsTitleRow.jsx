import {Col, Container, Row} from "react-bootstrap";
import React from 'react';
import '../../style/LandingPage/LandingPageStandingsTitleRow.css';
const LandingPageStandingsTitleRow = () => {
    return(
        <div>
            <Row className="standings-title-row">
                <Col md={2} className="standings-title-column">
                    <span>Place</span>
                </Col>
                <Col md={4} className="standings-title-column">
                    <span>Team</span>
                </Col>
                <Col md={3} className="standings-title-column">
                    <span>Record</span>
                </Col>
                <Col md={3} className="standings-title-column">
                    <span>Points</span>
                </Col>
            </Row>
        </div>
    )
}
export default LandingPageStandingsTitleRow;