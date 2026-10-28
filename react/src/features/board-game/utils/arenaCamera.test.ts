import { describe, expect, it } from 'vitest';
import type { Coord, GameState } from '@/features/board-game/types/game';
import { GOALIE_TILES } from '@/features/board-game/data/rink';
import {
  CAMERA_TO_SHOT_MS,
  CAMERA_TO_TACTICAL_MS,
  TACTICAL_TILT_DEG,
  arenaCameraShotFor,
  cameraPoseFor,
  cameraTransitionMs,
  easeInOutCubic,
  interpolatePose,
  projectToViewport,
  shotPose,
  tacticalPose,
  tileCenter,
  tileScreenRect,
  type CameraPose,
  type Viewport,
} from '@/features/board-game/utils/arenaCamera';
import { gameReducer } from '@/features/board-game/engine/gameReducer';
import {
  makeFaceoffState,
  makeMoveState,
  shotState,
} from '@/test/fixtures/boardScenarios';

const DESKTOP: Viewport = { width: 960, height: 480 };
const PHONE_PORTRAIT: Viewport = { width: 374, height: 560 };
const PHONE_LANDSCAPE: Viewport = { width: 820, height: 330 };

const BLUE_NET = GOALIE_TILES.user;
const RED_NET = GOALIE_TILES.cpu;

function project(coord: Coord, pose: CameraPose, viewport: Viewport) {
  return projectToViewport(tileCenter(coord), pose, viewport);
}

function isOnScreen(coord: Coord, pose: CameraPose, viewport: Viewport) {
  const point = project(coord, pose, viewport);
  return (
    point.depth > 0 &&
    point.x >= 0 &&
    point.x <= viewport.width &&
    point.y >= 0 &&
    point.y <= viewport.height
  );
}

const RINK_CORNER_TILES: Coord[] = [
  { col: 0, row: 0 },
  { col: 14, row: 0 },
  { col: 0, row: 6 },
  { col: 14, row: 6 },
];

describe('arena camera: world mapping', () => {
  it('centres the rink on the origin with one world unit per tile', () => {
    expect(tileCenter({ col: 7, row: 3 })).toEqual({ x: 0, y: 0, z: 0 });
    expect(tileCenter({ col: 0, row: 0 })).toEqual({ x: -7, y: 0, z: -3 });
    expect(tileCenter({ col: 14, row: 6 })).toEqual({ x: 7, y: 0, z: 3 });
  });
});

describe('arena camera: which view the match wants', () => {
  it('stays tactical outside the shot battle', () => {
    expect(arenaCameraShotFor(makeMoveState())).toEqual({
      view: 'tactical',
      shooterId: null,
    });
  });

  it('frames the shooter while the shot battle is open, then returns to tactical', () => {
    const shooting = gameReducer(shotState(3), { type: 'SHOOT' });
    expect(arenaCameraShotFor(shooting)).toEqual({
      view: 'shot',
      shooterId: 'user-C',
    });

    const resolved = gameReducer(
      gameReducer(shooting, { type: 'PICK_SHOT_CARD', handIndex: 0 }),
      { type: 'RESOLVE_SHOT_BAND', band: 'miss' },
    );
    expect(resolved.phase).not.toBe('duel');
    expect(arenaCameraShotFor(resolved).view).toBe('tactical');
  });

  it('keeps other battles in the tactical view', () => {
    const faceoff = makeFaceoffState();
    expect(faceoff.duel?.kind).toBe('faceoff');
    expect(arenaCameraShotFor(faceoff).view).toBe('tactical');
  });
});

