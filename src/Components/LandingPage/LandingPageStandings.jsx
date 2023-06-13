import {Col, Container, Row} from "react-bootstrap";
import React from 'react';
import '../../style/LandingPage/LandingPageStandings.css';
import LandingPageStandingsTitleRow from "./LandingPageStandingsTitleRow";
import LandingPageStandingsRow from "./LandingPageStandingsRow";
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
                {props.data.map((item) => (
                    <LandingPageStandingsRow teamPlace={item.standingsPlace} teamName={item.name} teamRecord={item.record} teamPoints={item.points}></LandingPageStandingsRow>
                ))}
            </Row>
        </div>
    );
}
export default LandingPageStandings;