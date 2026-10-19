import { describe, expect, it } from 'vitest';
import {
  getContrastTextColor,
  toDarkModeAccentColor,
} from '@/features/teams/utils/teamColor';

describe('teamColor', () => {
  it('toDarkModeAccentColor raises lightness to the floor, keeping hue', () => {
    expect(toDarkModeAccentColor('#8b0000', 60)).toBe('#ff3333');
    // Already light: unchanged.
    expect(toDarkModeAccentColor('#ffffff', 60)).toBe('#ffffff');
    // #1b4f8a (the app's light-mode primary) -> ~60% lightness, same hue as
    // its hand-picked dark-mode primary (#5b9bd5).
    expect(toDarkModeAccentColor('#1b4f8a', 60).toLowerCase()).toBe('#5495de');
  });

  it('getContrastTextColor uses white on dark colors and near-black on light', () => {
    expect(getContrastTextColor('#0b2545')).toBe('#ffffff');
    expect(getContrastTextColor('#ffb81c')).toBe('#111111');
  });
});
