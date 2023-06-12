import { Col, Row } from "react-bootstrap";
import {useState, useEffect} from 'react';
import "../../style/LandingPageStyle.css";
import RowBlock from "./RowBlock";
const LandingPageRow = (props) => {
    return (
        <div>
            <Row>
                <Col className="landing-header">
                    <h2>{props.title}</h2>
                </Col>
            </Row>
            <Row className="row-scroller">
                {props.data.map((item) => (
                    <Col md={3} className="row-scroller-column">
                        <RowBlock playerName={item.name} infoName={item.info} image={item.image}></RowBlock>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
export default LandingPageRow;
