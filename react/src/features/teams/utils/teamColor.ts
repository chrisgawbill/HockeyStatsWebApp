import { localTeamList } from '@/lib/teamListData';

export function getTeamPrimaryColor(abbrev?: string): string {
  const normalizedAbbrev = abbrev?.toUpperCase();
  return (
    localTeamList.find((team) => team.triCode === normalizedAbbrev)?.primary ??
    '#1f5f99'
  );
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

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
