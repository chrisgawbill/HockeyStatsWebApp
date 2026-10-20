import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import {
  getRecentSeasonIds,
  formatSeasonLabel,
} from '@/features/season/utils/seasonHelper';
import styles from '@/components/SeasonSelector.module.css';

/** Down chevron for the season dropdown button. */
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
  const optionId = (optionIndex: number) =>
    `${listboxId}-option-${optionIndex}`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        openAt(Math.max(0, seasons.indexOf(season)));
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((currentIndex) =>
          Math.min(seasons.length - 1, currentIndex + 1),
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((currentIndex) => Math.max(0, currentIndex - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(seasons.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectSeason(seasons[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
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
            onClick={() =>
              open ? setOpen(false) : openAt(seasons.indexOf(season))
            }
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
            {seasons.map((seasonId, optionIndex) => (
              <li
                key={seasonId}
                id={optionId(optionIndex)}
                role="option"
                aria-selected={seasonId === season}
                ref={(optionElement) => {
                  optionRefs.current[optionIndex] = optionElement;
                }}
                className={`${styles['season-field__option']} ${
                  optionIndex === activeIndex
                    ? styles['season-field__option--active']
                    : ''
                } ${seasonId === season ? styles['season-field__option--selected'] : ''}`}
                onMouseEnter={() => setActiveIndex(optionIndex)}
                onClick={() => selectSeason(seasonId)}
              >
                {formatSeasonLabel(seasonId)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
