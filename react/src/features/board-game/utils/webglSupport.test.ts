import { describe, expect, it, vi } from 'vitest';
import { canRenderWebGL } from '@/features/board-game/utils/webglSupport';

describe('WebGL support probe', () => {
  it('accepts a WebGL2 context and releases it straight away', () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    const getContext = vi.fn(() => ({ getExtension }));

    expect(canRenderWebGL(() => ({ getContext }))).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    expect(loseContext).toHaveBeenCalled();
  });

  it('falls back to WebGL1 when WebGL2 is missing', () => {
    const getContext = vi.fn((contextId: string) =>
      contextId === 'webgl' ? {} : null,
    );
    expect(canRenderWebGL(() => ({ getContext }))).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl');
  });

  it('reports no support without a context, a canvas, or when probing throws', () => {
    expect(canRenderWebGL(() => ({ getContext: () => null }))).toBe(false);
    expect(canRenderWebGL(() => null)).toBe(false);
    expect(
      canRenderWebGL(() => {
        throw new Error('blocked');
      }),
    ).toBe(false);
  });

  it('reports no support outside a browser', () => {
    expect(canRenderWebGL()).toBe(false);
  });
});
