import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  Shape,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import type {
  Coord,
  Puck,
  Role,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';
import {
  GOALIE_TILES,
  LINE_COLUMNS,
  RINK_CORNER_RADIUS,
} from '@/features/board-game/data/rink';
import {
  BOARD_WALL_HEIGHT,
  BOARD_WALL_THICKNESS,
  RINK_HALF_LENGTH,
  RINK_HALF_WIDTH,
  easeInOutCubic,
  interpolatePose,
  tileCenter,
  type CameraPose,
  type Viewport,
} from '@/features/board-game/utils/arenaCamera';

/** What has keyboard focus in the HTML layer, mirrored as a frame in the scene. */
export type ArenaFocus =
  { kind: 'tile'; coord: Coord } | { kind: 'skater'; skaterId: string };

/** Everything the scene draws for the board; the scene keeps no rules. */
export interface ArenaBoardSnapshot {
  skaters: Skater[];
  puck: Puck;
  highlighted: Coord[];
  selectedId: string | null;
  focus: ArenaFocus | null;
}

export interface ArenaSceneCallbacks {
  /** Called once, after the first frame reaches the canvas. */
  onFirstFrame: () => void;
  /** The browser dropped the WebGL context; the caller should fall back. */
  onContextLost: () => void;
}

/** Imperative handle to the three.js arena. It renders only when something changes. */
export interface ArenaScene {
  setViewport(viewport: Viewport, pixelRatio: number): void;
  showBoard(snapshot: ArenaBoardSnapshot): void;
  /** Moves (or with `durationMs` 0, cuts) the camera; `onSettled` fires once it has stopped. */
  moveCamera(pose: CameraPose, durationMs: number, onSettled: () => void): void;
  dispose(): void;
}

const ARENA_BACKGROUND = '#0f1720';
const ICE_COLOR = '#e8f4fb';
const TEAM_COLOR: Record<TeamId, string> = { user: '#1565c0', cpu: '#c62828' };
const NEUTRAL_STAND_COLOR = '#3a4554';
const LINE_BLUE = '#1565c0';
const LINE_RED = '#e05c6b';
const CREASE_FILL = 'rgba(224, 92, 107, 0.18)';
const NET_TILE_FILL = 'rgba(160, 205, 235, 0.8)';
const HIGHLIGHT_FILL = '#ffca28';
const HIGHLIGHT_EDGE = '#8a5a00';
const CARRIER_RING = '#00bcd4';
const SELECTED_RING = '#ffffff';
const FOCUS_FRAME = '#ffffff';
const FOCUS_OUTLINE = '#111111';

/** Ice texture resolution, in pixels per tile. */
const ICE_PIXELS_PER_TILE = 64;
const TOKEN_RADIUS = 0.36;
const TOKEN_HEIGHT = 0.18;
const SELECTED_LIFT = 0.14;

/**
 * Traces the rink outline (rounded ends from `RINK_CORNER_RADIUS`, grown outward
 * by `grow` tiles) onto a three.js shape or path, centred on the origin.
 */
function traceRinkOutline<T extends Shape | Path>(path: T, grow: number): T {
  const halfLength = RINK_HALF_LENGTH + grow;
  const halfWidth = RINK_HALF_WIDTH + grow;
  const radiusX = RINK_CORNER_RADIUS.x + grow;
  const radiusY = Math.min(RINK_CORNER_RADIUS.y + grow, halfWidth);
  path.moveTo(-halfLength + radiusX, -halfWidth);
  path.lineTo(halfLength - radiusX, -halfWidth);
  path.absellipse(
    halfLength - radiusX,
    -halfWidth + radiusY,
    radiusX,
    radiusY,
    -Math.PI / 2,
    0,
    false,
    0,
  );
  path.lineTo(halfLength, halfWidth - radiusY);
  path.absellipse(
    halfLength - radiusX,
    halfWidth - radiusY,
    radiusX,
    radiusY,
    0,
    Math.PI / 2,
    false,
    0,
  );
  path.lineTo(-halfLength + radiusX, halfWidth);
  path.absellipse(
    -halfLength + radiusX,
    halfWidth - radiusY,
    radiusX,
    radiusY,
    Math.PI / 2,
    Math.PI,
    false,
    0,
  );
  path.lineTo(-halfLength, -halfWidth + radiusY);
  path.absellipse(
    -halfLength + radiusX,
    -halfWidth + radiusY,
    radiusX,
    radiusY,
    Math.PI,
    Math.PI * 1.5,
    false,
    0,
  );
  return path;
}

/** A wall ring standing on the ice between two rink outlines. */
function createRinkWall(
  innerGrow: number,
  outerGrow: number,
  height: number,
  material: Material,
): Mesh {
  const outline = traceRinkOutline(new Shape(), outerGrow);
  outline.holes.push(traceRinkOutline(new Path(), innerGrow));
  const geometry = new ExtrudeGeometry(outline, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);
  return new Mesh(geometry, material);
}

/** Canvas-2D path of the rink outline in tile units (origin at the top-left tile corner). */
function traceIceClip(context: CanvasRenderingContext2D): void {
  const length = RINK_HALF_LENGTH * 2;
  const width = RINK_HALF_WIDTH * 2;
  const { x: radiusX } = RINK_CORNER_RADIUS;
  const radiusY = Math.min(RINK_CORNER_RADIUS.y, RINK_HALF_WIDTH);
  context.beginPath();
  context.moveTo(radiusX, 0);
  context.lineTo(length - radiusX, 0);
  context.ellipse(
    length - radiusX,
    radiusY,
    radiusX,
    radiusY,
    0,
    -Math.PI / 2,
    0,
  );
  context.lineTo(length, width - radiusY);
  context.ellipse(
    length - radiusX,
    width - radiusY,
    radiusX,
    radiusY,
    0,
    0,
    Math.PI / 2,
  );
  context.lineTo(radiusX, width);
  context.ellipse(
    radiusX,
    width - radiusY,
    radiusX,
    radiusY,
    0,
    Math.PI / 2,
    Math.PI,
  );
  context.lineTo(0, radiusY);
  context.ellipse(
    radiusX,
    radiusY,
    radiusX,
    radiusY,
    0,
    Math.PI,
    Math.PI * 1.5,
  );
  context.closePath();
}

function drawCircle(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  style: { fill?: string; stroke?: string; lineWidth?: number },
): void {
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  if (style.fill) {
    context.fillStyle = style.fill;
    context.fill();
  }
  if (style.stroke) {
    context.strokeStyle = style.stroke;
    context.lineWidth = style.lineWidth ?? 0.07;
    context.stroke();
  }
}

function drawVerticalLine(
  context: CanvasRenderingContext2D,
  x: number,
  color: string,
  lineWidth: number,
): void {
  context.fillStyle = color;
  context.fillRect(x - lineWidth / 2, 0, lineWidth, RINK_HALF_WIDTH * 2);
}

/** Faint tile grid so individual tiles stay countable under the camera tilt. */
function drawTileGrid(context: CanvasRenderingContext2D): void {
  context.strokeStyle = 'rgba(21, 101, 192, 0.14)';
  context.lineWidth = 0.03;
  for (let col = 1; col < RINK_HALF_LENGTH * 2; col++) {
    context.beginPath();
    context.moveTo(col, 0);
    context.lineTo(col, RINK_HALF_WIDTH * 2);
    context.stroke();
  }
  for (let row = 1; row < RINK_HALF_WIDTH * 2; row++) {
    context.beginPath();
    context.moveTo(0, row);
    context.lineTo(RINK_HALF_LENGTH * 2, row);
    context.stroke();
  }
}

/** Lines, creases, circles and dots, at the same tile positions as `RinkOverlay`. */
function drawRinkMarkings(context: CanvasRenderingContext2D): void {
  for (const col of [
    ...LINE_COLUMNS.userBlueLine,
    ...LINE_COLUMNS.cpuBlueLine,
  ]) {
    drawVerticalLine(context, col, LINE_BLUE, 0.1);
  }
  for (const col of LINE_COLUMNS.redLine) {
    drawVerticalLine(context, col + 0.5, LINE_RED, 0.1);
  }
  for (const goal of Object.values(GOALIE_TILES)) {
    context.fillStyle = NET_TILE_FILL;
    context.fillRect(goal.col, goal.row, 1, 1);
  }
  for (const creaseX of [0, RINK_HALF_LENGTH * 2 - 1.4]) {
    context.beginPath();
    context.roundRect(creaseX, 2, 1.4, 3, 0.35);
    context.fillStyle = CREASE_FILL;
    context.fill();
    context.strokeStyle = LINE_RED;
    context.lineWidth = 0.06;
    context.stroke();
  }
  for (const [centerX, centerY] of [
    [2.5, 1.5],
    [2.5, 5.5],
    [12.5, 1.5],
    [12.5, 5.5],
  ]) {
    drawCircle(context, centerX, centerY, 1.1, { stroke: LINE_RED });
    drawCircle(context, centerX, centerY, 0.14, { fill: LINE_RED });
  }
  for (const [centerX, centerY] of [
    [5.5, 1.5],
    [5.5, 5.5],
    [9.5, 1.5],
    [9.5, 5.5],
  ]) {
    drawCircle(context, centerX, centerY, 0.16, { fill: LINE_RED });
  }
  drawCircle(context, 7.5, 3.5, 1.4, { stroke: LINE_RED, lineWidth: 0.09 });
  drawCircle(context, 7.5, 3.5, 0.22, { fill: LINE_BLUE });
}

/** The ice sheet: a canvas texture of the markings, transparent outside the rounded boards. */
function createIce(): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = RINK_HALF_LENGTH * 2 * ICE_PIXELS_PER_TILE;
  canvas.height = RINK_HALF_WIDTH * 2 * ICE_PIXELS_PER_TILE;
  const context = canvas.getContext('2d');
  if (context) {
    context.scale(ICE_PIXELS_PER_TILE, ICE_PIXELS_PER_TILE);
    traceIceClip(context);
    context.clip();
    context.fillStyle = ICE_COLOR;
    context.fillRect(0, 0, RINK_HALF_LENGTH * 2, RINK_HALF_WIDTH * 2);
    drawTileGrid(context);
    drawRinkMarkings(context);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new PlaneGeometry(RINK_HALF_LENGTH * 2, RINK_HALF_WIDTH * 2);
  geometry.rotateX(-Math.PI / 2);
  return new Mesh(
    geometry,
    new MeshLambertMaterial({ map: texture, alphaTest: 0.5 }),
  );
}

/** Dasher boards with a blue top rail and a faint glass ring above them. */
function createBoards(): Group {
  const boards = new Group();
  boards.add(
    createRinkWall(
      0,
      BOARD_WALL_THICKNESS,
      BOARD_WALL_HEIGHT,
      new MeshLambertMaterial({ color: '#f4f7fa' }),
    ),
  );
  const rail = createRinkWall(
    0,
    BOARD_WALL_THICKNESS,
    0.05,
    new MeshLambertMaterial({ color: '#4fa8d8' }),
  );
  rail.position.y = BOARD_WALL_HEIGHT;
  boards.add(rail);
  const glass = createRinkWall(
    BOARD_WALL_THICKNESS / 2,
    BOARD_WALL_THICKNESS / 2 + 0.04,
    0.8,
    new MeshLambertMaterial({
      color: '#cfe8f7',
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  glass.position.y = BOARD_WALL_HEIGHT + 0.05;
  boards.add(glass);
  return boards;
}

/** One stepped stand section: three tiers rising away from the ice. */
function createStandSection(
  length: number,
  color: string,
  facing: { x: number; z: number },
): Group {
  const section = new Group();
  const tierDepth = 0.9;
  const tierRise = 0.45;
  for (let tier = 0; tier < 3; tier++) {
    const shade = new Color(color).offsetHSL(0, 0, tier % 2 === 0 ? 0 : -0.06);
    const tierMesh = new Mesh(
      new BoxGeometry(length, tierRise * (tier + 1), tierDepth),
      new MeshLambertMaterial({ color: shade }),
    );
    tierMesh.position.set(0, (tierRise * (tier + 1)) / 2, tier * tierDepth);
    section.add(tierMesh);
  }
  section.rotation.y = Math.atan2(-facing.x, -facing.z);
  return section;
}

/** Stand sections around the rink: Blue's half and end in blue, Red's in red, centre neutral. */
function createStands(): Group {
  const stands = new Group();
  const sideOffset = RINK_HALF_WIDTH + BOARD_WALL_THICKNESS + 0.9;
  const endOffset = RINK_HALF_LENGTH + BOARD_WALL_THICKNESS + 0.9;
  const sideSections: { x: number; color: string }[] = [
    { x: -5, color: TEAM_COLOR.user },
    { x: 0, color: NEUTRAL_STAND_COLOR },
    { x: 5, color: TEAM_COLOR.cpu },
  ];
  for (const zSign of [-1, 1]) {
    for (const { x, color } of sideSections) {
      const section = createStandSection(4.6, color, { x: 0, z: -zSign });
      section.position.set(x, 0, zSign * sideOffset);
      stands.add(section);
    }
  }
  for (const [xSign, team] of [
    [-1, 'user'],
    [1, 'cpu'],
  ] as const) {
    const section = createStandSection(5, TEAM_COLOR[team], {
      x: -xSign,
      z: 0,
    });
    section.position.set(xSign * endOffset, 0, 0);
    stands.add(section);
  }
  return stands;
}

/** Arena scoreboard block hung above the stands behind Red's net, facing centre ice. */
function createScoreboard(): Group {
  const scoreboard = new Group();
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#05080c';
    context.fillRect(0, 0, 256, 96);
    context.font = 'bold 34px sans-serif';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#64b5f6';
    context.fillText('BLUE', 70, 48);
    context.fillStyle = '#ffca28';
    context.fillText('·', 128, 48);
    context.fillStyle = '#fc8181';
    context.fillText('RED', 190, 48);
  }
  const face = new CanvasTexture(canvas);
  face.colorSpace = SRGBColorSpace;
  const housing = new MeshLambertMaterial({ color: '#1c242e' });
  const screen = new MeshBasicMaterial({ map: face });
  const block = new Mesh(new BoxGeometry(0.4, 1.3, 3.4), [
    housing,
    screen,
    housing,
    housing,
    housing,
    housing,
  ]);
  scoreboard.add(block);
  scoreboard.position.set(RINK_HALF_LENGTH + 3.6, 3.1, 0);
  return scoreboard;
}

/** A simple goal frame behind each goalie tile. */
function createNets(): Group {
  const nets = new Group();
  const netGeometry = new BoxGeometry(0.28, 0.42, 0.95);
  const mesh = new MeshLambertMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.45,
  });
  const frame = new LineBasicMaterial({ color: LINE_RED });
  for (const goal of Object.values(GOALIE_TILES)) {
    const center = tileCenter(goal);
    const outward = Math.sign(center.x);
    const net = new Mesh(netGeometry, mesh);
    net.add(new LineSegments(new EdgesGeometry(netGeometry), frame));
    net.position.set(center.x + outward * 0.42, 0.21, center.z);
    nets.add(net);
  }
  return nets;
}

/** Square outline lying on the ice, used for legal-move and focus frames. */
function createSquareFrame(
  halfSide: number,
  width: number,
  color: string,
): Mesh {
  const outer = halfSide * Math.SQRT2;
  const inner = (halfSide - width) * Math.SQRT2;
  const geometry = new RingGeometry(inner, outer, 4, 1, Math.PI / 4);
  geometry.rotateX(-Math.PI / 2);
  return new Mesh(
    geometry,
    new MeshBasicMaterial({ color, depthTest: false, transparent: true }),
  );
}

/** Legal destination marker: amber fill plus a dark square edge, so it reads without color. */
function createHighlightMarker(): Group {
  const marker = new Group();
  const fillGeometry = new PlaneGeometry(0.86, 0.86);
  fillGeometry.rotateX(-Math.PI / 2);
  marker.add(
    new Mesh(
      fillGeometry,
      new MeshBasicMaterial({
        color: HIGHLIGHT_FILL,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    ),
  );
  marker.add(createSquareFrame(0.44, 0.06, HIGHLIGHT_EDGE));
  marker.renderOrder = 1;
  return marker;
}

/** White focus frame with a dark outline, readable on ice and on tokens. */
function createFocusFrame(): Group {
  const frame = new Group();
  frame.add(createSquareFrame(0.56, 0.1, FOCUS_OUTLINE));
  frame.add(createSquareFrame(0.52, 0.06, FOCUS_FRAME));
  frame.renderOrder = 3;
  return frame;
}

function createRoleLabel(role: Role): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.font = 'bold 40px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 6;
    context.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    context.strokeText(role, 32, 34);
    context.fillStyle = '#ffffff';
    context.fillText(role, 32, 34);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const label = new Sprite(
    new SpriteMaterial({ map: texture, depthTest: false }),
  );
  label.scale.set(0.55, 0.55, 1);
  label.position.y = TOKEN_HEIGHT + 0.12;
  label.renderOrder = 2;
  return label;
}

interface SkaterToken {
  group: Group;
  body: Group;
  disc: Mesh<CylinderGeometry, MeshLambertMaterial>;
  carrierRing: Mesh;
  carriedPuck: Mesh;
  selectedRing: Mesh;
}

function createPuckMesh(): Mesh {
  return new Mesh(
    new CylinderGeometry(0.15, 0.15, 0.07, 20),
    new MeshLambertMaterial({ color: '#111111' }),
  );
}

function createRing(radius: number, tube: number, color: string): Mesh {
  const geometry = new TorusGeometry(radius, tube, 8, 40);
  geometry.rotateX(Math.PI / 2);
  return new Mesh(geometry, new MeshBasicMaterial({ color }));
}

/** A skater token: team-colored disc, role letter, and (hidden) carrier/selected rings. */
function createSkaterToken(skater: Skater): SkaterToken {
  const group = new Group();
  const body = new Group();
  const disc = new Mesh(
    new CylinderGeometry(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_HEIGHT, 32),
    new MeshLambertMaterial({ color: TEAM_COLOR[skater.team] }),
  );
  disc.position.y = TOKEN_HEIGHT / 2;
  body.add(disc);
  body.add(createRoleLabel(skater.role));
  const carriedPuck = createPuckMesh();
  carriedPuck.position.set(0.3, 0.035, 0.3);
  body.add(carriedPuck);
  group.add(body);

  const carrierRing = createRing(0.45, 0.045, CARRIER_RING);
  carrierRing.position.y = 0.03;
  group.add(carrierRing);
  const selectedRing = createRing(0.52, 0.06, SELECTED_RING);
  selectedRing.position.y = 0.05;
  group.add(selectedRing);
  return { group, body, disc, carrierRing, carriedPuck, selectedRing };
}

/** Places a token and shows its puck, selected and stunned states. */
function updateSkaterToken(
  token: SkaterToken,
  skater: Skater,
  snapshot: ArenaBoardSnapshot,
): void {
  const center = tileCenter(skater.pos);
  const isCarrier =
    snapshot.puck.kind === 'carried' && snapshot.puck.skaterId === skater.id;
  const isSelected = snapshot.selectedId === skater.id;
  token.group.position.set(center.x, 0, center.z);
  token.body.position.y = isSelected ? SELECTED_LIFT : 0;
  token.body.rotation.z = skater.stunned ? 0.35 : 0;
  token.disc.material.color
    .set(TEAM_COLOR[skater.team])
    .multiplyScalar(skater.stunned ? 0.6 : 1);
  token.carrierRing.visible = isCarrier;
  token.carriedPuck.visible = isCarrier;
  token.selectedRing.visible = isSelected;
}

function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as Partial<Mesh>;
    mesh.geometry?.dispose();
    const materials = mesh.material
      ? Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      : [];
    for (const material of materials) {
      const textured = material as Material & { map?: { dispose(): void } };
      textured.map?.dispose();
      material.dispose();
    }
  });
}

