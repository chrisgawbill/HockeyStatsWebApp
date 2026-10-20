type Rgb = [number, number, number];

/** Parses #rgb, #rrggbb, or rgb()/rgba() into channels; null otherwise. */
export function parseColor(value: string): Rgb | null {
  const text = value.trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1].replace(/./g, (digit) => digit + digit)
        : hex[1];
    return [0, 2, 4].map((start) =>
      parseInt(digits.slice(start, start + 2), 16),
    ) as Rgb;
  }
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** Blends `top` over `bottom`, where `topWeight` (0-1) is the top color's share. */
function mix(top: Rgb, bottom: Rgb, topWeight: number): Rgb {
  return top.map((channel, index) =>
    Math.round(channel * topWeight + bottom[index] * (1 - topWeight)),
  ) as Rgb;
}

/** Formats channels as a #rrggbb string. */
const toHex = (rgb: Rgb) =>
  `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

/**
 * The color at the top edge of the Aero-glass nav bar (PageHeader.module.css):
 * a 62% tint of `primary` over the page background, under a white sheen that
 * starts at 32%. The system status bar (`theme-color`) uses it so the two
 * read as one surface. Returns null if either color cannot be parsed.
 */
export function navTopEdgeColor(
  primary: string,
  background: string,
): string | null {
  const tint = parseColor(primary);
  const page = parseColor(background);
  if (!tint || !page) return null;
  const glass = mix(tint, page, 0.62);
  return toHex(mix([255, 255, 255], glass, 0.32));
}
