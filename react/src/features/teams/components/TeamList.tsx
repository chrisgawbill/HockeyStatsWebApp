import { useEffect, useMemo, useState } from 'react';
import styles from '@/features/teams/components/TeamList.module.css';
import PageHeader from '@/components/PageHeader';
import TeamListCard from '@/features/teams/components/TeamListCard';
import { useListOfTeamsData } from '@/features/teams/hooks/ListOfTeamsContext';
import { useStandingsData } from '@/features/standings/hooks/StandingsContext';
import {
  TeamFilter,
  TeamSort,
  buildStandingsLookup,
  buildTeamCards,
} from '@/features/teams/utils/teamListHelper';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { useLeague } from '@/lib/LeagueContext';

/**
 * Team list route (`/teamList`): every club as a card with its record and key
 * stats, searchable and filterable by conference, division, and playoff or
 * lottery position, with sorting. Waits for both the team list and standings.
 */
export default function TeamList() {
  const {
    listOfTeamsData,
    loadingListOfTeamsData,
    errorListOfTeamsData,
    refetchListOfTeams,
  } = useListOfTeamsData();
  const {
    easternStandingsData,
    westernStandingsData,
    loadingStandingsData,
    errorStandingsData,
    refetchStandings,
  } = useStandingsData();
  const [search, setSearch] = useState('');
  const [conference, setConference] = useState('All');
  const [division, setDivision] = useState('All');
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [sortBy, setSortBy] = useState<TeamSort>('name');
  const { league } = useLeague();
  // Playoff seeds and lottery odds follow NHL rules.
  const hasPlayoffAndLottery = league === 'nhl';

  const resetFilters = () => {
    setSearch('');
    setConference('All');
    setDivision('All');
    setFilter('all');
    setSortBy('name');
  };

  // Division names, playoff and lottery filters differ by league.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resetFilters, [league]);

  const standingsByKey = useMemo(
    () =>
      buildStandingsLookup([...easternStandingsData, ...westernStandingsData]),
    [easternStandingsData, westernStandingsData],
  );

  const teams = useMemo(
    () =>
      buildTeamCards(
        listOfTeamsData,
        standingsByKey,
        {
          search,
          conference,
          division,
          filter,
          sortBy,
        },
        league,
      ),
    [
      league,
      conference,
      division,
      filter,
      listOfTeamsData,
      search,
      sortBy,
      standingsByKey,
    ],
  );

  if (errorListOfTeamsData) {
    return (
      <ErrorState
        fullPage
        title="Couldn't load teams"
        message={errorListOfTeamsData}
        onRetry={refetchListOfTeams}
      />
    );
  }

  if (errorStandingsData) {
    return (
      <ErrorState
        fullPage
        title="Couldn't load standings"
        message={errorStandingsData}
        onRetry={refetchStandings}
      />
    );
  }

  if (loadingListOfTeamsData || loadingStandingsData) {
    return <LoadingState label="Loading teams" fullPage />;
  }

  return (
    <div className="ds-page-shell">
      <PageHeader />
      <main className={`${styles['team-list-page']} ds-container`}>
        <section className={styles['team-list-toolbar']}>
          <div className={styles['team-list-toolbar__header']}>
            <h1>Team List</h1>
            <p>{teams.length} teams</p>
          </div>
          <div className={styles['team-list-controls']}>
            <label className={styles['team-list-search']}>
              <span>Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Team or abbreviation"
              />
            </label>
            <label>
              <span>Conference</span>
              <select
                value={conference}
                onChange={(event) => setConference(event.target.value)}
              >
                <option>All</option>
                <option>Eastern</option>
                <option>Western</option>
              </select>
            </label>
            <label>
              <span>Division</span>
              <select
                value={division}
                onChange={(event) => setDivision(event.target.value)}
              >
                <option>All</option>
                <option>Atlantic</option>
                <option>{league === 'ahl' ? 'North' : 'Metropolitan'}</option>
                <option>Central</option>
                <option>Pacific</option>
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as TeamSort)}
              >
                <option value="name">Name</option>
                <option value="points">Points</option>
                <option value="winPct">Win %</option>
                <option value="goals">Goals / GP</option>
                {hasPlayoffAndLottery && (
                  <option value="draftOdds">Draft Odds</option>
                )}
              </select>
            </label>
          </div>
          <div
            className={styles['team-list-filter-chips']}
            aria-label="Team filters"
          >
            {(hasPlayoffAndLottery
              ? [
                  ['all', 'All Teams'],
                  ['playoff', 'Playoff'],
                  ['lottery', 'Lottery'],
                ]
              : [['all', 'All Teams']]
            ).map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? styles['active'] : ''}
                onClick={() => setFilter(value as TeamFilter)}
              >
                {label}
              </button>
            ))}
            <button
              className={styles['team-list-reset-btn']}
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </section>
        <div className={styles['team-card-grid']}>
          {teams.map((card) => (
            <TeamListCard
              key={card.team.teamName}
              card={card}
              filter={filter}
            />
          ))}
        </div>
        {teams.length === 0 && (
          <p className={styles['team-list-empty']}>
            No teams match the current filters.
          </p>
        )}
      </main>
    </div>
  );
}
