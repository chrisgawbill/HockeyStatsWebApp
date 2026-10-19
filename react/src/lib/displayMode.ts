/** Device/display-mode checks shared across features (push, install banner). */

export function isIosDevice(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac with touch.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneDisplay(): boolean {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}
