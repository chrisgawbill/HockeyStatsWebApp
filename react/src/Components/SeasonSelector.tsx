import { useSeason } from '../Data/Context/SeasonContext';
import {
  getRecentSeasonIds,
  formatSeasonLabel,
} from '../Data/Helpers/seasonHelper';
import styles from '../Style/SeasonSelector.module.css';

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface SeasonSelectorProps {
  /** Number of recent seasons to offer by default. */
  count?: number;
  /** Optional class for host-page spacing overrides. */
  className?: string;
}

/**
 * Controlled `<select>` over the most recent `count` seasons, wired to the shared
 * SeasonContext. Used on the Landing, Schedule, Standings, and Team pages.
 * `className` lets a host page override the default standalone spacing.
 */
export default function SeasonSelector({
  count = 10,
  className,
}: SeasonSelectorProps) {
  const { season, setSeason } = useSeason();
  const recent = getRecentSeasonIds(count);
  /**
   * Keeps deep-linked seasons visible even when they fall outside the recent
   * default window, so the controlled select always has a matching option.
   */
  const seasons = recent.includes(season)
    ? recent
    : [...recent, season].sort((a, b) => Number(b) - Number(a));

  return (
    <div
      className={
        className
          ? `${styles['season-bar']} ${className}`
          : styles['season-bar']
      }
    >
      <label className={styles['season-field']}>
        <span className={styles['season-field__label']}>Season</span>
        <span className={styles['season-field__control']}>
          <select
            className={styles['season-field__select']}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Select season"
          >
            {seasons.map((id) => (
              <option key={id} value={id}>
                {formatSeasonLabel(id)}
              </option>
            ))}
          </select>
          <span className={styles['season-field__chevron']} aria-hidden="true">
            <ChevronIcon />
          </span>
        </span>
      </label>
    </div>
  );
}
