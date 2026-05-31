var express = require("express");
const { axiosNhl } = require("../services/nhlApiClient");
const { GetOrFetch, writeCache, CACHE_TYPES } = require("../utils/cacheManager");

var router = express.Router();

async function fetchSeasonSchedule() {
  const today = new Date();
  const seasonStartYear = today.getMonth() >= 9 ? today.getFullYear() : today.getFullYear() - 1;
  const startDate = new Date(`${seasonStartYear}-10-01`);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 28);

  const weekDates = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    weekDates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 7);
  }

  const responses = await Promise.all(
    weekDates.map(date => axiosNhl.get(`/schedule/${date}`).catch(() => null))
  );

  const allGameWeeks = [];
  for (const resp of responses) {
    if (resp?.data?.gameWeek) allGameWeeks.push(...resp.data.gameWeek);
  }
  return { gameWeek: allGameWeeks };
}

async function refreshScheduleCache() {
  try {
    const data = await fetchSeasonSchedule();
    await writeCache(CACHE_TYPES.SCHEDULE, 'season', data);
    console.log('Schedule cache refreshed at', new Date().toISOString());
  } catch (e) {
    console.error('Failed to refresh schedule cache:', e);
  }
}

router.get("/", async function (req, res, next) {
  try {
    const data = await GetOrFetch(CACHE_TYPES.SCHEDULE, 'season', fetchSeasonSchedule);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

router.get("/landing/:gameID", async function (req, res, next) {
  try {
    const url = `/gamecenter/${req.params.gameID}/landing`;
    const response = await axiosNhl.get(url);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/:gameID", async function (req, res, next) {
  try {
    const url = `/gamecenter/${req.params.gameID}/boxscore`;
    const response = await axiosNhl.get(url);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

module.exports = { router, refreshScheduleCache };
