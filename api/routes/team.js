var express = require("express");
const { getCurrentSeasonId } = require("../utils/seasonHelper");
const { axiosNhl, axiosNhlTeam } = require("../services/nhlApiClient");
const { GetOrFetch, CACHE_TYPES } = require("../utils/cacheManager");

var router = express.Router();

router.get("/roster/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = getCurrentSeasonId();
    const data = await GetOrFetch(
      CACHE_TYPES.ROSTER,
      `${triCode}_${season}`,
      () => axiosNhl.get(`/roster/${triCode}/${season}`).then(r => r.data)
    );
    res.send(data);
  } catch (e) {
    next(e);
  }
});

router.get("/schedule/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = req.query.season || getCurrentSeasonId();
    const response = await axiosNhl.get(`/club-schedule-season/${triCode}/${season}`);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async function (req, res, next) {
  try {
    const url = "/summary?sort=shotsForPerGame&cayenneExp=seasonId=20232024 and gameTypeId=2";
    const response = await axiosNhlTeam.get(url);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/:teamId?", async function (req, res, next) {
  try {
    const { teamId } = req.params;
    const season = req.query.season || getCurrentSeasonId();
    const cayenneExp = teamId
      ? `teamId%3D${teamId}%20and%20seasonId%3D${season}%20and%20gameTypeId%3D2`
      : `seasonId%3D${season}%20and%20gameTypeId%3D2`;
    const response = await axiosNhlTeam.get(`/summary?cayenneExp=${cayenneExp}`);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