describe('arena camera: tactical view', () => {
  it.each([
    ['wide desktop', 'wide', DESKTOP],
    ['wide landscape phone', 'wide', PHONE_LANDSCAPE],
    ['tall portrait phone', 'tall', PHONE_PORTRAIT],
  ] as const)(
    'keeps every rink corner on screen (%s)',
    (_label, orientation, viewport) => {
      const pose = tacticalPose(orientation, viewport);
      for (const corner of RINK_CORNER_TILES) {
        expect(isOnScreen(corner, pose, viewport)).toBe(true);
      }
    },
  );

  it('tilts the camera about 20 degrees from overhead', () => {
    for (const orientation of ['wide', 'tall'] as const) {
      const pose = tacticalPose(orientation, DESKTOP);
      const offset = {
        x: pose.position.x - pose.target.x,
        y: pose.position.y - pose.target.y,
        z: pose.position.z - pose.target.z,
      };
      const tiltDeg =
        (Math.acos(offset.y / Math.hypot(offset.x, offset.y, offset.z)) * 180) /
        Math.PI;
      expect(tiltDeg).toBeCloseTo(TACTICAL_TILT_DEG, 5);
    }
  });

  it('puts Blue’s net on the left and row 0 at the top on wide screens', () => {
    const pose = tacticalPose('wide', DESKTOP);
    expect(project(BLUE_NET, pose, DESKTOP).x).toBeLessThan(
      project(RED_NET, pose, DESKTOP).x,
    );
    expect(project({ col: 7, row: 0 }, pose, DESKTOP).y).toBeLessThan(
      project({ col: 7, row: 6 }, pose, DESKTOP).y,
    );
  });

  it('puts Blue’s net at the bottom and row 0 on the left on tall screens, like RinkBoard', () => {
    const pose = tacticalPose('tall', PHONE_PORTRAIT);
    expect(project(BLUE_NET, pose, PHONE_PORTRAIT).y).toBeGreaterThan(
      project(RED_NET, pose, PHONE_PORTRAIT).y,
    );
    expect(project({ col: 7, row: 0 }, pose, PHONE_PORTRAIT).x).toBeLessThan(
      project({ col: 7, row: 6 }, pose, PHONE_PORTRAIT).x,
    );
  });

  it('sizes tile hit targets so neighbours never overlap', () => {
    for (const [orientation, viewport] of [
      ['wide', DESKTOP],
      ['tall', PHONE_PORTRAIT],
    ] as const) {
      const pose = tacticalPose(orientation, viewport);
      const tile = tileScreenRect({ col: 7, row: 3 }, pose, viewport);
      const right = tileScreenRect({ col: 8, row: 3 }, pose, viewport);
      const below = tileScreenRect({ col: 7, row: 4 }, pose, viewport);
      const gap = (other: typeof tile) =>
        Math.hypot(other.x - tile.x, other.y - tile.y);
      expect(tile.size).toBeGreaterThan(20);
      expect(tile.size).toBeLessThanOrEqual(gap(right) + 0.5);
      expect(tile.size).toBeLessThanOrEqual(gap(below) + 0.5);
    }
  });

  it('copes with an unmeasured viewport', () => {
    const pose = tacticalPose('wide', { width: 0, height: 0 });
    expect(Number.isFinite(pose.position.y)).toBe(true);
  });
});

describe('arena camera: shot view', () => {
  const shooter: Coord = { col: 11, row: 2 };

  it.each([
    ['desktop', DESKTOP],
    ['portrait phone', PHONE_PORTRAIT],
  ] as const)(
    'sits behind the shooter with shooter and net in frame (%s)',
    (_label, viewport) => {
      const pose = shotPose(shooter, RED_NET, viewport);
      const goal = tileCenter(RED_NET);
      const shooterPoint = tileCenter(shooter);
      const distanceToGoal = (point: { x: number; z: number }) =>
        Math.hypot(point.x - goal.x, point.z - goal.z);

      expect(distanceToGoal(pose.position)).toBeGreaterThan(
        distanceToGoal(shooterPoint),
      );
      expect(isOnScreen(shooter, pose, viewport)).toBe(true);
      expect(isOnScreen(RED_NET, pose, viewport)).toBe(true);
    },
  );

  it('still faces the net when the shooter stands on the goal line', () => {
    const pose = shotPose(RED_NET, RED_NET, DESKTOP);
    expect(pose.position.x).toBeLessThan(tileCenter(RED_NET).x);
  });

  it('frames the shooter’s attacked net, falling back to tactical without a shooter', () => {
    const state: GameState = gameReducer(shotState(3), { type: 'SHOOT' });
    const cameraShot = arenaCameraShotFor(state);
    const pose = cameraPoseFor(cameraShot, state.skaters, 'wide', DESKTOP);
    expect(pose.target.x).toBeCloseTo(tileCenter(RED_NET).x);

    const cpuShooter = state.skaters.map((skater) =>
      skater.id === 'user-C' ? { ...skater, team: 'cpu' as const } : skater,
    );
    const cpuPose = cameraPoseFor(cameraShot, cpuShooter, 'wide', DESKTOP);
    expect(cpuPose.target.x).toBeCloseTo(tileCenter(BLUE_NET).x);

    expect(
      cameraPoseFor(
        { view: 'shot', shooterId: 'missing' },
        state.skaters,
        'wide',
        DESKTOP,
      ),
    ).toEqual(tacticalPose('wide', DESKTOP));
  });
});

describe('arena camera: transitions', () => {
  it('cuts in reduced motion or when the view is unchanged', () => {
    expect(cameraTransitionMs('tactical', 'shot', true)).toBe(0);
    expect(cameraTransitionMs('shot', 'tactical', true)).toBe(0);
    expect(cameraTransitionMs('shot', 'shot', false)).toBe(0);
  });

  it('uses the reviewed durations otherwise', () => {
    expect(cameraTransitionMs('tactical', 'shot', false)).toBe(
      CAMERA_TO_SHOT_MS,
    );
    expect(cameraTransitionMs('shot', 'tactical', false)).toBe(
      CAMERA_TO_TACTICAL_MS,
    );
  });

  it('eases from rest to rest and blends poses end to end', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(2)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);

    const from = tacticalPose('wide', DESKTOP);
    const to = shotPose({ col: 11, row: 3 }, RED_NET, DESKTOP);
    expect(interpolatePose(from, to, 0)).toEqual(from);
    expect(interpolatePose(from, to, 1)).toEqual(to);
    expect(interpolatePose(from, to, 0.5).fovDeg).toBeCloseTo(
      (from.fovDeg + to.fovDeg) / 2,
    );
  });
});
