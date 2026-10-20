import { RefObject, useEffect, useState } from 'react';

/** Share of a strip that must be visible before it counts as having entered view. */
const ENTERED_VIEW_RATIO = 0.2;

/**
 * Tracks which strip in a horizontal scroller is most in view, using an
 * IntersectionObserver rooted on the scroller. `activeIndex` is the strip
 * with the largest visible share (the lowest index wins ties). `seen` holds
 * the strips that have entered view at least once: they play their slide-in
 * once and then stay visible for good. Without IntersectionObserver support,
 * the first strip is active and every strip counts as seen.
 */
export function useVisibleLines(
  scrollerRef: RefObject<HTMLElement>,
  itemRefs: RefObject<(HTMLElement | null)[]>,
  lineCount: number,
) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || lineCount === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      setActiveIndex(0);
      setSeen(new Set(Array.from({ length: lineCount }, (_, index) => index)));
      return;
    }
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = -1;
        let bestRatio = 0;
        const enteredIndexes: number[] = [];
        itemRefs.current?.forEach((item, index) => {
          const ratio = item ? (ratios.get(item) ?? 0) : 0;
          // Strict > keeps the lowest index on ties.
          if (ratio > bestRatio) {
            bestIndex = index;
            bestRatio = ratio;
          }
          if (ratio >= ENTERED_VIEW_RATIO) enteredIndexes.push(index);
        });
        if (bestIndex !== -1) setActiveIndex(bestIndex);
        if (enteredIndexes.length > 0) {
          setSeen((previouslySeen) =>
            enteredIndexes.every((index) => previouslySeen.has(index))
              ? previouslySeen
              : new Set([...previouslySeen, ...enteredIndexes]),
          );
        }
      },
      { root: scroller, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    itemRefs.current?.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [scrollerRef, itemRefs, lineCount]);

  return { activeIndex, seen };
}
