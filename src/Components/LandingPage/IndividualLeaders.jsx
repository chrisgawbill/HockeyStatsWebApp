import { Col, Row } from "react-bootstrap";
import "../../style/LandingPageStyle.css";
import IndividualLeadersBlock from "./IndividualLeadersBlock";
const items = [
    { id: 1, name: "Claude Giroux", info: "Assist Leader" },
    { id: 2, name: "Sidney Crosby", info: "Scoring Leader"},
    { id: 3, name: "Connor McDavid", info: "Points Leader" },
    { id: 4, name: "Claude Giroux", info: "Assist Leader" },
    { id: 5, name: "Sidney Crosby", info: "Scoring Leader"},
    { id: 6, name: "Connor McDavid", info: "Points Leader" },
  ];
const IndividualLeaders = () => {
    return (
        <div>
            <Row>
                <Col className="landing-header">
                    <h2>Individual Leaders</h2>
                </Col>
            </Row>
            <Row className="row-scroller">
                {items.map((item) => (
                    <Col md={3}>
                        <IndividualLeadersBlock playerName={item.name} infoName={item.info}></IndividualLeadersBlock>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
export default IndividualLeaders;
