import { useState } from 'react';
import StandingsContainer from '@/features/standings/components/StandingsContainer';
import SlidingToggle from '@/components/SlidingToggle';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import {
  Conference,
  StandingsView,
  getStandingsSections,
} from '@/features/standings/utils/standingsViewHelper';
import StandingsClinchLegend from '@/features/standings/components/StandingsClinchLegend';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';

/** Home-page standings card with conference/division and Eastern/Western toggles. */
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

  const standingsSections = getStandingsSections(
    {
      easternStandingsData,
      westernStandingsData,
      metropolitanStandings,
      atlanticStandings,
      centralStandings,
      pacificStandings,
    },
    view,
    conference,
  );

  return (
    <section className={`${styles['landing-standings']} ds-stack`}>
      <div className={styles['landing-standings-mobile-title']}>
        <div className={styles['landing-header']}>
          <h2>Standings</h2>
        </div>
      </div>
      <div>
        <SlidingToggle
          options={[
            { label: 'Conference', value: 'conference' as StandingsView },
            { label: 'Division', value: 'division' as StandingsView },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <div>
        <SlidingToggle
          options={[
            { label: 'Eastern', value: 'Eastern' as Conference },
            { label: 'Western', value: 'Western' as Conference },
          ]}
          value={conference}
          onChange={setConference}
        />
      </div>
      <StandingsClinchLegend />
      {standingsSections.map((section) => (
        <div key={section.name} className={styles['landing-standings__entry']}>
          <StandingsContainer
            standingsName={section.name}
            standingsData={section.teams}
            standingFormat={section.format}
            fill
          />
        </div>
      ))}
    </section>
  );
}
