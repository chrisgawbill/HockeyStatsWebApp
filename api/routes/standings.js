var express = require('express');
const { axiosNhl } = require('../services/nhlApiClient');
const { GetOrFetch, CACHE_TYPES } = require('../utils/cacheManager');
const { getCurrentSeasonId, validateSeason } = require('../utils/seasonHelper');
const { mapStandingsTeam } = require('../services/mappers/standingsMapper');

var router = express.Router();

/**
 * The NHL standings endpoint takes a date, not a seasonId. The standings-season
 * index lists each season's final date (standingsEnd), so we translate a season
 * into the date we should ask for.
 * @param {string} season
 * @returns {Promise<string|null>} YYYY-MM-DD end date, or null if season unknown
 */
async function getSeasonEndDate(season) {
  const data = await GetOrFetch(CACHE_TYPES.STANDINGS, 'season-index', () =>
    axiosNhl.get('/standings-season').then((r) => r.data),
  );
  const match = (data.seasons ?? []).find(
    (s) => String(s.id) === String(season),
  );
  return match?.standingsEnd ?? null;
}

/**
 * Fetches raw NHL standings for a season. Since the NHL endpoint is date-based,
 * the current season uses the live `/standings/now` route while a past season is
 * translated to its settled end date. An unknown past season yields empty
 * standings rather than an error.
 * @param {string} season
 * @returns {Promise<{ standings: any[] }>} Raw, unmapped standings payload.
 */
async function fetchStandings(season) {
  if (season === getCurrentSeasonId()) {
    const response = await axiosNhl.get('/standings/now');
    return response.data;
  }
  const endDate = await getSeasonEndDate(season);
  if (!endDate) return { standings: [] };
  const response = await axiosNhl.get(`/standings/${endDate}`);
  return response.data;
}

/**
 * GET /standings/?season=
 * Reads a validated season from `req.seasonId`, fetches/caches the raw NHL
 * standings payload for the correct standings date, and returns the original
 * payload with `standings` replaced by normalized StandingsTeamContract rows.
 */
router.get('/', validateSeason, async function (req, res, next) {
  try {
    const seasonId = req.seasonId;
    const data = await GetOrFetch(CACHE_TYPES.STANDINGS, seasonId, () =>
      fetchStandings(seasonId),
    );
    const standings = (data.standings ?? [])
      .map(mapStandingsTeam)
      .filter(Boolean);
    res.send({ ...data, standings });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
