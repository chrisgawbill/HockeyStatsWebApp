import SlidingToggle from '@/components/SlidingToggle';
import styles from '@/features/game-detail/components/GameShots.module.css';
import { ShotStrength } from '@/features/game-detail/types/playByPlay';
import {
  GamePeriod,
  STRENGTH_LABELS,
  ShotFilters,
  TeamShooters,
} from '@/features/game-detail/utils/shotMapHelper';

interface ShotMapFiltersProps {
  filters: ShotFilters;
  periods: GamePeriod[];
  shootersByTeam: TeamShooters[];
  onChange: (filters: ShotFilters) => void;
}

const ALL = 'all';

/** Parses a select or toggle value back into a filter value ('all' or a number). */
function parseNumberFilter(value: string): number | 'all' {
  return value === ALL ? ALL : Number(value);
}

/**
 * Period, strength and player filters for the shot map. Period is a
 * segmented control (OT appears only when the game had overtime); strength
 * and player are selects, the player list grouped by team.
 */
function ShotMapFilters({
  filters,
  periods,
  shootersByTeam,
  onChange,
}: ShotMapFiltersProps) {
  const periodOptions = [
    { label: 'All', value: ALL },
    ...periods.map((period) => ({
      label: period.label,
      value: String(period.period),
    })),
  ];

  return (
    <div className={styles.filters}>
      <div className={styles['period-filter']}>
        <SlidingToggle
          label="Period"
          options={periodOptions}
          value={String(filters.period)}
          onChange={(value) =>
            onChange({ ...filters, period: parseNumberFilter(value) })
          }
        />
      </div>
      <label className={styles['filter-field']}>
        Strength
        <select
          className={styles['filter-select']}
          value={filters.strength}
          onChange={(event) =>
            onChange({
              ...filters,
              strength: event.target.value as ShotStrength | 'all',
            })
          }
        >
          <option value={ALL}>All strengths</option>
          {(Object.keys(STRENGTH_LABELS) as ShotStrength[]).map((strength) => (
            <option key={strength} value={strength}>
              {STRENGTH_LABELS[strength]}
            </option>
          ))}
        </select>
      </label>
      <label className={styles['filter-field']}>
        Player
        <select
          className={styles['filter-select']}
          value={String(filters.shooterId)}
          onChange={(event) =>
            onChange({
              ...filters,
              shooterId: parseNumberFilter(event.target.value),
            })
          }
        >
          <option value={ALL}>All players</option>
          {shootersByTeam.map(({ teamTriCode, shooters }) => (
            <optgroup key={teamTriCode} label={teamTriCode}>
              {shooters.map(({ shooterId, shooterName }) => (
                <option key={shooterId} value={shooterId}>
                  {shooterName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}

export default ShotMapFilters;
