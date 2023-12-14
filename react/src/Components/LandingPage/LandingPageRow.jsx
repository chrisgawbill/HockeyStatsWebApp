import { Col, Row } from "react-bootstrap";
import "../../style/LandingPage/LandingPageRow.css";
import RowBlock from "./RowBlock";
const LandingPageRow = (standingsName, standingsData) => {
    let copyOfStandings = new Array(16);
    for (let i = 0; i < standingsData.length; i++) {
      copyOfStandings[i] = standingsData[i];
    }
    return (
        <div>
            <Row>
                <Col className="landing-header">
                    <h2>{standingsName}</h2>
                </Col>
            </Row>
            <Row className="row-scroller">
                {copyOfStandings.map((item) => (
                    <Col md={3} className="row-scroller-column" key={item.id}>
                        <RowBlock playerName={item.name} infoName={item.info} image={item.image} rowInfo={item.rowInfo}></RowBlock>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
export default LandingPageRow;
