import {Col, Row} from "react-bootstrap";
import React from 'react';
import '../../../style/LandingPage/LandingPageStandingsTitleRow.css';

export default function LandingPageStandingsTitleRow(){
    return(
        <div>
            <Row className="standings-title-row">
                <Col md={1} className="standings-title-column">
                    <span>#</span>
                </Col>
                <Col md={3} className="standings-title-column">
                    <span>Team</span>
                </Col>
                <Col md={1} className="standings-title-column">
                    <span>W</span>
                </Col>
                <Col md={1} className="standings-title-column">
                    <span>L</span>
                </Col>
                <Col md={1} className="standings-title-column">
                    <span>OT</span>
                </Col>
                <Col md={2} className="standings-title-column">
                    <span>Record</span>
                </Col>
                <Col md={1} className="standings-title-column">
                    <span>P</span>
                </Col>
                <Col md={1} className="standings-title-column">
                    <span>P%</span>
                </Col>
            </Row>
        </div>
    )
}