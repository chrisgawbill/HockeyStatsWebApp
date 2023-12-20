import { Button, Col, Row } from "react-bootstrap";
import "../../style/LandingPage/QuickLinks.css";
import React from "react";
import { Link } from "react-router-dom";

export default function QuickLinks() {
  return (
    <div>
      <Row>
        <Col className="landing-header">
          <h2>Quick Links</h2>
        </Col>
      </Row>
      <Row>
        <Col md={3}>
          <Button variant="info" className="quick-links-btn">
            Teams List
          </Button>
        </Col>
        <Col md={3}>
          <Link to="/standings">
            <Button variant="info" className="quick-links-btn">
              Standings
            </Button>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
