import { useState } from 'react';
import styles from '@/features/standings/components/StandingsPage.module.css';
import StandingsContainer from '@/features/standings/components/StandingsContainer';
import SlidingToggle from '@/components/SlidingToggle';
import PageHeader from '@/components/PageHeader';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import StandingsClinchLegend from '@/features/standings/components/StandingsClinchLegend';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import PlayoffRacePanel from '@/features/standings/components/PlayoffRacePanel';

type Conference = 'Eastern' | 'Western';
type StandingsView = 'conference' | 'division';

interface StandingsEntry {
  name: string;
  data: StandingsTeam[];
  format: 'Conference' | 'Division';
}

/**
 * Standings route. Pulls the pre-split conference/division arrays from
 * StandingsContext and lets the user toggle between a conference view and a
 * division view, and between Eastern and Western. `?season=` drives the data.
 */
export default function StandingsPage() {
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
  const { listOfGamesData, loadingListOfGamesData } = useListOfGames();

  const hasStandings =
    easternStandingsData.length > 0 || westernStandingsData.length > 0;

  /**
   * Maps the active view/conference toggles to the table sections to render: one
   * combined conference table or two division tables.
   */
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
    <>
      <PageHeader />
      <main
        className={`${styles['standings-page']} ds-page-shell ds-container`}
      >
        <h1 className="visually-hidden">Standings</h1>
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
              {standingsLookup[view][conference].map((entry) => (
                <StandingsContainer
                  key={entry.name}
                  standingsName={entry.name}
                  standingsData={entry.data}
                  standingFormat={entry.format}
                />
              ))}
            </div>
            {loadingListOfGamesData ? (
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
