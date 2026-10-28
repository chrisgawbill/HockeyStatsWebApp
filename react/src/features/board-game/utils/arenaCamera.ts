import type {
  Coord,
  GameState,
  Skater,
} from '@/features/board-game/types/game';
import { BOARD_COLS, BOARD_ROWS } from '@/features/board-game/data/balance';
import { GOALIE_TILES } from '@/features/board-game/data/rink';

/**
 * Presentation-only camera math for the dimensional arena. World units are
 * board tiles: the ice lies on the y = 0 plane, engine `col` runs along +x
 * and engine `row` along +z, centred on centre ice. Nothing here reads or
 * changes rules; it maps a `GameState` to where the camera looks.
 */

export type ArenaView = 'tactical' | 'shot';

/** `wide` keeps Blue's net on the left; `tall` (narrow screens) puts it at the bottom. */
export type BoardOrientation = 'wide' | 'tall';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A perspective camera placement; `fovDeg` is the vertical field of view. */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fovDeg: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** A projected point in CSS pixels from the viewport's top-left corner. */
export interface ScreenPoint {
  x: number;
  y: number;
  /** Distance in front of the camera; not positive means behind it. */
  depth: number;
}

/** The camera the match wants right now, and whose shot it frames. */
export interface ArenaCameraShot {
  view: ArenaView;
  shooterId: string | null;
}

/** Which view the camera shows, and whether it has finished moving there. */
export interface ArenaCameraState {
  view: ArenaView;
  settled: boolean;
}

export const RINK_HALF_LENGTH = BOARD_COLS / 2;
export const RINK_HALF_WIDTH = BOARD_ROWS / 2;
/** Thickness and height of the dasher boards around the ice, in tiles. */
export const BOARD_WALL_THICKNESS = 0.3;
export const BOARD_WALL_HEIGHT = 0.35;

/** Tactical camera tilt away from straight overhead. */
export const TACTICAL_TILT_DEG = 20;
export const TACTICAL_FOV_DEG = 40;
export const SHOT_FOV_DEG = 50;
/** Narrow screens need a wider vertical angle to keep shooter and net in frame. */
export const SHOT_FOV_TALL_DEG = 62;
/** Camera move into the shot view; it settles before the timing control appears. */
export const CAMERA_TO_SHOT_MS = 600;
/** Camera move back to the tactical view once the shot battle ends. */
export const CAMERA_TO_TACTICAL_MS = 400;

/** How far behind and above the shooter the shot camera sits, in tiles. */
const SHOT_CAMERA_BACK = 2.6;
const SHOT_CAMERA_HEIGHT = 1.5;
const SHOT_TARGET_HEIGHT = 0.3;
/** Share of the half-viewport the rink may fill in the tactical view. */
const TACTICAL_FIT_NDC = 0.94;
const WORLD_UP: Vec3 = { x: 0, y: 1, z: 0 };

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function lerpVec(from: Vec3, to: Vec3, progress: number): Vec3 {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
    z: lerp(from.z, to.z, progress),
  };
}

function aspectOf(viewport: Viewport): number {
  return viewport.width > 0 && viewport.height > 0
    ? viewport.width / viewport.height
    : 1;
}

/** World position of an engine tile's centre on the ice. */
export function tileCenter(coord: Coord): Vec3 {
  return {
    x: coord.col + 0.5 - RINK_HALF_LENGTH,
    y: 0,
    z: coord.row + 0.5 - RINK_HALF_WIDTH,
  };
}

/** Shot view while the user's shot battle is open; tactical otherwise. */
export function arenaCameraShotFor(
  state: Pick<GameState, 'phase' | 'duel'>,
): ArenaCameraShot {
  if (state.phase === 'duel' && state.duel?.kind === 'shot') {
    return { view: 'shot', shooterId: state.duel.attacker.skaterId };
  }
  return { view: 'tactical', shooterId: null };
}

/**
 * Projects a world point the way a three.js `PerspectiveCamera` aimed with
 * `lookAt(target)` and world-up +y would, into viewport pixels.
 */
export function projectToViewport(
  point: Vec3,
  pose: CameraPose,
  viewport: Viewport,
): ScreenPoint {
  const forward = normalize(subtract(pose.target, pose.position));
  const right = normalize(cross(forward, WORLD_UP));
  const up = cross(right, forward);
  const offset = subtract(point, pose.position);
  const depth = dot(offset, forward);
  const halfHeight = Math.tan((pose.fovDeg * Math.PI) / 360);
  const ndcX = dot(offset, right) / (depth * halfHeight * aspectOf(viewport));
  const ndcY = dot(offset, up) / (depth * halfHeight);
  return {
    x: ((ndcX + 1) / 2) * viewport.width,
    y: ((1 - ndcY) / 2) * viewport.height,
    depth,
  };
}

/** Unit vector from centre ice toward the tactical camera. */
function tacticalViewDirection(orientation: BoardOrientation): Vec3 {
  const tilt = (TACTICAL_TILT_DEG * Math.PI) / 180;
  return orientation === 'wide'
    ? { x: 0, y: Math.cos(tilt), z: Math.sin(tilt) }
    : { x: -Math.sin(tilt), y: Math.cos(tilt), z: 0 };
}

/** Outer corners of the boards, top and bottom, that the tactical view must contain. */
function rinkExtentPoints(): Vec3[] {
  const halfLength = RINK_HALF_LENGTH + BOARD_WALL_THICKNESS;
  const halfWidth = RINK_HALF_WIDTH + BOARD_WALL_THICKNESS;
  const points: Vec3[] = [];
  for (const x of [-halfLength, halfLength]) {
    for (const z of [-halfWidth, halfWidth]) {
      for (const y of [0, BOARD_WALL_HEIGHT]) points.push({ x, y, z });
    }
  }
  return points;
}

