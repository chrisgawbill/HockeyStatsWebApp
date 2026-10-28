import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type RefObject,
} from 'react';
import type { Coord, Puck, Skater } from '@/features/board-game/types/game';
import { useIsNarrow } from '@/features/board-game/hooks/useIsNarrow';
import {
  cameraPoseFor,
  cameraTransitionMs,
  tacticalPose,
  tileScreenRect,
  type ArenaCameraShot,
  type ArenaCameraState,
  type CameraPose,
  type Viewport,
} from '@/features/board-game/utils/arenaCamera';
import {
  coordKey,
  focusNextRinkTile,
  skaterControlLabel,
} from '@/features/board-game/utils/rinkControls';
import {
  createArenaScene,
  type ArenaFocus,
  type ArenaScene,
} from '@/features/board-game/components/arenaScene';
import styles from '@/features/board-game/components/ArenaBoard.module.css';

/** Highest device pixel ratio the arena renders at; sharper costs too much fill rate on phones. */
const MAX_PIXEL_RATIO = 2;

export interface ArenaBoardProps {
  skaters: Skater[];
  puck: Puck;
  highlighted: Coord[];
  selectedId: string | null;
  onTileClick: (coord: Coord) => void;
  onSkaterClick: (id: string) => void;
  /** The camera the match wants; derived from game state by the caller. */
  cameraShot: ArenaCameraShot;
  /** Reports each camera move's start (not settled) and finish (settled). */
  onCameraChange: (camera: ArenaCameraState) => void;
  /** WebGL failed to start or lost its context; the caller should fall back. */
  onRenderFailure: () => void;
}

/** Size of the element, kept current with a ResizeObserver. */
function useElementSize(elementRef: RefObject<HTMLElement>): Viewport {
  const [size, setSize] = useState<Viewport>({ width: 0, height: 0 });
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return size;
}

/** Absolute placement of a square hit target over a projected tile. */
function hitTargetStyle(
  coord: Coord,
  pose: CameraPose,
  viewport: Viewport,
): CSSProperties {
  const rect = tileScreenRect(coord, pose, viewport);
  return {
    left: rect.x - rect.size / 2,
    top: rect.y - rect.size / 2,
    width: rect.size,
    height: rect.size,
  };
}

/** Mirrors keyboard focus (not pointer focus) into the scene's focus frame. */
function keyboardFocusFrom(
  event: FocusEvent<HTMLButtonElement>,
  focus: ArenaFocus,
): ArenaFocus | null {
  return event.currentTarget.matches(':focus-visible') ? focus : null;
}

/**
 * The match board drawn as a three.js rink inside a simple arena. The
 * canvas is decoration only: every operable tile and skater is a real HTML
 * button laid over its projected position, with the same names, states and
 * arrow-key navigation as `RinkBoard`. Camera moves are presentation only
 * and are reported through `onCameraChange` so timing controls can wait for
 * the camera to settle.
 */
export default function ArenaBoard({
  skaters,
  puck,
  highlighted,
  selectedId,
  onTileClick,
  onSkaterClick,
  cameraShot,
  onCameraChange,
  onRenderFailure,
}: ArenaBoardProps) {
  const orientation = useIsNarrow() ? 'tall' : 'wide';
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const viewport = useElementSize(containerRef);
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState<ArenaCameraState>({
    view: cameraShot.view,
    settled: true,
  });
  const [focus, setFocus] = useState<ArenaFocus | null>(null);
  const shownViewRef = useRef(cameraShot.view);
  const callbacksRef = useRef({ onCameraChange, onRenderFailure });
  callbacksRef.current = { onCameraChange, onRenderFailure };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: ArenaScene;
    try {
      scene = createArenaScene(canvas, {
        onFirstFrame: () => setReady(true),
        onContextLost: () => callbacksRef.current.onRenderFailure(),
      });
    } catch {
      callbacksRef.current.onRenderFailure();
      return;
    }
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.dispose();
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setViewport(
      viewport,
      Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    );
  }, [viewport]);

  useEffect(() => {
    sceneRef.current?.showBoard({
      skaters,
      puck,
      highlighted,
      selectedId,
      focus,
    });
  }, [skaters, puck, highlighted, selectedId, focus]);

  const shooterPos = skaters.find(
    (skater) => skater.id === cameraShot.shooterId,
  )?.pos;
  const cameraPose = useMemo(
    () => cameraPoseFor(cameraShot, skaters, orientation, viewport),
    // The pose depends only on the shooter's tile, not every skater update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cameraShot.view,
      cameraShot.shooterId,
      shooterPos?.col,
      shooterPos?.row,
      orientation,
      viewport,
    ],
  );

  useEffect(() => {
    const view = cameraShot.view;
    const reportCamera = (next: ArenaCameraState) => {
      setCamera(next);
      callbacksRef.current.onCameraChange(next);
    };
    const scene = sceneRef.current;
    if (!scene || viewport.width === 0 || viewport.height === 0) {
      // Nothing visible to move: never hold the timing control back.
      shownViewRef.current = view;
      reportCamera({ view, settled: true });
      return;
    }
    const durationMs = cameraTransitionMs(
      shownViewRef.current,
      view,
      reducedMotion,
    );
    shownViewRef.current = view;
    if (durationMs > 0) reportCamera({ view, settled: false });
    scene.moveCamera(cameraPose, durationMs, () =>
      reportCamera({ view, settled: true }),
    );
    // Only a new pose moves the camera; the view is part of that pose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPose]);

  const overlayPose = useMemo(
    () => tacticalPose(orientation, viewport),
    [orientation, viewport],
  );
  const showsBoardControls =
    cameraShot.view === 'tactical' && viewport.width > 0;
  const carrierId = puck.kind === 'carried' ? puck.skaterId : null;
  const containerClassName = [
    styles.arena,
    orientation === 'tall' ? styles.arenaTall : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      data-arena-ready={ready ? 'true' : 'false'}
      data-arena-view={camera.view}
      data-arena-settled={camera.settled ? 'true' : 'false'}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      {showsBoardControls && (
        <div className={styles.controls}>
          {highlighted.map((coord) => (
            <button
              key={coordKey(coord)}
              type="button"
              className={styles.hitTarget}
              style={hitTargetStyle(coord, overlayPose, viewport)}
              data-rink-tile={coordKey(coord)}
              aria-label={`Move to tile ${coord.col},${coord.row}`}
              onClick={() => onTileClick(coord)}
              onKeyDown={(event) =>
                focusNextRinkTile(event, coord, highlighted)
              }
              onFocus={(event) =>
                setFocus(keyboardFocusFrom(event, { kind: 'tile', coord }))
              }
              onBlur={() => setFocus(null)}
            />
          ))}
          {skaters.map((skater) => (
            <button
              key={skater.id}
              type="button"
              className={`${styles.hitTarget} ${styles.skaterTarget}`}
              style={hitTargetStyle(skater.pos, overlayPose, viewport)}
              aria-pressed={skater.id === selectedId}
              aria-label={skaterControlLabel(skater, skater.id === carrierId)}
              onClick={() => onSkaterClick(skater.id)}
              onFocus={(event) =>
                setFocus(
                  keyboardFocusFrom(event, {
                    kind: 'skater',
                    skaterId: skater.id,
                  }),
                )
              }
              onBlur={() => setFocus(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
