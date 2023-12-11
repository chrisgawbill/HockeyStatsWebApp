import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
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
                    <Col md={3} className="row-scroller-column" key={item.id}>
                        <RowBlock playerName={item.name} infoName={item.info} image={item.image} rowInfo={item.rowInfo}></RowBlock>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
export default LandingPageRow;
