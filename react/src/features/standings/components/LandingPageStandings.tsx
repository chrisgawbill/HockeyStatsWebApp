import { Col, Container, Row } from 'react-bootstrap';
import { useState } from 'react';
import StandingsContainer from '@/features/standings/components/StandingsContainer';
import SlidingToggle from '@/components/SlidingToggle';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import StandingsClinchLegend from '@/features/standings/components/StandingsClinchLegend';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';

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
    errorStandingsData,
    refetchStandings,
  } = useStandingsData();

  const [view, setView] = useState<StandingsView>('conference');
  const [conference, setConference] = useState<Conference>('Eastern');
  const { season } = useSeason();

  if (loadingStandingsData) {
    return <LoadingState label="Loading standings" />;
  }

  if (errorStandingsData) {
    return (
      <ErrorState
        title="Couldn't load standings"
        message={errorStandingsData}
        onRetry={refetchStandings}
      />
    );
  }

  const hasStandings =
    easternStandingsData.length > 0 ||
    westernStandingsData.length > 0 ||
    metropolitanStandings.length > 0 ||
    atlanticStandings.length > 0 ||
    centralStandings.length > 0 ||
    pacificStandings.length > 0;

  if (!hasStandings) {
    return (
      <EmptyState
        title="No standings"
        message={`No standings available for ${formatSeasonLabel(season)}.`}
      />
    );
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
    <Container fluid className={styles['landing-standings']}>
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
