import { Button, Col, Row } from 'react-bootstrap';
import styles from '../../Style/LandingPage/QuickLinks.module.css';
import { Link } from 'react-router-dom';

export default function QuickLinks() {
  return (
    <div id="quick-links-container">
      <Row>
        <Col className={styles['landing-header']}>
          <h2>Quick Links</h2>
        </Col>
      </Row>
      <Row>
        <Col sm md lg={5}>
          <Link to="/teamList">
            <Button variant="info" className={styles['quick-links-btn']}>
              Teams List
            </Button>
          </Link>
        </Col>
        <Col sm md lg={5}>
          <Link to="/standings">
            <Button variant="info" className={styles['quick-links-btn']}>
              Standings
            </Button>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
