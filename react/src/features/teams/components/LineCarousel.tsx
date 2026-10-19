import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  /** Columns when shown as a grid on desktop (>= 992px). */
  columns: number;
}

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Strips that have entered view at least once: they play the slide-in once
  // and then stay visible for good.
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || lines.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      setActiveIndex(0);
      setSeen(new Set(lines.map((_, i) => i)));
      return;
    }
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let best = -1;
        let bestRatio = 0;
        const entered: number[] = [];
        itemRefs.current.forEach((el, i) => {
          const ratio = el ? (ratios.get(el) ?? 0) : 0;
          // Strict > keeps the lowest index on ties.
          if (ratio > bestRatio) {
            best = i;
            bestRatio = ratio;
          }
          if (ratio >= 0.2) entered.push(i);
        });
        if (best !== -1) setActiveIndex(best);
        if (entered.length > 0) {
          setSeen((prev) =>
            entered.every((i) => prev.has(i))
              ? prev
              : new Set([...prev, ...entered]),
          );
        }
      },
      { root: scroller, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [lines.length]);

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
        {lines.map((line, i) => (
          <button
            key={line.key}
            type="button"
            className={`${styles.pager__btn} ${activeIndex === i ? styles['pager__btn--active'] : ''}`}
            aria-label={line.label}
            aria-current={activeIndex === i ? 'true' : undefined}
            onClick={() => scrollTo(i)}
          >
            {line.pagerLabel}
          </button>
        ))}
      </div>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        style={{ '--cols': columns } as React.CSSProperties}
        role="region"
        aria-label={ariaLabel}
      >
        {lines.map((line, i) => (
          <div
            key={line.key}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={styles.scroller__item}
          >
            <RinkStrip
              line={line}
              caption={formatLineCaption(line, view)}
              live={seen.has(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
