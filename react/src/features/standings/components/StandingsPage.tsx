import { useState } from 'react';
import styles from '@/features/standings/components/StandingsPage.module.css';
import StandingsContainer from '@/features/standings/components/StandingsContainer';
import SlidingToggle from '@/components/SlidingToggle';
import PageHeader from '@/components/PageHeader';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import {
  Conference,
  StandingsView,
  getStandingsSections,
} from '@/features/standings/utils/standingsViewHelper';
import StandingsClinchLegend from '@/features/standings/components/StandingsClinchLegend';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import PlayoffRacePanel from '@/features/standings/components/PlayoffRacePanel';

/**
 * Standings route. Pulls the pre-split conference/division arrays from
 * StandingsContext and lets the user toggle between a conference view and a
 * division view, and between Eastern and Western. `?season=` drives the data.
 */
export default function StandingsPage() {
  const {
    easternStandingsData,
    westernStandingsData,
    metroOrNorthStandings,
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
  const { league } = useLeague();
  const { listOfGamesData, loadingListOfGamesData } = useListOfGames();

  const hasStandings =
    easternStandingsData.length > 0 || westernStandingsData.length > 0;

  const standingsSections = getStandingsSections(
    {
      easternStandingsData,
      westernStandingsData,
      metroOrNorthStandings,
      atlanticStandings,
      centralStandings,
      pacificStandings,
    },
    view,
    conference,
    league,
  );

  return (
    <>
      <PageHeader />
      <main
        className={`${styles['standings-page']} ds-page-shell ds-container`}
      >
        <h1 className="ds-visually-hidden">Standings</h1>
        {loadingStandingsData ? (
          <LoadingState label="Loading standings" fullPage />
        ) : errorStandingsData ? (
          <ErrorState
            fullPage
            title="Couldn't load standings"
            message={errorStandingsData}
            onRetry={refetchStandings}
          />
        ) : !hasStandings ? (
          <EmptyState
            fullPage
            title="No standings"
            message={`No standings available for ${formatSeasonLabel(season)}.`}
          />
        ) : (
          <>
            <div
              className={`${styles['standings-page-toggle-row']} mb-2 justify-content-center`}
            >
              <SlidingToggle
                options={[
                  { label: 'Conference', value: 'conference' as StandingsView },
                  { label: 'Division', value: 'division' as StandingsView },
                ]}
                value={view}
                onChange={setView}
              />
            </div>
            <div
              className={`${styles['standings-page-toggle-row']} mb-2 justify-content-center`}
            >
              <SlidingToggle
                options={[
                  { label: 'Eastern', value: 'Eastern' as Conference },
                  { label: 'Western', value: 'Western' as Conference },
                ]}
                value={conference}
                onChange={setConference}
              />
            </div>
            <div className={styles['standings-page-legend-row']}>
              <StandingsClinchLegend className={styles['standings-legend']} />
            </div>
            <div className={styles['standings-page-table-container']}>
              {standingsSections.map((section) => (
                <StandingsContainer
                  key={section.name}
                  standingsName={section.name}
                  standingsData={section.teams}
                  standingFormat={section.format}
                />
              ))}
            </div>
            {/* The race panel uses NHL wild-card rules. */}
            {league === 'ahl' ? null : loadingListOfGamesData ? (
              <p className={styles['playoff-race-loading']}>
                Loading playoff race…
              </p>
            ) : (
              <div>
                <div className={styles['playoff-race-grid']}>
                  <PlayoffRacePanel
                    conference="Eastern"
                    standings={easternStandingsData}
                    games={listOfGamesData}
                  />
                  <PlayoffRacePanel
                    conference="Western"
                    standings={westernStandingsData}
                    games={listOfGamesData}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
