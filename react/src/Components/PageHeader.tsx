import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "../style/PageHeader.css";

export default function PageHeader() {
  const { pathname } = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Schedule", path: "/schedule" },
    { label: "Standings", path: "/standings" },
    { label: "Team List", path: "/teamList" },
  ];

  return (
    <Row id="nav-bar">
      {navItems.map(({ label, path }) => (
        <Col key={path} className="nav-bar-item">
          <Link to={path} style={{ width: "100%" }}>
            <Button className={`nav-btn${pathname === path || (path === "/teamList" && pathname.startsWith("/team/")) ? " active-page" : ""}`}>
              {label}
            </Button>
          </Link>
        </Col>
      ))}
    </Row>
  );
}
