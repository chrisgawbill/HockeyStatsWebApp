/**
 * Date/time primitives shared across features (schedule, teams, game-detail).
 * Take bare strings rather than a feature's game model, so lib/ has no reason
 * to import feature types for these.
 */

/**
 * Parses a "YYYY-MM-DD" string into a Date in the viewer's local time zone.
 * `new Date("YYYY-MM-DD")` parses as UTC and can land on the previous day once
 * rendered locally, so we split the parts and build the date by hand. Throws a
 * TypeError on a missing or malformed string rather than returning Invalid Date.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) {
    throw new TypeError('Date string is missing or empty.');
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new TypeError(
      `Invalid date format: ${dateStr}. Expected 'YYYY-MM-DD'.`,
    );
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

/**
 * Converts a UTC timestamp string into the viewer's local "h:mm AM/PM" display
 * label (e.g. a game's puck-drop time).
 */
export function formatLocalTime(utcString: string): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(utcString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

/**
 * Formats a "YYYY-MM-DD" calendar date string as a local long-form date (e.g.
 * "October 9, 2025"), parsed via parseLocalDate to avoid UTC shift.
 */
export function formatLongDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
