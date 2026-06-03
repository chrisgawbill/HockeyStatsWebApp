import React from 'react';
import styles from '../../../style/LandingPage/SlidingToggle.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

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
  const count = options.length;
  /**
   * One indicator segment is exactly one button wide; translating by whole
   * button widths keeps it aligned for any option count.
   */
  const indicatorStyle = {
    width: `calc((100% - 8px) / ${count})`,
    transform: `translateX(${activeIndex * 100}%)`,
  };

  return (
    <div className={styles['sliding-toggle']}>
      <div
        className={styles['sliding-toggle__indicator']}
        style={indicatorStyle}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cx(
            styles['sliding-toggle__btn'],
            value === opt.value && styles['sliding-toggle__btn--active'],
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
