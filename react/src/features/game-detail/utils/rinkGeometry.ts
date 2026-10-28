/**
 * NHL rink dimensions in feet, centered on the center-ice dot: x runs
 * -100..100 along the length (home attacks +x), y -42.5..42.5 across.
 */
export const RINK_HALF_LENGTH = 100;
export const RINK_HALF_WIDTH = 42.5;
export const CORNER_RADIUS = 28;
export const BLUE_LINE_X = 25;
export const GOAL_LINE_X = 89;
export const FACEOFF_DOT_X = 69;
export const FACEOFF_DOT_Y = 22;
export const FACEOFF_CIRCLE_RADIUS = 15;
export const CREASE_RADIUS = 6;
export const NET_DEPTH = 3.3;
export const NET_HALF_WIDTH = 3;

/** Pixel transform for a rink drawn `width` pixels wide. */
export interface RinkScale {
  width: number;
  height: number;
  pixelsPerFoot: number;
  toPixelX: (feet: number) => number;
  toPixelY: (feet: number) => number;
}

const EDGE_PADDING = 2;

/** Maps rink feet to SVG pixels, +y up the screen, keeping the rink's 200×85 shape. */
export function createRinkScale(width: number): RinkScale {
  const pixelsPerFoot = (width - 2 * EDGE_PADDING) / (2 * RINK_HALF_LENGTH);
  return {
    width,
    height: 2 * RINK_HALF_WIDTH * pixelsPerFoot + 2 * EDGE_PADDING,
    pixelsPerFoot,
    toPixelX: (feet) =>
      EDGE_PADDING + (feet + RINK_HALF_LENGTH) * pixelsPerFoot,
    toPixelY: (feet) => EDGE_PADDING + (RINK_HALF_WIDTH - feet) * pixelsPerFoot,
  };
}
