import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import styles from '@/features/standings/components/LandingPageStandings.module.css';
import { joinClassNames } from '@/lib/joinClassNames';
import shared from '@/styles/shared.module.css';
import {
  CLINCH_STATUS_META,
  ClinchStatus,
  getClinchStatus,
} from '@/features/standings/utils/clinchStatus';

type SortKey = 'PLACE' | 'TEAM' | 'RECORD' | 'POINTS' | 'POINTSPERCENTAGE';
type SortState = { key: SortKey; direction: 'ascending' | 'descending' };

const HEADERS: [string, SortKey][] = [
  ['#', 'PLACE'],
  ['Team', 'TEAM'],
  ['Record', 'RECORD'],
  ['Pts', 'POINTS'],
  ['P%', 'POINTSPERCENTAGE'],
];

interface Props {
  standingsData: StandingsTeam[];
  standingFormat: string;
  fill?: boolean;
}

/** Small letter badge marking a clinched playoff status next to a team name. */
function ClinchBadge({ status }: { status: ClinchStatus | null }) {
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
}

/** Returns a copy of the standings ordered by the active column, or unchanged when no sort is set. */
function sortStandings(
  standings: StandingsTeam[],
  sort: SortState | null,
  isDivision: boolean,
): StandingsTeam[] {
  return [...standings].sort((first, second) => {
    if (!sort) return 0;
    let comparison = 0;
    switch (sort.key) {
      case 'PLACE':
        comparison =
          (isDivision
            ? first.divisionStandingsPlace
            : first.conferenceStandingsPlace) -
          (isDivision
            ? second.divisionStandingsPlace
            : second.conferenceStandingsPlace);
        break;
      case 'TEAM':
        comparison = first.teamName.localeCompare(second.teamName);
        break;
      case 'RECORD':
        comparison = first.wins - second.wins;
        break;
      case 'POINTS':
        comparison = first.points - second.points;
        break;
      case 'POINTSPERCENTAGE':
        comparison = first.pointsPercentage - second.pointsPercentage;
        break;
    }
    return sort.direction === 'ascending' ? comparison : -comparison;
  });
}

/**
 * Sortable standings table for one conference or division. Clicking a column
 * header sorts by it (click again to reverse); clicking a row opens the team
 * page, returning to the home page or standings page afterwards.
 */
export default function LandingPageStandingsTable({
  standingsData,
  standingFormat,
  fill = false,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDivision = standingFormat === 'Division';
  const [sort, setSort] = React.useState<SortState | null>(null);
  const standingsSourcePath = location.pathname === '/' ? '/' : '/standings';

  const goToTeam = (team: StandingsTeam) =>
    navigate(`/team/${team.id}`, {
      state: {
        sourcePath: standingsSourcePath,
        fallbackPath: standingsSourcePath,
      },
    });

  const sortedStandings = sortStandings(standingsData, sort, isDivision);

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

  return (
    <div
      className={joinClassNames(
        styles['standings-table-shell'],
        'ds-table-wrap',
        fill && styles['standings-table-shell--fill'],
      )}
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
            {HEADERS.map(([label, key]) => (
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
                    <ClinchBadge status={status} />
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
                <td
                  className={`${styles['standings-status-cell']} ${statusClass}`}
                >
                  {team.pointsPercentage}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
