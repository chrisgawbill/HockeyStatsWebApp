import { useRef } from 'react';
import type { MouseEvent, TouchEvent } from 'react';

/** Least horizontal travel, in pixels, that counts as a swipe. */
const MIN_SWIPE_DISTANCE_PX = 50;
/** How many times larger horizontal travel must be than vertical travel. */
const HORIZONTAL_DOMINANCE_RATIO = 1.5;

interface HorizontalSwipeCallbacks {
  /** Called when a finger moves from right to left. */
  onSwipeLeft: () => void;
  /** Called when a finger moves from left to right. */
  onSwipeRight: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

/**
 * Detects clearly horizontal single-finger swipes. Spread the returned props on
 * the swipe area; mostly-vertical drags are ignored so the page still scrolls,
 * and the click that follows a swipe is swallowed so it cannot press a child.
 */
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
}: HorizontalSwipeCallbacks) {
  const touchStart = useRef<TouchPoint | null>(null);
  const didJustSwipe = useRef(false);

  const startTracking = (event: TouchEvent) => {
    didJustSwipe.current = false;
    const isSingleFinger = event.touches.length === 1;
    touchStart.current = isSingleFinger
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  };

  const finishTracking = (event: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) {
      return;
    }
    const { clientX, clientY } = event.changedTouches[0];
    const distanceX = clientX - start.x;
    const distanceY = clientY - start.y;
    const isHorizontalSwipe =
      Math.abs(distanceX) >= MIN_SWIPE_DISTANCE_PX &&
      Math.abs(distanceX) > HORIZONTAL_DOMINANCE_RATIO * Math.abs(distanceY);
    if (!isHorizontalSwipe) {
      return;
    }
    didJustSwipe.current = true;
    if (distanceX < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  };

  const cancelTracking = () => {
    touchStart.current = null;
  };

  const swallowClickAfterSwipe = (event: MouseEvent) => {
    if (didJustSwipe.current) {
      didJustSwipe.current = false;
      event.stopPropagation();
      event.preventDefault();
    }
  };

  return {
    onTouchStart: startTracking,
    onTouchEnd: finishTracking,
    onTouchCancel: cancelTracking,
    onClickCapture: swallowClickAfterSwipe,
  };
}
