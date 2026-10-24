import React, { useCallback, useRef } from 'react';

import { useVisibleLines } from '@/features/teams/hooks/useVisibleLines';
import RinkStrip from '@/features/teams/components/RinkStrip';
import {
  DisplayLine,
  formatLineCaption,
  TeamLinesView,
} from '@/features/teams/utils/teamLinesHelper';
import styles from '@/features/teams/components/RosterLines.module.css';

interface LineCarouselProps {
  lines: DisplayLine[];
  view: Pick<TeamLinesView, 'source' | 'game'>;
  ariaLabel: string;
  /** Grid columns on desktop: from 992px and from 1200px. */
  columns: { lg: number; xl: number };
}

/** Whether the user asked the OS to reduce motion, so scrolling should not animate. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Horizontal CSS scroll-snap carousel of rink strips with a pager ("L1 L2 ...")
 * that tracks the strip in view (IntersectionObserver) and scrolls to a strip
 * on click.
 */
export default function LineCarousel({
  lines,
  view,
  ariaLabel,
  columns,
}: LineCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { activeIndex, seen } = useVisibleLines(
    scrollerRef,
    itemRefs,
    lines.length,
  );

  const scrollTo = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const item = itemRefs.current[index];
    if (!scroller || !item) return;
    scroller.scrollTo({
      left: item.offsetLeft,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  if (lines.length === 0) {
    return <p className={styles.empty}>No lines available yet.</p>;
  }

  return (
    <div>
      <div
        className={styles.pager}
        role="group"
        aria-label={`${ariaLabel} pager`}
      >
        {lines.map((line, index) => (
          <button
            key={line.key}
            type="button"
            className={`${styles.pager__btn} ${activeIndex === index ? styles['pager__btn--active'] : ''}`}
            aria-label={`${line.pagerLabel}, ${line.label}`}
            aria-current={activeIndex === index ? 'true' : undefined}
            onClick={() => scrollTo(index)}
          >
            {line.pagerLabel}
          </button>
        ))}
      </div>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        style={
          {
            '--cols-lg': columns.lg,
            '--cols-xl': columns.xl,
          } as React.CSSProperties
        }
        role="region"
        aria-label={ariaLabel}
      >
        {lines.map((line, index) => (
          <div
            key={line.key}
            ref={(item) => {
              itemRefs.current[index] = item;
            }}
            className={styles.scroller__item}
          >
            <RinkStrip
              line={line}
              caption={formatLineCaption(line, view)}
              live={seen.has(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
