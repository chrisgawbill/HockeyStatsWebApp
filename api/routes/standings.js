var express = require("express");
const { axiosNhl } = require("../services/nhlApiClient");
const { GetOrFetch, CACHE_TYPES } = require("../utils/cacheManager");
const { mapStandingsTeam } = require("../services/mappers/standingsMapper");

var router = express.Router();

async function fetchStandings() {
  const response = await axiosNhl.get("/standings/now");
  return response.data;
}

router.get("/", async function (req, res, next) {
  try {
    const data = await GetOrFetch(CACHE_TYPES.STANDINGS, 'current', fetchStandings);
    const standings = (data.standings ?? [])
      .map(mapStandingsTeam)
      .filter(Boolean);
    res.send({ ...data, standings });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
