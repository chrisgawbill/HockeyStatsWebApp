import { Col, Row } from 'react-bootstrap';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import LandingPageStandingsTable from '@/features/standings/components/LandingPageStandingsTable';

interface StandingsContainerProps {
  standingsName: string;
  standingsData: StandingsTeam[];
  standingFormat: string;
}

export default function StandingsContainer({
  standingsName,
  standingsData,
  standingFormat,
}: StandingsContainerProps) {
  if (standingsData.length > 1) {
    return (
      <div>
        <Row>
          <Col className={styles['standings-header']}>
            <Row>
              <h3>{standingsName}</h3>
            </Row>
          </Col>
        </Row>
        <Row>
          <LandingPageStandingsTable
            standingsData={standingsData}
            standingFormat={standingFormat}
          />
        </Row>
      </div>
    );
  } else {
    return <></>;
  }
}
