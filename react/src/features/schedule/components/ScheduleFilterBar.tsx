import SlidingToggle from '@/components/SlidingToggle';
import { ScheduleFilter } from '@/features/schedule/utils/scheduleFilterHelper';
import {
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from '@/features/schedule/utils/scheduleViewHelper';
import styles from '@/features/schedule/components/SchedulePage.module.css';

interface ScheduleFilterBarProps {
  filter: ScheduleFilter;
  teamOptions: string[];
  onTeamChange: (team: string) => void;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
}

/** Team dropdown plus status (upcoming/final) and game-type toggles. */
export default function ScheduleFilterBar({
  filter,
  teamOptions,
  onTeamChange,
  onStatusChange,
  onTypeChange,
}: ScheduleFilterBarProps) {
  return (
    <div className={styles['schedule-filter-bar']}>
      <label className={styles['schedule-filter-field']}>
        <span className={styles['schedule-filter-field__label']}>Team</span>
        <select
          className={styles['schedule-filter-field__select']}
          value={filter.team ?? ''}
          onChange={(event) => onTeamChange(event.target.value)}
          aria-label="Filter by team"
        >
          <option value="">All</option>
          {teamOptions.map((triCode) => (
            <option key={triCode} value={triCode}>
              {triCode}
            </option>
          ))}
        </select>
      </label>
      <SlidingToggle
        options={STATUS_OPTIONS}
        value={filter.status ?? ''}
        onChange={onStatusChange}
      />
      <SlidingToggle
        options={TYPE_OPTIONS}
        value={filter.gameType ?? ''}
        onChange={onTypeChange}
      />
    </div>
  );
}
