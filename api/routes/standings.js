var express = require("express");
const { axiosNhl } = require("../services/nhlApiClient");
const { GetOrFetch, CACHE_TYPES } = require("../utils/cacheManager");

var router = express.Router();

async function fetchStandings() {
  const response = await axiosNhl.get("/standings/now");
  const standings = response.data.standings?.map((team) => ({
    ...team,
    clinchingIndicator: team.clinchingIndicator ?? team.clinchIndicator ?? "",
  }));
  return { ...response.data, standings };
}

router.get("/", async function (req, res, next) {
  try {
    const data = await GetOrFetch(CACHE_TYPES.STANDINGS, 'current', fetchStandings);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
