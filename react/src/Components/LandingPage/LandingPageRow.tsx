import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import RowBlock from "./RowBlock";
import React from "react";
import { DraftLotteryTeam } from "../../Data/Models/DraftLotteryTeam";
interface LandingPageRowProps {
  title: string;
  data: DraftLotteryTeam[];
}
export default function LandingPageRow({ title, data }: LandingPageRowProps) {
    if(data.length >= 1){
        return  (
            <div>
                <Row>
                    <Col className="landing-header">
                        <h2>{title}</h2>
                    </Col>
                </Row>
                <Row className="row-scroller">
                    {data.map((item: DraftLotteryTeam) => (
                        <Col xs={6} md={3} className="row-scroller-column" key={item.id}>
                            <RowBlock playerName={item.teamName} infoName={item.info} image={item.image} rowInfo={item.rowInfo}/>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }
    return <></>;
}
