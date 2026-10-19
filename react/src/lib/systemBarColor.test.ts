import { describe, expect, it } from 'vitest';
import { navTopEdgeColor, parseColor } from '@/lib/systemBarColor';

describe('systemBarColor', () => {
  it('parses hex and rgb colors', () => {
    expect(parseColor('#3f5f90')).toEqual([63, 95, 144]);
    expect(parseColor(' #FFF ')).toEqual([255, 255, 255]);
    expect(parseColor('rgb(245, 242, 250)')).toEqual([245, 242, 250]);
    expect(parseColor('rgba(1 2 3 / 0.5)')).toEqual([1, 2, 3]);
    expect(parseColor('var(--x)')).toBeNull();
  });

  it('matches the nav glass top edge: sheen over a 62% tint over the page', () => {
    // Flyers orange on the light page background.
    expect(navTopEdgeColor('#FF4C00', '#f5f2fa')).toBe('#fcb092');
    // Default brand color on the dark page background.
    expect(navTopEdgeColor('#aec6ff', '#1a1b20')).toBe('#a2acc5');
    expect(navTopEdgeColor('nope', '#fff')).toBeNull();
  });
});
