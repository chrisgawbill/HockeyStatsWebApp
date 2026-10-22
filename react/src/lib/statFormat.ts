/** Display formats for NHL stat values shared by the roster dialog and player comparison. */

export const STAT_DASH = '—';

/** NHL style: three decimals, leading zero dropped (0.915 -> ".915"). */
export function formatSavePct(value: number | null): string {
  return value == null ? STAT_DASH : value.toFixed(3).replace(/^0\./, '.');
}

/** Goals-against average to two decimals, or a dash when missing. */
export function formatGaa(value: number | null): string {
  return value == null ? STAT_DASH : value.toFixed(2);
}

/** Plus/minus with an explicit + for positive values. */
export function formatPlusMinus(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** Seconds as "m:ss" (1324 -> "22:04"), or a dash when missing. */
export function formatMinutesSeconds(totalSeconds: number | null): string {
  if (totalSeconds == null) return STAT_DASH;
  const roundedSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
