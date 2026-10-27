/**
 * Color checks for chart marks, following the data-viz method the charts are
 * built to: OKLCH lightness band and chroma floor per theme, 3:1 contrast
 * against the chart surface, and pair separation as OKLab distance ×100
 * under normal vision and simulated protanopia/deuteranopia (Machado,
 * Oliveira & Fernandes 2009, severity 1.0).
 */
export type ChartTheme = 'light' | 'dark';

type Rgb = [number, number, number];

/**
 * The chart cards as rendered (the glass surface with its overlay), at the
 * end that gives marks the least contrast: the darkest light card and the
 * lightest dark card.
 */
export const CHART_SURFACES: Record<ChartTheme, string> = {
  light: '#f4f3fb',
  dark: '#3a3c42',
};

const LIGHTNESS_BANDS: Record<ChartTheme, [number, number]> = {
  light: [0.43, 0.77],
  dark: [0.48, 0.67],
};
const CHROMA_FLOOR = 0.1;
const MIN_MARK_CONTRAST = 3;
const NORMAL_VISION_FLOOR = 15;
const CVD_TARGET = 8;
const LIGHTNESS_STEP = 0.01;

const CVD_MATRICES: Record<'protan' | 'deutan', [Rgb, Rgb, Rgb]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};

/** sRGB channel (0–1) to linear light. */
function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Linear light to an sRGB channel (0–1). */
function toGamma(channel: number): number {
  const clamped = Math.max(0, Math.min(1, channel));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

/** "#rrggbb" to linear RGB. */
function hexToLinearRgb(hex: string): Rgb {
  const digits = hex.replace('#', '');
  return [0, 2, 4].map((start) =>
    toLinear(parseInt(digits.slice(start, start + 2), 16) / 255),
  ) as Rgb;
}

/** Linear RGB to "#rrggbb". */
function linearRgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) =>
      Math.round(toGamma(channel) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Linear RGB to OKLab [L, a, b]. */
function linearRgbToOklab([red, green, blue]: Rgb): Rgb {
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );
  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ];
}

/** OKLab [L, a, b] to linear RGB (may fall outside 0–1 when out of gamut). */
function oklabToLinearRgb([lightness, a, b]: Rgb): Rgb {
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

/** OKLCH lightness, chroma and hue (radians) of a hex color. */
export function toOklch(hex: string): {
  lightness: number;
  chroma: number;
  hue: number;
} {
  const [lightness, a, b] = linearRgbToOklab(hexToLinearRgb(hex));
  return { lightness, chroma: Math.hypot(a, b), hue: Math.atan2(b, a) };
}

/** The hex color at an OKLCH point, lowering chroma until it fits in sRGB. */
function fromOklch(lightness: number, chroma: number, hue: number): string {
  const isInGamut = (rgb: Rgb) =>
    rgb.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);
  for (let fitted = chroma; fitted > 0; fitted -= 0.002) {
    const rgb = oklabToLinearRgb([
      lightness,
      fitted * Math.cos(hue),
      fitted * Math.sin(hue),
    ]);
    if (isInGamut(rgb)) return linearRgbToHex(rgb);
  }
  return linearRgbToHex(oklabToLinearRgb([lightness, 0, 0]));
}

/** WCAG 2 contrast ratio between two hex colors. */
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const [red, green, blue] = hexToLinearRgb(hex);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whether a color can mark a chart series in the theme: in the lightness band, chromatic, 3:1 on the surface. */
export function isUsableMarkColor(hex: string, theme: ChartTheme): boolean {
  const { lightness, chroma } = toOklch(hex);
  const [lowest, highest] = LIGHTNESS_BANDS[theme];
  return (
    lightness >= lowest - 0.005 &&
    lightness <= highest + 0.005 &&
    chroma >= CHROMA_FLOOR &&
    contrastRatio(hex, CHART_SURFACES[theme]) >= MIN_MARK_CONTRAST
  );
}

/**
 * A brand color moved, hue kept, into the theme's lightness band and to 3:1
 * contrast on the chart surface; null when it is too grey (black, silver,
 * white) or cannot get there.
 */
export function fitMarkColor(hex: string, theme: ChartTheme): string | null {
  const { lightness, chroma, hue } = toOklch(hex);
  if (chroma < CHROMA_FLOOR) return null;
  const [lowest, highest] = LIGHTNESS_BANDS[theme];
  const surface = CHART_SURFACES[theme];
  // Darker marks contrast with the light surface, lighter ones with the dark.
  const step = theme === 'light' ? -LIGHTNESS_STEP : LIGHTNESS_STEP;
  let fittedLightness = Math.min(highest, Math.max(lowest, lightness));
  let fitted = fromOklch(fittedLightness, chroma, hue);
  while (
    contrastRatio(fitted, surface) < MIN_MARK_CONTRAST &&
    fittedLightness + step >= lowest &&
    fittedLightness + step <= highest
  ) {
    fittedLightness += step;
    fitted = fromOklch(fittedLightness, chroma, hue);
  }
  return isUsableMarkColor(fitted, theme) ? fitted : null;
}

/** OKLab distance ×100, optionally as seen with a color-vision deficiency. */
function colorDistance(
  first: string,
  second: string,
  deficiency?: 'protan' | 'deutan',
): number {
  const perceive = (hex: string): Rgb => {
    const rgb = hexToLinearRgb(hex);
    if (!deficiency) return rgb;
    return CVD_MATRICES[deficiency].map((row) =>
      Math.max(
        0,
        Math.min(1, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]),
      ),
    ) as Rgb;
  };
  const [l1, a1, b1] = linearRgbToOklab(perceive(first));
  const [l2, a2, b2] = linearRgbToOklab(perceive(second));
  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Whether two series colors stay apart for full-color and red-green colorblind readers. */
export function areDistinctSeriesColors(
  first: string,
  second: string,
): boolean {
  return (
    colorDistance(first, second) >= NORMAL_VISION_FLOOR &&
    colorDistance(first, second, 'protan') >= CVD_TARGET &&
    colorDistance(first, second, 'deutan') >= CVD_TARGET
  );
}