function isInsideFrame(
  points: Vec3[],
  pose: CameraPose,
  viewport: Viewport,
): boolean {
  return points.every((point) => {
    const projected = projectToViewport(point, pose, viewport);
    const ndcX = (projected.x / viewport.width) * 2 - 1;
    const ndcY = 1 - (projected.y / viewport.height) * 2;
    return (
      projected.depth > 0 &&
      Math.abs(ndcX) <= TACTICAL_FIT_NDC &&
      Math.abs(ndcY) <= TACTICAL_FIT_NDC
    );
  });
}

/**
 * The stable tactical camera: tilted `TACTICAL_TILT_DEG` from overhead,
 * oriented like `RinkBoard` (Blue's net left on wide screens, at the bottom
 * on tall ones), and as close as possible while the whole rink fits.
 */
export function tacticalPose(
  orientation: BoardOrientation,
  viewport: Viewport,
): CameraPose {
  const target: Vec3 = { x: 0, y: 0, z: 0 };
  const direction = tacticalViewDirection(orientation);
  const frame = { width: viewport.width || 1, height: viewport.height || 1 };
  const points = rinkExtentPoints();
  const poseAt = (distance: number): CameraPose => ({
    position: {
      x: direction.x * distance,
      y: direction.y * distance,
      z: direction.z * distance,
    },
    target,
    fovDeg: TACTICAL_FOV_DEG,
  });

  let near = 1;
  let far = 500;
  for (let step = 0; step < 40; step++) {
    const middle = (near + far) / 2;
    if (isInsideFrame(points, poseAt(middle), frame)) far = middle;
    else near = middle;
  }
  return poseAt(far);
}

/**
 * The close shot camera: behind and above the shooter, looking down the
 * line from the shooter to the net being attacked.
 */
export function shotPose(
  shooter: Coord,
  attackedGoal: Coord,
  viewport: Viewport,
): CameraPose {
  const shooterPoint = tileCenter(shooter);
  const goalPoint = tileCenter(attackedGoal);
  const towardGoal = normalize({
    x: goalPoint.x - shooterPoint.x,
    y: 0,
    z: goalPoint.z - shooterPoint.z,
  });
  const lineOfShot =
    towardGoal.x === 0 && towardGoal.z === 0
      ? { x: Math.sign(goalPoint.x) || 1, y: 0, z: 0 }
      : towardGoal;
  return {
    position: {
      x: shooterPoint.x - lineOfShot.x * SHOT_CAMERA_BACK,
      y: SHOT_CAMERA_HEIGHT,
      z: shooterPoint.z - lineOfShot.z * SHOT_CAMERA_BACK,
    },
    target: { x: goalPoint.x, y: SHOT_TARGET_HEIGHT, z: goalPoint.z },
    fovDeg: aspectOf(viewport) < 1 ? SHOT_FOV_TALL_DEG : SHOT_FOV_DEG,
  };
}

/**
 * The pose for the wanted view. A shot whose shooter is not on the ice falls
 * back to the tactical view rather than guessing.
 */
export function cameraPoseFor(
  cameraShot: ArenaCameraShot,
  skaters: Skater[],
  orientation: BoardOrientation,
  viewport: Viewport,
): CameraPose {
  const shooter = skaters.find((skater) => skater.id === cameraShot.shooterId);
  if (cameraShot.view !== 'shot' || !shooter) {
    return tacticalPose(orientation, viewport);
  }
  const defendingTeam = shooter.team === 'user' ? 'cpu' : 'user';
  return shotPose(shooter.pos, GOALIE_TILES[defendingTeam], viewport);
}

/** Linear blend between two poses; `progress` 0 is `from`, 1 is `to`. */
export function interpolatePose(
  from: CameraPose,
  to: CameraPose,
  progress: number,
): CameraPose {
  return {
    position: lerpVec(from.position, to.position, progress),
    target: lerpVec(from.target, to.target, progress),
    fovDeg: lerp(from.fovDeg, to.fovDeg, progress),
  };
}

/** Smooth start and stop for camera moves; maps [0, 1] onto [0, 1]. */
export function easeInOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
}

/** How long the camera takes between views; 0 means an immediate cut. */
export function cameraTransitionMs(
  fromView: ArenaView,
  toView: ArenaView,
  reducedMotion: boolean,
): number {
  if (reducedMotion || fromView === toView) return 0;
  return toView === 'shot' ? CAMERA_TO_SHOT_MS : CAMERA_TO_TACTICAL_MS;
}

/** A tile's projected centre and the side of the square hit target over it, in pixels. */
export interface TileScreenRect {
  x: number;
  y: number;
  size: number;
}

/**
 * Where a tile appears on screen, sized to its shorter projected side so
 * neighbouring hit targets never overlap.
 */
export function tileScreenRect(
  coord: Coord,
  pose: CameraPose,
  viewport: Viewport,
): TileScreenRect {
  const center = tileCenter(coord);
  const project = (dx: number, dz: number) =>
    projectToViewport(
      { x: center.x + dx, y: 0, z: center.z + dz },
      pose,
      viewport,
    );
  const spanBetween = (a: ScreenPoint, b: ScreenPoint) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  const centerPoint = project(0, 0);
  const alongCols = spanBetween(project(-0.5, 0), project(0.5, 0));
  const alongRows = spanBetween(project(0, -0.5), project(0, 0.5));
  return {
    x: centerPoint.x,
    y: centerPoint.y,
    size: Math.min(alongCols, alongRows),
  };
}
