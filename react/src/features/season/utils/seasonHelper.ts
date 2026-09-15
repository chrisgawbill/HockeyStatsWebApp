/**
 * Current NHL season id (e.g. "20252026"). The season rolls over on September 1
 * (month index 8), so that month and any later one belongs to the season
 * starting that year. Frontend twin of the backend `getCurrentSeasonId`.
 * `now` is injectable so callers (and tests) can pin the date instead of
 * depending on the real clock.
 */
function getCurrentSeasonId(now: Date = new Date()): string {
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

/**
 * Returns true when `id` is an 8-digit NHL season id whose start year plus one
 * equals its end year.
 */
function isValidSeasonId(id: string): boolean {
  return (
    /^\d{8}$/.test(id) && Number(id.slice(0, 4)) + 1 === Number(id.slice(4))
  );
}

/**
 * Returns the calendar range `[start, end]` a season id spans: local midnight
 * September 1 of the start year through local midnight June 30 of the end
 * year. This is the season's real calendar boundary — independent of which
 * dates happen to have games loaded — so navigation/selection logic can be
 * bounded by the season itself rather than by the loaded schedule data.
 * Callers are expected to pass an already-valid `seasonId` (e.g. from
 * `useSeason()`); this does not re-validate the shape.
 */
function getSeasonDateRange(seasonId: string): [Date, Date] {
  const startYear = Number(seasonId.slice(0, 4));
  const endYear = Number(seasonId.slice(4));
  const start = new Date(startYear, 8, 1);
  const end = new Date(endYear, 5, 30);
  return [start, end];
}

/**
 * Returns the most recent `count` season ids, current season first.
 */
function getRecentSeasonIds(count: number = 10): string[] {
  const currentStart = Number(getCurrentSeasonId().slice(0, 4));
  return Array.from({ length: count }, (_, i) => {
    const start = currentStart - i;
    return `${start}${start + 1}`;
  });
}

/**
 * Formats a season id for display, e.g. "20252026" -> "2025–26"; malformed
 * ids pass through unchanged.
 */
function formatSeasonLabel(id: string): string {
  if (!isValidSeasonId(id)) return id;
  return `${id.slice(0, 4)}–${id.slice(6, 8)}`;
}

export {
  getCurrentSeasonId,
  isValidSeasonId,
  getSeasonDateRange,
  getRecentSeasonIds,
  formatSeasonLabel,
};