function applyPose(camera: PerspectiveCamera, pose: CameraPose): void {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.fov = pose.fovDeg;
  camera.updateProjectionMatrix();
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
}

/** Static arena dressing: lights, floor, ice, boards, stands, nets and scoreboard. */
function populateArena(scene: Scene): void {
  scene.background = new Color(ARENA_BACKGROUND);
  scene.add(new HemisphereLight('#ffffff', '#2b3440', 2.2));
  const keyLight = new DirectionalLight('#ffffff', 1.4);
  keyLight.position.set(-4, 12, 6);
  scene.add(keyLight);

  const floorGeometry = new PlaneGeometry(60, 40);
  floorGeometry.rotateX(-Math.PI / 2);
  const floor = new Mesh(
    floorGeometry,
    new MeshLambertMaterial({ color: '#1b2430' }),
  );
  floor.position.y = -0.02;
  scene.add(floor);
  scene.add(createIce());
  scene.add(createBoards());
  scene.add(createStands());
  scene.add(createNets());
  scene.add(createScoreboard());
}

/**
 * Builds the arena on `canvas`. Throws when WebGL cannot start, so the
 * caller can fall back to the HTML rink.
 */
export function createArenaScene(
  canvas: HTMLCanvasElement,
  callbacks: ArenaSceneCallbacks,
): ArenaScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 200);
  populateArena(scene);

  const tokens = new Map<string, SkaterToken>();
  const highlightMarkers: Group[] = [];
  const loosePuck = new Group();
  loosePuck.add(createPuckMesh());
  const loosePuckRing = createRing(0.26, 0.035, CARRIER_RING);
  loosePuck.add(loosePuckRing);
  loosePuck.visible = false;
  scene.add(loosePuck);
  const focusFrame = createFocusFrame();
  focusFrame.visible = false;
  scene.add(focusFrame);

  let hasViewport = false;
  let firstFrameDrawn = false;
  let renderFrameId: number | null = null;
  let cameraFrameId: number | null = null;
  let currentPose: CameraPose | null = null;

  function handleContextLost(event: Event) {
    event.preventDefault();
    callbacks.onContextLost();
  }
  canvas.addEventListener('webglcontextlost', handleContextLost);

  function renderNow() {
    renderFrameId = null;
    if (!hasViewport || !currentPose) return;
    renderer.render(scene, camera);
    if (!firstFrameDrawn) {
      firstFrameDrawn = true;
      callbacks.onFirstFrame();
    }
  }

  function requestRender() {
    if (renderFrameId === null) {
      renderFrameId = requestAnimationFrame(renderNow);
    }
  }

  function showHighlights(highlighted: Coord[]) {
    while (highlightMarkers.length < highlighted.length) {
      const marker = createHighlightMarker();
      highlightMarkers.push(marker);
      scene.add(marker);
    }
    highlightMarkers.forEach((marker, index) => {
      const coord = highlighted[index];
      marker.visible = Boolean(coord);
      if (!coord) return;
      const center = tileCenter(coord);
      marker.position.set(center.x, 0.01, center.z);
    });
  }

  function showSkaters(snapshot: ArenaBoardSnapshot) {
    const onIce = new Set(snapshot.skaters.map((skater) => skater.id));
    for (const [skaterId, token] of tokens) {
      if (onIce.has(skaterId)) continue;
      scene.remove(token.group);
      disposeObject(token.group);
      tokens.delete(skaterId);
    }
    for (const skater of snapshot.skaters) {
      let token = tokens.get(skater.id);
      if (!token) {
        token = createSkaterToken(skater);
        tokens.set(skater.id, token);
        scene.add(token.group);
      }
      updateSkaterToken(token, skater, snapshot);
    }
  }

  function showFocus(snapshot: ArenaBoardSnapshot) {
    const focus = snapshot.focus;
    const focusedCoord =
      focus?.kind === 'tile'
        ? focus.coord
        : snapshot.skaters.find((skater) => skater.id === focus?.skaterId)?.pos;
    focusFrame.visible = Boolean(focusedCoord);
    if (!focusedCoord) return;
    const center = tileCenter(focusedCoord);
    focusFrame.position.set(center.x, 0.02, center.z);
  }

  function cancelCameraMove() {
    if (cameraFrameId !== null) {
      cancelAnimationFrame(cameraFrameId);
      cameraFrameId = null;
    }
  }

  return {
    setViewport(viewport, pixelRatio) {
      hasViewport = viewport.width > 0 && viewport.height > 0;
      if (!hasViewport) return;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewport.width, viewport.height, false);
      camera.aspect = viewport.width / viewport.height;
      camera.updateProjectionMatrix();
      requestRender();
    },

    showBoard(snapshot) {
      showSkaters(snapshot);
      showHighlights(snapshot.highlighted);
      loosePuck.visible = snapshot.puck.kind === 'loose';
      if (snapshot.puck.kind === 'loose') {
        const center = tileCenter(snapshot.puck.pos);
        loosePuck.position.set(center.x, 0.035, center.z);
      }
      showFocus(snapshot);
      requestRender();
    },

    moveCamera(pose, durationMs, onSettled) {
      cancelCameraMove();
      const startPose = currentPose;
      if (!startPose || durationMs <= 0) {
        currentPose = pose;
        applyPose(camera, pose);
        requestRender();
        onSettled();
        return;
      }
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        currentPose = interpolatePose(
          startPose,
          pose,
          easeInOutCubic(progress),
        );
        applyPose(camera, currentPose);
        renderNow();
        if (progress < 1) {
          cameraFrameId = requestAnimationFrame(step);
          return;
        }
        cameraFrameId = null;
        onSettled();
      };
      cameraFrameId = requestAnimationFrame(step);
    },

    dispose() {
      cancelCameraMove();
      if (renderFrameId !== null) cancelAnimationFrame(renderFrameId);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
