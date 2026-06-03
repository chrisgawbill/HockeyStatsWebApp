import { Col, Container, Row } from 'react-bootstrap';
import { useState } from 'react';
import StandingsContainer from './StandingsContainer';
import SlidingToggle from './SlidingToggle';
import React from 'react';
import { useStandingsData } from '../../../Data/Context/StandingsContext';
import { StandingsTeam } from '../../../Data/Models/standingsTeam';
import StandingsClinchLegend from './StandingsClinchLegend';
import styles from '../../../Style/LandingPage/LandingPageStandings.module.css';
import LoadingState from '../../LoadingState';

type Conference = 'Eastern' | 'Western';
type StandingsView = 'conference' | 'division';

interface StandingsEntry {
  name: string;
  data: StandingsTeam[];
  format: 'Conference' | 'Division';
}

export default function LandingPageStandings() {
  const {
    easternStandingsData,
    westernStandingsData,
    metropolitanStandings,
    atlanticStandings,
    centralStandings,
    pacificStandings,
    loadingStandingsData,
  } = useStandingsData();

  const [view, setView] = useState<StandingsView>('conference');
  const [conference, setConference] = useState<Conference>('Eastern');

  if (loadingStandingsData) {
    return <LoadingState label="Loading standings" />;
  }

  const standingsLookup: Record<
    StandingsView,
    Record<Conference, StandingsEntry[]>
  > = {
    conference: {
      Eastern: [{ name: '', data: easternStandingsData, format: 'Conference' }],
      Western: [{ name: '', data: westernStandingsData, format: 'Conference' }],
    },
    division: {
      Eastern: [
        { name: 'Metro', data: metropolitanStandings, format: 'Division' },
        { name: 'Atlantic', data: atlanticStandings, format: 'Division' },
      ],
      Western: [
        { name: 'Central', data: centralStandings, format: 'Division' },
        { name: 'Pacific', data: pacificStandings, format: 'Division' },
      ],
    },
  };

  return (
    <Container>
      <Row className={styles['landing-standings-mobile-title']}>
        <Col className={styles['landing-header']}>
          <h2>Standings</h2>
        </Col>
      </Row>
      <Row className="mb-2">
        <SlidingToggle
          options={[
            { label: 'Conference', value: 'conference' as StandingsView },
            { label: 'Division', value: 'division' as StandingsView },
          ]}
          value={view}
          onChange={setView}
        />
      </Row>
      <Row className="mb-2">
        <SlidingToggle
          options={[
            { label: 'Eastern', value: 'Eastern' as Conference },
            { label: 'Western', value: 'Western' as Conference },
          ]}
          value={conference}
          onChange={setConference}
        />
      </Row>
      <StandingsClinchLegend />
      {standingsLookup[view][conference].map((entry) => (
        <Row key={entry.name}>
          <StandingsContainer
            standingsName={entry.name}
            standingsData={entry.data}
            standingFormat={entry.format}
          />
        </Row>
      ))}
    </Container>
  );
}
