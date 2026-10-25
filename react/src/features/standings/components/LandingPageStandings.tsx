import { useState } from 'react';
import StandingsContainer from '@/features/standings/components/StandingsContainer';
import SlidingToggle from '@/components/SlidingToggle';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import {
  Conference,
  StandingsSection,
  StandingsView,
  getStandingsSections,
} from '@/features/standings/utils/standingsViewHelper';
import StandingsClinchLegend from '@/features/standings/components/StandingsClinchLegend';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import EmptyState from '@/components/EmptyState';
import SectionLoadState from '@/components/SectionLoadState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';

/** The phone-only "Standings" title (wider screens name each table instead). */
function StandingsMobileTitle() {
  return (
    <div className={styles['landing-standings-mobile-title']}>
      <div className={styles['landing-header']}>
        <h2>Standings</h2>
      </div>
    </div>
  );
}

interface StandingsTablesProps {
  standingsSections: StandingsSection[];
  view: StandingsView;
  onViewChange: (view: StandingsView) => void;
  conference: Conference;
  onConferenceChange: (conference: Conference) => void;
}

/** The two toggles, the clinch legend, and the selected standings tables. */
function StandingsTables({
  standingsSections,
  view,
  onViewChange,
  conference,
  onConferenceChange,
}: StandingsTablesProps) {
  return (
    <>
      <div>
        <SlidingToggle
          options={[
            { label: 'Conference', value: 'conference' as StandingsView },
            { label: 'Division', value: 'division' as StandingsView },
          ]}
          value={view}
          onChange={onViewChange}
        />
      </div>
      <div>
        <SlidingToggle
          options={[
            { label: 'Eastern', value: 'Eastern' as Conference },
            { label: 'Western', value: 'Western' as Conference },
          ]}
          value={conference}
          onChange={onConferenceChange}
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
    </>
  );
}

/**
 * Home-page standings card with conference/division and Eastern/Western
 * toggles. While loading or after a failure the title stays and the card's
 * space shows a spinner or the error with Try again.
 */
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

  const standingsData = {
    easternStandingsData,
    westernStandingsData,
    metropolitanStandings,
    atlanticStandings,
    centralStandings,
    pacificStandings,
  };
  const hasStandings = Object.values(standingsData).some(
    (teams) => teams.length > 0,
  );

  return (
    <section className={`${styles['landing-standings']} ds-stack`}>
      <StandingsMobileTitle />
      <SectionLoadState
        loading={loadingStandingsData}
        error={errorStandingsData}
        loadingLabel="Loading standings"
        onRetry={refetchStandings}
        className={styles['landing-standings__placeholder']}
      >
        {hasStandings ? (
          <StandingsTables
            standingsSections={getStandingsSections(
              standingsData,
              view,
              conference,
            )}
            view={view}
            onViewChange={setView}
            conference={conference}
            onConferenceChange={setConference}
          />
        ) : (
          <EmptyState
            title="No standings"
            message={`No standings available for ${formatSeasonLabel(season)}.`}
          />
        )}
      </SectionLoadState>
    </section>
  );
}
