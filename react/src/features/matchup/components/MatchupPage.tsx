import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import FormStrip from '@/features/teams/components/FormStrip';
import { localTeamList } from '@/lib/teamListData';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { getTeamResults, lastN } from '@/features/teams/utils/teamFormHelper';
import { getSeasonSeries } from '@/features/matchup/utils/seasonSeriesHelper';
import shared from '@/styles/shared.module.css';
import styles from './MatchupPage.module.css';

const teams = localTeamList as { triCode: string; fullName: string }[];
const label = (code: string) =>
  teams.find((team) => team.triCode === code)?.fullName ?? code;

export default function MatchupPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { listOfGamesData, loadingListOfGamesData } = useListOfGames();
  const teamA = params.get('teamA')?.toUpperCase() || teams[0].triCode;
  const teamB = params.get('teamB')?.toUpperCase() || teams[1].triCode;
  const routeState = location.state as { sourcePath?: string } | null;
  const sourcePath = routeState?.sourcePath ?? '/schedule';
  const sourceLabel = sourcePath.startsWith('/game/')
    ? 'Game'
    : sourcePath.startsWith('/team/')
      ? 'Team'
      : sourcePath.startsWith('/standings')
        ? 'Standings'
        : sourcePath === '/'
          ? 'Home'
          : 'Schedule';
  const series = useMemo(
    () => getSeasonSeries(listOfGamesData, teamA, teamB),
    [listOfGamesData, teamA, teamB],
  );
  const setTeam = (key: 'teamA' | 'teamB', value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set(key, value);
      return next;
    });
  const renderMeeting = (game: (typeof series.played)[number]) => {
    const aScore = game.homeTeam === teamA ? game.homeScore : game.awayScore;
    const bScore = game.homeTeam === teamB ? game.homeScore : game.awayScore;
    const played = series.played.includes(game);
    return (
      <article
        className={`${shared.surface} ${styles.meeting}`}
        key={game.gameId}
      >
        <span className={styles.date}>{game.date.toLocaleDateString()}</span>
        <span>
          {game.awayTeam} at {game.homeTeam}
        </span>
        <span className={styles.score}>
          {played ? `${aScore} – ${bScore}` : 'Upcoming'}
        </span>
      </article>
    );
  };
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
          <header className={styles.intro}>
            <p className={styles.kicker}>Season series</p>
            <h1>Head-to-Head Matchup</h1>
            <p>Compare meetings, results, goals, and recent form.</p>
          </header>
          <div className={`${shared.surface} ${styles.controls}`}>
            <label className={styles.control}>
              Team A
              <select
                aria-label="Team A"
                value={teamA}
                onChange={(event) => setTeam('teamA', event.target.value)}
              >
                {teams.map((team) => (
                  <option key={team.triCode} value={team.triCode}>
                    {team.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.control}>
              Team B
              <select
                aria-label="Team B"
                value={teamB}
                onChange={(event) => setTeam('teamB', event.target.value)}
              >
                {teams.map((team) => (
                  <option key={team.triCode} value={team.triCode}>
                    {team.fullName}
                  </option>
                ))}
              </select>
            </label>
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
                {label(teamA)} vs {label(teamB)}
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
            <h2 className={styles.sectionTitle}>
              Played ({series.played.length})
            </h2>
            {series.played.length ? (
              series.played.map(renderMeeting)
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
              series.upcoming.map(renderMeeting)
            ) : (
              <EmptyState
                title="No Upcoming Games"
                message="There are no remaining scheduled games in this series."
              />
            )}
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
          </>
        )}
      </main>
    </div>
  );
}
