import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import shared from '@/styles/shared.module.css';
import {
  CLINCH_STATUS_META,
  ClinchStatus,
} from '@/features/standings/utils/clinchStatus';

type SortKey = 'PLACE' | 'TEAM' | 'RECORD' | 'POINTS' | 'POINTSPERCENTAGE';

interface Props {
  standingsData: StandingsTeam[];
  standingFormat: string;
  fill?: boolean;
}

export default function LandingPageStandingsTable({
  standingsData,
  standingFormat,
  fill = false,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDivision = standingFormat === 'Division';
  const [isMobile, setIsMobile] = React.useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches,
  );
  const [sort, setSort] = React.useState<{
    key: SortKey;
    direction: 'ascending' | 'descending';
  } | null>(null);
  const standingsSourcePath = location.pathname === '/' ? '/' : '/standings';

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const handleChange = () => setIsMobile(query.matches);
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const goToTeam = (team: StandingsTeam) =>
    navigate(`/team/${team.id}`, {
      state: {
        sourcePath: standingsSourcePath,
        fallbackPath: standingsSourcePath,
      },
    });

  const getClinchStatus = (item: StandingsTeam): ClinchStatus | null => {
    const indicator = item.clinchingIndicator?.toString().trim().toLowerCase();
    if (indicator === 'p') return 'presidents';
    if (indicator === 'z') return 'conference';
    if (indicator === 'y') return 'division';
    if (
      indicator === 'w' ||
      (indicator === 'x' && item.wildCardRank > 0 && item.wildCardRank <= 2)
    )
      return 'wildcard';
    if (indicator === 'x') return 'playoffs';
    return null;
  };

  const renderClinchBadge = (status: ClinchStatus | null) => {
    if (!status) return null;
    const meta = CLINCH_STATUS_META[status];
    return (
      <span
        className={`${shared.chip} ${styles['standings-clinch-badge']} ${meta.className}`}
        aria-label={meta.label}
        title={meta.label}
      >
        {meta.badge}
      </span>
    );
  };

  const sortedStandings = [...standingsData].sort((a, b) => {
    if (!sort) return 0;
    let result = 0;
    switch (sort.key) {
      case 'PLACE':
        result =
          (isDivision ? a.divisionStandingsPlace : a.conferenceStandingsPlace) -
          (isDivision ? b.divisionStandingsPlace : b.conferenceStandingsPlace);
        break;
      case 'TEAM':
        result = a.teamName.localeCompare(b.teamName);
        break;
      case 'RECORD':
        result = a.wins - b.wins;
        break;
      case 'POINTS':
        result = a.points - b.points;
        break;
      case 'POINTSPERCENTAGE':
        result = a.pointsPercentage - b.pointsPercentage;
        break;
    }
    return sort.direction === 'ascending' ? result : -result;
  });

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? {
            key,
            direction:
              current.direction === 'ascending' ? 'descending' : 'ascending',
          }
        : { key, direction: 'ascending' },
    );
  const headers: [string, SortKey][] = [
    ['#', 'PLACE'],
    ['Team', 'TEAM'],
    ['Record', 'RECORD'],
    ['Pts', 'POINTS'],
  ];
  if (!isMobile) headers.push(['P%', 'POINTSPERCENTAGE']);

  return (
    <div
      className={[
        styles['standings-table-shell'],
        'ds-table-wrap',
        fill ? styles['standings-table-shell--fill'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        fill
          ? undefined
          : {
              height: isDivision ? '20rem' : '38.75rem',
              marginTop: '1%',
              marginBottom: '2%',
            }
      }
    >
      <table className={`${styles['standings-table']} ds-table`}>
        <thead>
          <tr>
            {headers.map(([label, key]) => (
              <th
                key={key}
                scope="col"
                aria-sort={sort?.key === key ? sort.direction : 'none'}
              >
                <button
                  type="button"
                  className="ds-table-sort-button"
                  aria-label={`Sort by ${label}`}
                  onClick={() => toggleSort(key)}
                >
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map((team) => {
            const status = getClinchStatus(team);
            const statusClass = status
              ? CLINCH_STATUS_META[status].className
              : '';
            return (
              <tr
                key={team.id}
                tabIndex={0}
                role="button"
                aria-label={`View ${team.teamName}`}
                onClick={() => goToTeam(team)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToTeam(team);
                  }
                }}
              >
                <td
                  className={`${styles['standings-status-cell']} ${styles['standings-status-cell--first']} ${statusClass}`}
                >
                  {isDivision
                    ? team.divisionStandingsPlace
                    : team.conferenceStandingsPlace}
                </td>
                <td
                  className={`${styles['standings-status-cell']} ${statusClass}`}
                >
                  <span className={styles['standings-table-teamName-col']}>
                    <img
                      className={styles['standings-table-team-logo']}
                      src={team.teamLogo}
                      alt={`${team.teamName} logo`}
                    />
                    <p>{team.teamName}</p>
                    <span
                      className={styles['standings-team-abbrev']}
                      aria-hidden="true"
                    >
                      {team.id}
                    </span>
                    {renderClinchBadge(status)}
                  </span>
                </td>
                <td
                  className={`${styles['standings-status-cell']} ${statusClass}`}
                >{`${team.wins}-${team.losses}-${team.otLosses}`}</td>
                <td
                  className={`${styles['standings-status-cell']} ${statusClass}`}
                >
                  {team.points}
                </td>
                {!isMobile && (
                  <td
                    className={`${styles['standings-status-cell']} ${statusClass}`}
                  >
                    {team.pointsPercentage}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
