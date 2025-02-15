import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  pageTitle: string;
}
export default function PageHeader({ pageTitle }: PageHeaderProps) {
  return (
    <>
      <Row id="standing-page-header">
        <h2>{pageTitle}</h2>
      </Row>
      <Row id="standings-page-header-menu">
        <Col xs={2} md={3} className="standings-page-header-menu-item">
          <Link to="/">
            <Button className="header-menu-btn">Home</Button>
          </Link>
        </Col>
        <Col xs={2} md={3} className="standings-page-header-menu-item">
          <Link to="/schedule">
            <Button className="header-menu-btn">Schedule</Button>
          </Link>
        </Col>
        <Col xs={2} md={3} className="standings-page-header-menu-item">
          <Link to="/standings">
            <Button className="header-menu-btn">Standings</Button>
          </Link>
        </Col>
        <Col xs={2} md={3} className="standings-page-header-menu-item">
          <Link to="/teamList">
            <Button className="header-menu-btn">Team List</Button>
          </Link>
        </Col>
      </Row>
    </>
  );
}
