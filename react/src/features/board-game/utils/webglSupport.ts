/** The slice of a canvas the WebGL probe needs, so tests can supply a fake. */
export interface ProbeCanvas {
  getContext(contextId: 'webgl2' | 'webgl'): unknown;
}

interface LoseContextExtension {
  loseContext(): void;
}

interface ProbeContext {
  getExtension?(name: string): unknown;
}

function createProbeCanvas(): ProbeCanvas | null {
  return typeof document === 'undefined'
    ? null
    : document.createElement('canvas');
}

/**
 * True when the browser can create a WebGL context, which the arena needs.
 * The probe context is released straight away so it does not count against
 * the browser's live-context limit. Any throw counts as unsupported.
 */
export function canRenderWebGL(
  createCanvas: () => ProbeCanvas | null = createProbeCanvas,
): boolean {
  try {
    const canvas = createCanvas();
    if (!canvas) return false;
    const context = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as ProbeContext | null;
    if (!context) return false;
    const loseContext = context.getExtension?.('WEBGL_lose_context') as
      LoseContextExtension | null | undefined;
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}
