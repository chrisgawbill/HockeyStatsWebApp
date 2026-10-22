import { localTeamList } from '@/lib/teamListData';
import type { Theme } from '@/lib/themeSchedule';

/** A team's primary brand color by tri-code, with a neutral blue fallback. */
export function getTeamPrimaryColor(abbrev?: string): string {
  const normalizedAbbrev = abbrev?.toUpperCase();
  return (
    localTeamList.find((team) => team.triCode === normalizedAbbrev)?.primary ??
    '#1f5f99'
  );
}

/**
 * A team's primary color as an accent for the given theme: the brand color in
 * light mode, lightened to stay legible on dark surfaces.
 */
export function getTeamAccentColor(
  abbrev: string | undefined,
  theme: Theme,
): string {
  const primaryColor = getTeamPrimaryColor(abbrev);
  return theme === 'dark' ? toDarkModeAccentColor(primaryColor) : primaryColor;
}

/**
 * NHL brand colors are picked to read well on a light background — most sit
 * around 30-40% lightness, which is too dark/low-contrast once used as text
 * or an accent color on the app's dark theme. This mirrors how the app's own
 * `--color-primary` token gets lightened for dark mode (index.css: ~32% ->
 * ~60% lightness, same hue) so team-tinted text stays legible everywhere the
 * team color substitutes for `--color-primary` (TeamPage.tsx).
 */
export function toDarkModeAccentColor(hex: string, minLightness = 60): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(l, minLightness));
}

/** Expands a "#rgb" or "#rrggbb" color to six hex digits with no "#". */
function expandHexDigits(hex: string): string {
  const digits = hex.replace('#', '');
  return digits.length === 3
    ? digits
        .split('')
        .map((digit) => digit + digit)
        .join('')
    : digits;
}

/** Converts a hex color to hue (degrees), saturation (percent), lightness (percent). */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const digits = expandHexDigits(hex);
  const red = parseInt(digits.slice(0, 2), 16) / 255;
  const green = parseInt(digits.slice(2, 4), 16) / 255;
  const blue = parseInt(digits.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness * 100 };

  const spread = max - min;
  const saturation =
    lightness > 0.5 ? spread / (2 - max - min) : spread / (max + min);
  let hue: number;
  switch (max) {
    case red:
      hue = (green - blue) / spread + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / spread + 2;
      break;
    default:
      hue = (red - green) / spread + 4;
  }
  hue *= 60;

  return { h: hue, s: saturation * 100, l: lightness * 100 };
}

/** Converts hue (degrees), saturation (percent), lightness (percent) to a "#rrggbb" hex color. */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const saturationFraction = saturation / 100;
  const lightnessFraction = lightness / 100;
  const chroma = (1 - Math.abs(2 * lightnessFraction - 1)) * saturationFraction;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const lightnessOffset = lightnessFraction - chroma / 2;

  let [red, green, blue] = [0, 0, 0];
  if (hue < 60) [red, green, blue] = [chroma, secondary, 0];
  else if (hue < 120) [red, green, blue] = [secondary, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, secondary];
  else if (hue < 240) [red, green, blue] = [0, secondary, chroma];
  else if (hue < 300) [red, green, blue] = [secondary, 0, chroma];
  else [red, green, blue] = [chroma, 0, secondary];

  const toHex = (channel: number) =>
    Math.round((channel + lightnessOffset) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

/** Picks black or white text for readable contrast on a hex background (WCAG relative luminance). */
export function getContrastTextColor(hex: string): '#111111' | '#ffffff' {
  const digits = expandHexDigits(hex);
  const linearChannel = (start: number) => {
    const channel = parseInt(digits.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linearChannel(0) +
    0.7152 * linearChannel(2) +
    0.0722 * linearChannel(4);
  return luminance > 0.4 ? '#111111' : '#ffffff';
}
