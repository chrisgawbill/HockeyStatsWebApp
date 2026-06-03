/**
 * Current NHL season id (e.g. "20252026"). The season rolls over in October
 * (month index 9), so any later month belongs to the season starting that year.
 * Frontend twin of the backend `getCurrentSeasonId`.
 */
function getCurrentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 9 ? year : year - 1;
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
  getRecentSeasonIds,
  formatSeasonLabel,
};
