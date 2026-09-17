import type { CSSProperties } from 'react';
import styles from '@/components/SlidingToggle.module.css';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: [...Option<T>[]];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Generic segmented control: a row of options with a sliding indicator behind the
 * active one. Generic over the value type so callers get type-safe `value`/
 * `onChange`. Shared by the schedule view toggle and the standings view toggles.
 * Layout, indicator motion, and states come from aero-md3-core's `.ds-segmented`.
 */
export default function SlidingToggle<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segmentStyle = {
    '--ds-segment-count': options.length,
    '--ds-segment-index': activeIndex,
  } as CSSProperties;

  return (
    <div className={styles['sliding-toggle']} role="group" style={segmentStyle}>
      <div className="ds-segmented-indicator" />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          className={styles['sliding-toggle__btn']}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
