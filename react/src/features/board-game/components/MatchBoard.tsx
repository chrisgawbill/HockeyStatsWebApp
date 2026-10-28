import { lazy, Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type {
  ArenaCameraShot,
  ArenaCameraState,
  ArenaView,
} from '@/features/board-game/utils/arenaCamera';
import { canRenderWebGL } from '@/features/board-game/utils/webglSupport';
import RinkBoard, {
  type RinkBoardProps,
} from '@/features/board-game/components/RinkBoard';
import styles from '@/features/board-game/components/MatchBoard.module.css';

/** three.js and the arena scene load as their own chunk, after the match is already playable. */
const ArenaBoard = lazy(
  () => import('@/features/board-game/components/ArenaBoard'),
);

type BoardRenderer = 'arena' | 'fallback';

export interface MatchBoardProps extends RinkBoardProps {
  cameraShot: ArenaCameraShot;
  onCameraChange: (camera: ArenaCameraState) => void;
}

interface SettledRinkBoardProps extends RinkBoardProps {
  view: ArenaView;
  onCameraChange: (camera: ArenaCameraState) => void;
}

/**
 * The HTML rink, used while the arena loads and whenever WebGL is missing
 * or fails. It has no camera, so every view counts as settled at once.
 */
function SettledRinkBoard({
  view,
  onCameraChange,
  ...rinkProps
}: SettledRinkBoardProps) {
  useEffect(() => {
    onCameraChange({ view, settled: true });
  }, [view, onCameraChange]);
  return <RinkBoard {...rinkProps} />;
}

/**
 * Draws the match board: the dimensional arena by default, the HTML
 * `RinkBoard` while the arena chunk loads, and `RinkBoard` for good if
 * WebGL is unavailable, throws, or loses its context. Either way the board
 * reports only the same tile and skater callbacks, so the renderer can
 * never change what is dispatched.
 */
export default function MatchBoard({
  cameraShot,
  onCameraChange,
  renderSkater,
  ...boardProps
}: MatchBoardProps) {
  const [renderer, setRenderer] = useState<BoardRenderer>(() =>
    canRenderWebGL() ? 'arena' : 'fallback',
  );
  const fallbackBoard = (
    <SettledRinkBoard
      {...boardProps}
      renderSkater={renderSkater}
      view={cameraShot.view}
      onCameraChange={onCameraChange}
    />
  );

  return (
    <div className={styles.rendererSlot} data-board-renderer={renderer}>
      {renderer === 'fallback' ? (
        fallbackBoard
      ) : (
        <ErrorBoundary
          fallback={fallbackBoard}
          onError={() => setRenderer('fallback')}
        >
          <Suspense fallback={fallbackBoard}>
            <ArenaBoard
              {...boardProps}
              cameraShot={cameraShot}
              onCameraChange={onCameraChange}
              onRenderFailure={() => setRenderer('fallback')}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
