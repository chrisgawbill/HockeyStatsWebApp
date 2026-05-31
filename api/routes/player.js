var express = require("express");
const { getCurrentSeasonId } = require("../utils/seasonHelper");
const { axiosNhl, axiosNhlStats, axiosNhlGoalie } = require("../services/nhlApiClient");
const { GetOrFetch, CACHE_TYPES } = require("../utils/cacheManager");
const {
  mapSkaterSummary,
  mapGoalieSummary,
  mapStatLeaders,
} = require("../services/mappers/playerMapper");

var router = express.Router();

router.get("/skater/statLeaders/:statIndicator", async function (req, res, next) {
  try {
    const { statIndicator } = req.params;
    const raw = await GetOrFetch(
      CACHE_TYPES.STAT_LEADERS,
      `skater_${statIndicator}`,
      () => axiosNhl.get(`/skater-stats-leaders/current?categories=${statIndicator}&limit=10`).then(r => r.data)
    );
    res.send(mapStatLeaders(raw, statIndicator));
  } catch (e) {
    next(e);
  }
});

router.get("/goalie/statLeaders/:statIndicator", async function (req, res, next) {
  try {
    const { statIndicator } = req.params;
    const raw = await GetOrFetch(
      CACHE_TYPES.STAT_LEADERS,
      `goalie_${statIndicator}`,
      () => axiosNhl.get(`/goalie-stats-leaders/current?categories=${statIndicator}&limit=10`).then(r => r.data)
    );
    res.send(mapStatLeaders(raw, statIndicator));
  } catch (e) {
    next(e);
  }
});

// G, A, P, +/-, PIM, FO% — optional ?teamId=4 &season=20252026
router.get("/skater/summary", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const raw = await GetOrFetch(
      CACHE_TYPES.PLAYER,
      `skater_summary_${teamId || "all"}_${seasonId}`,
      () => axiosNhlStats.get(`/summary?cayenneExp=${encodeURIComponent(exp)}&limit=100`).then(r => r.data)
    );
    res.send(mapSkaterSummary(raw));
  } catch (e) {
    next(e);
  }
});

// Corsi (SAT%) — optional ?teamId=4 &season=20252026
router.get("/skater/corsi", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const data = await GetOrFetch(
      CACHE_TYPES.PLAYER,
      `skater_corsi_${teamId || "all"}_${seasonId}`,
      () => axiosNhlStats.get(`/percentages?cayenneExp=${encodeURIComponent(exp)}&limit=100`).then(r => r.data)
    );
    res.send(data);
  } catch (e) {
    next(e);
  }
});

router.get("/goalie/summary", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const raw = await GetOrFetch(
      CACHE_TYPES.PLAYER,
      `goalie_summary_${teamId || "all"}_${seasonId}`,
      () => axiosNhlGoalie.get(`/summary?cayenneExp=${encodeURIComponent(exp)}&limit=10`).then(r => r.data)
    );
    res.send(mapGoalieSummary(raw));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
