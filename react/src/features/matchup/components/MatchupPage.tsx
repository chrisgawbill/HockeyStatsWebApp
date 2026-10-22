import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import FormStrip from '@/components/FormStrip';
import { localTeamList } from '@/lib/teamListData';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { getTeamResults, lastN } from '@/lib/teamForm';
import { getSeasonSeries } from '@/features/matchup/utils/seasonSeriesHelper';
import { findMatchupGame } from '@/features/matchup/utils/matchupGameContext';
import MatchupIntro from '@/features/matchup/components/MatchupIntro';
import MatchupTeamDna from '@/features/matchup/components/MatchupTeamDna';
import MeetingCard from '@/features/matchup/components/MeetingCard';
import TeamSelect from '@/features/matchup/components/TeamSelect';
import shared from '@/styles/shared.module.css';
import styles from './MatchupPage.module.css';

const teams = localTeamList;

/** Full club name for a tri-code, falling back to the code itself. */
const getTeamName = (triCode: string) =>
  teams.find((team) => team.triCode === triCode)?.fullName ?? triCode;

/** Name of the page the user came from, shown on the breadcrumb back link. */
function getSourceLabel(sourcePath: string): string {
  if (sourcePath.startsWith('/game/')) return 'Game';
  if (sourcePath.startsWith('/team/')) return 'Team';
  if (sourcePath.startsWith('/standings')) return 'Standings';
  if (sourcePath === '/') return 'Home';
  return 'Schedule';
}

/**
 * Head-to-head route (`/matchup?teamA=&teamB=[&game=]`): the two chosen teams'
 * season series, a Team DNA card for each, recent form, and their played and
 * upcoming meetings. With `game=` naming one of their games it doubles as that
 * game's preview. Reads the already-loaded season games and league team list;
 * nothing is fetched or polled here.
 */
export default function MatchupPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { listOfGamesData, loadingListOfGamesData } = useListOfGames();
  const teamA = params.get('teamA')?.toUpperCase() || teams[0].triCode;
  const teamB = params.get('teamB')?.toUpperCase() || teams[1].triCode;
  const gameIdParam = params.get('game');
  const routeState = location.state as { sourcePath?: string } | null;
  const sourcePath = routeState?.sourcePath ?? '/schedule';
  const sourceLabel = getSourceLabel(sourcePath);
  const series = useMemo(
    () => getSeasonSeries(listOfGamesData, teamA, teamB),
    [listOfGamesData, teamA, teamB],
  );
  const previewGame = useMemo(
    () => findMatchupGame(listOfGamesData, gameIdParam, teamA, teamB),
    [listOfGamesData, gameIdParam, teamA, teamB],
  );
  /** Picks a team; the previewed game no longer applies, so `game=` goes. */
  const setTeam = (key: 'teamA' | 'teamB', triCode: string) =>
    setParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous);
        nextParams.set(key, triCode);
        nextParams.delete('game');
        return nextParams;
      },
      { state: location.state },
    );
  return (
    <div className={`${styles.page} ${shared.pageShell} ds-page-shell`}>
      <PageHeader />
      <main className={styles.content}>
        <section className={`${shared.surfaceElevated} ${styles.hero}`}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to={sourcePath} className={styles.breadcrumbBack}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {sourceLabel}
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Matchup</span>
          </nav>
          <MatchupIntro previewGame={previewGame} />
          <div className={`${shared.surface} ${styles.controls}`}>
            <TeamSelect
              label="Team A"
              value={teamA}
              onChange={(triCode) => setTeam('teamA', triCode)}
            />
            <TeamSelect
              label="Team B"
              value={teamB}
              onChange={(triCode) => setTeam('teamB', triCode)}
            />
          </div>
        </section>
        {loadingListOfGamesData ? (
          <LoadingState label="Loading season series" fullPage />
        ) : teamA === teamB ? (
          <EmptyState
            title="Choose two different teams"
            message="A matchup needs two different teams."
          />
        ) : (
          <>
            <section
              className={`${shared.surface} ${styles.summary}`}
              aria-labelledby="series-summary"
            >
              <h2 id="series-summary">
                {getTeamName(teamA)} vs {getTeamName(teamB)}
              </h2>
              <div className={styles.record}>
                <span>
                  {teamA} {series.summary.teamAwins}
                </span>
                <span>
                  {teamB} {series.summary.teamBwins}
                </span>
                {series.summary.ties > 0 && (
                  <span>Ties {series.summary.ties}</span>
                )}
              </div>
              <div className={styles.goals}>
                Goals: {series.summary.teamAGoals} – {series.summary.teamBGoals}
              </div>
            </section>
            <MatchupTeamDna teamA={teamA} teamB={teamB} />
            <div className={styles.formGrid}>
              <section className={`${shared.surface} ${styles.formCard}`}>
                <h2 className={styles.formTitle}>{teamA} Form</h2>
                <FormStrip
                  results={lastN(getTeamResults(listOfGamesData, teamA), 10)}
                  className={styles.formStrip}
                />
              </section>
              <section className={`${shared.surface} ${styles.formCard}`}>
                <h2 className={styles.formTitle}>{teamB} Form</h2>
                <FormStrip
                  results={lastN(getTeamResults(listOfGamesData, teamB), 10)}
                  className={styles.formStrip}
                />
              </section>
            </div>
            <h2 className={styles.sectionTitle}>
              Played ({series.played.length})
            </h2>
            {series.played.length ? (
              series.played.map((game) => (
                <MeetingCard
                  key={game.gameId}
                  game={game}
                  teamA={teamA}
                  teamB={teamB}
                  isPlayed
                />
              ))
            ) : (
              <EmptyState
                title="No Meetings Played"
                message="These teams have not met in this season yet."
              />
            )}
            <h2 className={styles.sectionTitle}>
              Upcoming ({series.upcoming.length})
            </h2>
            {series.upcoming.length ? (
              series.upcoming.map((game) => (
                <MeetingCard
                  key={game.gameId}
                  game={game}
                  teamA={teamA}
                  teamB={teamB}
                  isPlayed={false}
                />
              ))
            ) : (
              <EmptyState
                title="No Upcoming Games"
                message="There are no remaining scheduled games in this series."
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
