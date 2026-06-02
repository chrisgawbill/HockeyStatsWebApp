/**
 * Computes the current NHL season id from today's date. The season is named for
 * its two calendar years (e.g. "20252026") and rolls over in October, so any
 * month from October on belongs to the season starting that year.
 * @returns {string} The 8-digit season id for the season in progress now.
 */
function getCurrentSeasonId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 10 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

/**
 * Checks whether a string is a well-formed season id: exactly 8 digits whose
 * first four (start year) plus one equal the last four (end year).
 * @param {string} idStr
 * @returns {boolean}
 */
function isValidSeasonId(idStr) {
  return /^\d{8}$/.test(idStr) && parseInt(idStr.slice(0, 4)) + 1 === parseInt(idStr.slice(4, 8));
}

const INVALID_SEASON_MSG =
  "Invalid season format. Expected format is 'YYYYYYYY', where the first YYYY is the start year and the second YYYY is the end year (e.g., '20232024').";

/**
 * Express middleware for season-capable routes. Validates the optional
 * `?season=` query param, responds 400 if it is present but malformed, and
 * otherwise resolves it (falling back to the current season) onto `req.seasonId`
 * so handlers can read one value instead of repeating the validate-and-default
 * dance.
 */
function validateSeason(req, res, next) {
  const { season } = req.query;
  if (season && !isValidSeasonId(season)) {
    return res.status(400).send({ error: INVALID_SEASON_MSG });
  }
  req.seasonId = season || getCurrentSeasonId();
  next();
}

module.exports = {
  getCurrentSeasonId,
  isValidSeasonId,
  validateSeason,
  INVALID_SEASON_MSG,
};
