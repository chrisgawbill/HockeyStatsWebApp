import { useEffect } from 'react';

/**
 * Sets `<meta name="theme-color">` (the browser/installed-app system bar
 * tint) to `color` while the calling page is mounted, restoring the previous
 * value afterwards. Pages that tint their nav bars use it so the system bar
 * matches them.
 */
export function useThemeColor(color: string | null | undefined): void {
  useEffect(() => {
    if (!color) return;
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) return;
    const previous = meta.content;
    meta.content = color;
    return () => {
      meta.content = previous;
    };
  }, [color]);
}
