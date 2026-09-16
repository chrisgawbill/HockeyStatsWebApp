import { describe, expect, it } from 'vitest';
import { toDarkModeAccentColor } from '@/features/teams/utils/teamColor';

describe('toDarkModeAccentColor', () => {
  it('lightens a dark, saturated color up to the floor', () => {
    expect(toDarkModeAccentColor('#8b0000', 60)).toBe('#ff3333');
  });

  it('leaves an already-light color unchanged', () => {
    expect(toDarkModeAccentColor('#ffffff', 60)).toBe('#ffffff');
  });

  it('preserves hue while raising lightness', () => {
    // #1b4f8a (the app's own light-mode primary) -> ~60% lightness, same hue
    // as its own hand-picked dark-mode primary (#5b9bd5).
    const result = toDarkModeAccentColor('#1b4f8a', 60);
    expect(result.toLowerCase()).toBe('#5495de');
  });
});
