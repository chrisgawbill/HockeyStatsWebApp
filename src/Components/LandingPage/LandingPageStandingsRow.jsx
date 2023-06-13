import { Col, Container, Row } from "react-bootstrap";
import React from "react";
const LandingPageStandingsRow = () => {
  return (
    <div>
      <Row className="standings-info-row">
        <Col md={2} className="standings-info-column">
          <span>Place</span>
        </Col>
        <Col md={4} className="standings-info-column">
          <span>Team</span>
        </Col>
        <Col md={3} className="standings-info-column">
          <span>Record</span>
        </Col>
        <Col md={3} className="standings-info-column">
          <span>Points</span>
        </Col>
      </Row>
    </div>
  );
};
export default LandingPageStandingsRow;
