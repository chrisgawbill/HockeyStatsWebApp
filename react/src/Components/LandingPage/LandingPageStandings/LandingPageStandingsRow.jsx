import { Col, Row } from "react-bootstrap";
import React from "react";
import { useEffect, useState } from "react";
const LandingPageStandingsRow = (props) => {
    const [bottomBorder, setBottomBorder] = useState("none");
    useEffect(() => {
        if(props.teamPlace == 8){
            setBottomBorder("dashed")
        }
    },[])
  return (
    <div>
      <Row className="standings-info-row" style={{borderBottom:bottomBorder, borderColor:"grey"}}>
        <Col md={2} className="standings-info-column">
          <span>{props.teamPlace}</span>
        </Col>
        <Col md={4} className="standings-info-column">
          <span>{props.teamName}</span>
        </Col>
        <Col md={3} className="standings-info-column">
          <span>{props.teamRecord}</span>
        </Col>
        <Col md={3} className="standings-info-column">
          <span>{props.teamPoints}</span>
        </Col>
      </Row>
    </div>
  );
};
export default LandingPageStandingsRow;
