import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import {
  getRecentSeasonIds,
  formatSeasonLabel,
} from '@/features/season/utils/seasonHelper';
import styles from '@/components/SeasonSelector.module.css';

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
 * Custom listbox button over the most recent `count` seasons, wired to the
 * shared SeasonContext. Used on the Landing, Schedule, Standings, and Team
 * pages. `className` lets a host page override the default standalone
 * spacing.
 *
 * A native `<select>`'s open dropdown is rendered by the OS/browser and
 * can't be themed — it broke the app's dark/Aero styling with a plain
 * white popup. This renders its own listbox panel instead (styled with the
 * shared elevated-surface tier) and follows the ARIA "listbox button"
 * pattern: focus stays on the trigger button the whole time, keyboard
 * navigation moves a visual `aria-activedescendant` highlight rather than
 * DOM focus.
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

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, seasons.indexOf(season)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-option-${i}`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  function openAt(index: number) {
    setActiveIndex(Math.max(0, Math.min(seasons.length - 1, index)));
    setOpen(true);
  }

  function selectSeason(id: string) {
    setSeason(id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        openAt(Math.max(0, seasons.indexOf(season)));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(seasons.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(seasons.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectSeason(seasons[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div
      className={
        className
          ? `${styles['season-bar']} ${className}`
          : styles['season-bar']
      }
      ref={containerRef}
    >
      <div className={styles['season-field']}>
        <span className={styles['season-field__label']}>Season</span>
        <span className={styles['season-field__control']}>
          <button
            type="button"
            ref={buttonRef}
            className={styles['season-field__button']}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={open ? optionId(activeIndex) : undefined}
            onClick={() => (open ? setOpen(false) : openAt(seasons.indexOf(season)))}
            onKeyDown={onButtonKeyDown}
          >
            {formatSeasonLabel(season)}
          </button>
          <span className={styles['season-field__chevron']} aria-hidden="true">
            <ChevronIcon />
          </span>
        </span>
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Select season"
            className={`${styles['season-field__listbox']} ds-aero-surface`}
          >
            {seasons.map((id, i) => (
              <li
                key={id}
                id={optionId(i)}
                role="option"
                aria-selected={id === season}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                className={`${styles['season-field__option']} ${
                  i === activeIndex ? styles['season-field__option--active'] : ''
                } ${id === season ? styles['season-field__option--selected'] : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectSeason(id)}
              >
                {formatSeasonLabel(id)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
