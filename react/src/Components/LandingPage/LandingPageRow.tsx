import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import RowBlock from "./RowBlock";
import React from "react";
interface LandingPageRowProps {
  title: string;
  data: any[];
}
export default function LandingPageRow({ title, data }: LandingPageRowProps) {
    return (
        <div>
            <Row>
                <Col className="landing-header">
                    <h2>{title}</h2>
                </Col>
            </Row>
            <Row className="row-scroller">
                {data.map((item) => (
                    <Col md={3} className="row-scroller-column" key={item.id}>
                        <RowBlock playerName={item.name} infoName={item.info} image={item.image} rowInfo={item.rowInfo}/>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
