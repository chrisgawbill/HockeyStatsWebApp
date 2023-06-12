import { Button, Col, Row } from "react-bootstrap";
import "../../style/LandingPage/QuickLinks.css";
const QuickLinks = () => {
    return (
        <div>
            <Row>
                <Col className="landing-header">
                    <h2>Quick Links</h2>
                </Col>
            </Row>
            <Row>
                <Col md={3}>
                    <Button varient="info" className="quick-links-btn">Teams List</Button>
                </Col>
                <Col md={3}>
                    <Button varient="info" className="quick-links-btn">Standings</Button>
                </Col>
            </Row>
        </div>
    );
};
export default QuickLinks;
