import { useMemo, useState } from 'react';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameShots.module.css';
import ShotMapFilters from '@/features/game-detail/components/ShotMapFilters';
import ShotRink from '@/features/game-detail/components/ShotRink';
import ShotSummaryTable from '@/features/game-detail/components/ShotSummaryTable';
import { ShotEvent } from '@/features/game-detail/types/playByPlay';
import {
  ALL_SHOTS,
  GamePeriod,
  ShotFilters,
  TeamShotCounts,
  countTeamShots,
  countUnlocatedShots,
  describeEmptyShotResult,
  filterShotEvents,
  isMappedShot,
  listShootersByTeam,
  summarizeShotsByPeriod,
} from '@/features/game-detail/utils/shotMapHelper';

interface ShotMapProps {
  events: ShotEvent[];
  periods: GamePeriod[];
  homeTriCode: string;
  awayTriCode: string;
}

/** One team's goals, shots on goal and misses for the filtered shots, beside its color. */
function TeamTally({
  triCode,
  counts,
  colorClass,
}: {
  triCode: string;
  counts: TeamShotCounts;
  colorClass: string;
}) {
  return (
    <span className={styles['tally-team']} data-testid={`tally-${triCode}`}>
      <span
        className={`${styles['team-dot']} ${colorClass}`}
        aria-hidden="true"
      />
      {triCode} <strong>{counts.goals}</strong> G ·{' '}
      <strong>{counts.shotsOnGoal}</strong> SOG · {counts.missed} missed
    </span>
  );
}

/** The marker legend: goal, shot on goal, missed. */
function ShotLegend() {
  return (
    <ul className={styles.legend} aria-hidden="true">
      <li>
        <svg width="14" height="14">
          <circle className={styles['legend-mark']} cx="7" cy="7" r="5.5" />
        </svg>
        Goal
      </li>
      <li>
        <svg width="14" height="14">
          <circle
            className={`${styles['legend-mark']} ${styles['legend-mark--ring']}`}
            cx="7"
            cy="7"
            r="4.5"
            strokeWidth="2"
          />
        </svg>
        Shot on goal
      </li>
      <li>
        <svg width="14" height="14">
          <path
            className={styles['legend-mark']}
            d="M4 4L10 10M4 10L10 4"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Missed
      </li>
    </ul>
  );
}

/**
 * Shot map: where each team shot from on one full rink, filtered by period,
 * strength and player. Blocked shots are counted but not drawn (their spot is
 * where the block happened), and shots with no recorded location are counted
 * and noted. The totals line and the summary table follow the filters.
 */
function ShotMap({ events, periods, homeTriCode, awayTriCode }: ShotMapProps) {
  const [filters, setFilters] = useState<ShotFilters>(ALL_SHOTS);
  const shootersByTeam = useMemo(
    () => listShootersByTeam(events, awayTriCode, homeTriCode),
    [events, awayTriCode, homeTriCode],
  );
  const filteredEvents = useMemo(
    () => filterShotEvents(events, filters),
    [events, filters],
  );
  const mappedShots = filteredEvents.filter(isMappedShot);
  const unlocatedShotCount = countUnlocatedShots(filteredEvents);
  const totals = {
    away: countTeamShots(filteredEvents, awayTriCode),
    home: countTeamShots(filteredEvents, homeTriCode),
  };
  const selectedShooterName =
    shootersByTeam
      .flatMap((team) => team.shooters)
      .find((shooter) => shooter.shooterId === filters.shooterId)
      ?.shooterName ?? null;
  const isFiltered =
    filters.period !== 'all' ||
    filters.strength !== 'all' ||
    filters.shooterId !== 'all';

  const rinkMessage =
    events.length === 0 ? (
      <p>No shots yet. The shot map fills in as the game goes.</p>
    ) : mappedShots.length === 0 ? (
      <>
        <p>{describeEmptyShotResult(filters, selectedShooterName)}</p>
        {isFiltered && (
          <button
            type="button"
            className={styles['reset-button']}
            onClick={() => setFilters(ALL_SHOTS)}
          >
            Reset filters
          </button>
        )}
      </>
    ) : undefined;

  return (
    <section
      className={`${shared.section} ${shared.surface} ${styles['shot-card']}`}
      aria-labelledby="shot-map-heading"
    >
      <h2 id="shot-map-heading" className={shared.sectionTitle}>
        Shot map
      </h2>
      <p className={styles['shot-card__subtitle']}>
        Where each team shot from. Blocked shots are not drawn (their spot is
        where the block happened).
      </p>
      {events.length > 0 && (
        <ShotMapFilters
          filters={filters}
          periods={periods}
          shootersByTeam={shootersByTeam}
          onChange={setFilters}
        />
      )}
      <p className={styles.tally} aria-live="polite">
        <TeamTally
          triCode={awayTriCode}
          counts={totals.away}
          colorClass={styles['away-color']}
        />
        <TeamTally
          triCode={homeTriCode}
          counts={totals.home}
          colorClass={styles['home-color']}
        />
      </p>
      <ShotRink
        shots={mappedShots}
        homeTriCode={homeTriCode}
        awayTriCode={awayTriCode}
        message={rinkMessage}
      />
      <ShotLegend />
      {unlocatedShotCount > 0 && (
        <p className={styles.note}>
          {unlocatedShotCount === 1
            ? "1 shot has no recorded location, so it isn't on the map; it's counted in the totals and the game flow."
            : `${unlocatedShotCount} shots have no recorded location, so they aren't on the map; they're counted in the totals and the game flow.`}
        </p>
      )}
      <ShotSummaryTable
        rows={summarizeShotsByPeriod(
          filteredEvents,
          periods,
          awayTriCode,
          homeTriCode,
        )}
        totals={totals}
        awayTriCode={awayTriCode}
        homeTriCode={homeTriCode}
      />
    </section>
  );
}

export default ShotMap;
